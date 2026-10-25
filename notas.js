/* Umbrela — conforto de escrita nas anotações + indicador de salvamento.
   Complementa o app.js sem alterar a lógica de dados: tudo aqui é visual/ergonômico.
   - campos de texto crescem conforme o conteúdo (sem barra de rolagem interna);
   - contador de caracteres/palavras e botão "Ampliar" (editor em tela cheia) nas anotações;
   - indicador discreto "Salvo às HH:MM" (nuvem ou neste aparelho).
   O editor ampliado escreve de volta no campo original disparando o evento "input",
   então o salvamento automático e o histórico do app continuam funcionando igual. */
(function () {
  "use strict";

  /* ------------------------- auto-ajuste de altura ------------------------- */
  function autosize(ta) {
    if (!ta || !ta.isConnected) return;
    ta.style.height = "auto";
    const max = Math.round(window.innerHeight * 0.75);
    ta.style.height = Math.min(ta.scrollHeight + 2, max) + "px";
    ta.style.overflowY = ta.scrollHeight + 2 > max ? "auto" : "hidden";
  }

  function contar(txt) {
    const t = String(txt || "").trim();
    return { chars: String(txt || "").length, palavras: t ? t.split(/\s+/).length : 0 };
  }

  function textoContador(txt) {
    const c = contar(txt);
    if (!c.chars) return "Vazio";
    return c.palavras + (c.palavras === 1 ? " palavra" : " palavras") + " · " + c.chars + " caracteres";
  }

  function rotuloDe(ta) {
    const f = ta.closest(".f, .diario-campo, .timeline-card");
    const lab = f && f.querySelector("label");
    const campo = ta.closest(".diario-campo");
    const labCampo = campo && campo.querySelector(":scope > label");
    const dataEl = ta.closest(".diario-item") && ta.closest(".diario-item").querySelector('input[type="date"]');
    const base = (labCampo || lab || {}).textContent || ta.getAttribute("aria-label") || "Anotação";
    const data = dataEl && dataEl.value ? " — " + dataEl.value.split("-").reverse().join("/") : "";
    return base.trim().slice(0, 120) + data;
  }

  /* ------------------------- inserção, ditado e modelos ------------------------- */
  function inserir(ta, texto) {
    if (!ta || !ta.isConnected) return;
    const ini = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    const fim = ta.selectionEnd == null ? ini : ta.selectionEnd;
    const antes = ta.value.slice(0, ini), depois = ta.value.slice(fim);
    const sep = antes && !/[\s]$/.test(antes) ? " " : "";
    ta.value = antes + sep + texto + depois;
    const pos = (antes + sep + texto).length;
    try { ta.setSelectionRange(pos, pos); } catch (e) { /* ignora */ }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function lerLS(chave, padrao) { try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravarLS(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ } }

  const MODELOS_PADRAO = [
    { nome: "Visita domiciliar", texto: "Visita domiciliar realizada em {data}. Família recebida por ____. Observado: ____. Demandas apresentadas: ____. Combinado: ____." },
    { nome: "Atendimento individual", texto: "Atendimento individual em {data}. Motivo da procura: ____. Escuta: ____. Encaminhamentos e combinados: ____." },
    { nome: "Contato telefônico", texto: "Contato telefônico em {data} com ____. Assunto: ____. Resultado: ____." },
    { nome: "Ausência / não localizado", texto: "Em {data}, tentativa de contato/visita sem sucesso (família não localizada/ausente). Nova tentativa prevista para ____." },
    { nome: "Encaminhamento à rede", texto: "Encaminhada/o em {data} ao serviço ____ (motivo: ____). Aguardando retorno / contrarreferência." },
    { nome: "Atividade em grupo PAIF", texto: "Participação em grupo/oficina do PAIF em {data}. Tema: ____. Participação observada: ____." }
  ];
  const hojeBR = () => new Date().toLocaleDateString("pt-BR");

  let popoverAberto = null;
  function fecharPopover() { if (popoverAberto) { popoverAberto.remove(); popoverAberto = null; document.removeEventListener("mousedown", foraPopover, true); } }
  function foraPopover(e) { if (popoverAberto && !popoverAberto.contains(e.target) && !e.target.closest(".nota-modelos-btn")) fecharPopover(); }

  function abrirModelos(btn, alvo) {
    fecharPopover();
    const pop = document.createElement("div");
    pop.className = "nota-modelos";
    const desenhar = () => {
      const meus = lerLS("umbrela_modelos", []);
      const item = (m, i, custom) => '<div class="nota-modelo-item"><button type="button" class="nota-modelo-usar" data-u="' + (custom ? "c" : "p") + i + '">' +
        '<strong></strong><span></span></button>' + (custom ? '<button type="button" class="nota-modelo-del" data-d="' + i + '" aria-label="Excluir modelo" title="Excluir modelo">×</button>' : "") + "</div>";
      pop.innerHTML = '<div class="nota-modelos-tit">Modelos de texto</div>' +
        MODELOS_PADRAO.map((m, i) => item(m, i, false)).join("") +
        (meus.length ? '<div class="nota-modelos-tit">Meus modelos</div>' + meus.map((m, i) => item(m, i, true)).join("") : "") +
        '<div class="nota-modelos-novo"><button type="button" data-salvar>+ Salvar o texto deste campo como modelo</button></div>';
      const todos = { p: MODELOS_PADRAO, c: meus };
      pop.querySelectorAll("[data-u]").forEach(b => {
        const m = todos[b.dataset.u[0]][Number(b.dataset.u.slice(1))];
        b.querySelector("strong").textContent = m.nome;
        b.querySelector("span").textContent = m.texto.replace(/\{data\}/g, hojeBR()).slice(0, 80) + "…";
        b.onclick = () => { inserir(alvo, m.texto.replace(/\{data\}/g, hojeBR())); fecharPopover(); alvo.focus(); };
      });
      pop.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const l = lerLS("umbrela_modelos", []); l.splice(Number(b.dataset.d), 1); gravarLS("umbrela_modelos", l); desenhar(); });
      pop.querySelector("[data-salvar]").onclick = () => {
        const txt = alvo.value.trim();
        if (!txt) { window.alert("Escreva algo no campo antes de salvar como modelo."); return; }
        if (/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(txt) && !window.confirm("O texto parece conter um CPF. Modelos ficam salvos neste aparelho — salvar mesmo assim?")) return;
        const nome = window.prompt("Nome do modelo:", "");
        if (!nome || !nome.trim()) return;
        const l = lerLS("umbrela_modelos", []);
        l.push({ nome: nome.trim().slice(0, 40), texto: txt.slice(0, 2000) });
        gravarLS("umbrela_modelos", l); desenhar();
      };
    };
    desenhar();
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + "px";
    const abaixo = r.bottom + 6;
    pop.style.top = (abaixo + pop.offsetHeight > window.innerHeight - 8 ? Math.max(8, r.top - pop.offsetHeight - 6) : abaixo) + "px";
    popoverAberto = pop;
    setTimeout(() => document.addEventListener("mousedown", foraPopover, true), 0);
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recAtual = null;
  function pararDitado() { if (recAtual) { try { recAtual.stop(); } catch (e) { /* ignora */ } } }
  function alternarDitado(alvo, btn) {
    if (recAtual) { pararDitado(); return; }
    if (!gravarAvisoVoz()) return;
    const rec = new SR();
    rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) inserir(alvo, e.results[i][0].transcript.trim());
      }
    };
    rec.onerror = (e) => { if (e.error === "not-allowed") window.alert("Permita o uso do microfone no navegador para ditar."); };
    rec.onend = () => { recAtual = null; btn.classList.remove("gravando"); btn.textContent = "🎤 Ditar"; };
    try { rec.start(); recAtual = rec; btn.classList.add("gravando"); btn.textContent = "⏹ Parar"; } catch (e) { recAtual = null; }
  }
  function gravarAvisoVoz() {
    if (lerLS("umbrela_aviso_voz", false)) return true;
    const ok = window.confirm("O ditado usa o reconhecimento de voz do navegador, que pode enviar o áudio a servidores externos (ex.: Google, no Chrome).\n\nPor causa do sigilo profissional, evite ditar nomes completos, CPF, endereços ou outros dados que identifiquem a família.\n\nUsar o ditado mesmo assim?");
    if (ok) gravarLS("umbrela_aviso_voz", true);
    return ok;
  }

  function ferramentas(alvo) {
    const box = document.createElement("span");
    box.className = "nota-ferramentas";
    const mod = document.createElement("button");
    mod.type = "button"; mod.className = "nota-ampliar nota-modelos-btn"; mod.textContent = "📋 Modelos";
    mod.title = "Inserir um texto-modelo no cursor";
    mod.addEventListener("click", () => abrirModelos(mod, alvo));
    box.appendChild(mod);
    if (SR) {
      const mic = document.createElement("button");
      mic.type = "button"; mic.className = "nota-ampliar nota-mic"; mic.textContent = "🎤 Ditar";
      mic.title = "Escrever falando (pt-BR)";
      mic.addEventListener("click", () => alternarDitado(alvo, mic));
      box.appendChild(mic);
    }
    return box;
  }

  /* ------------------------- editor ampliado ------------------------- */
  let editorAberto = null;
  function ampliar(ta) {
    if (editorAberto) return;
    const anteriorFoco = document.activeElement;
    const ov = document.createElement("div");
    ov.className = "nota-editor";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Editor ampliado");
    ov.innerHTML =
      '<div class="nota-editor-caixa">' +
      '<div class="nota-editor-topo"><strong></strong><span class="nota-editor-dica">Esc ou Ctrl+Enter para concluir</span></div>' +
      '<textarea class="nota-editor-area" spellcheck="true"></textarea>' +
      '<div class="nota-editor-rodape"><span class="nota-contador"></span>' +
      '<button type="button" class="btn btn-primary">Concluir</button></div></div>';
    ov.querySelector("strong").textContent = rotuloDe(ta);
    const area = ov.querySelector("textarea");
    area.value = ta.value;
    area.placeholder = ta.placeholder || "";
    const cont = ov.querySelector(".nota-contador");
    cont.textContent = textoContador(area.value);
    cont.insertAdjacentElement("afterend", ferramentas(area));

    const sincroniza = () => {
      if (!ta.isConnected) return;
      ta.value = area.value;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    };
    area.addEventListener("input", () => { cont.textContent = textoContador(area.value); sincroniza(); });
    const fechar = () => {
      pararDitado(); fecharPopover();
      document.removeEventListener("keydown", tecla, true);
      sincroniza();
      ov.remove();
      editorAberto = null;
      if (ta.isConnected) { autosize(ta); ta.focus(); }
      else if (anteriorFoco && anteriorFoco.focus) anteriorFoco.focus();
    };
    function tecla(e) {
      if (e.key === "Escape" || ((e.ctrlKey || e.metaKey) && e.key === "Enter")) { e.preventDefault(); e.stopPropagation(); fechar(); }
    }
    document.addEventListener("keydown", tecla, true);
    ov.querySelector("button").addEventListener("click", fechar);
    ov.addEventListener("mousedown", (e) => { if (e.target === ov) fechar(); });
    document.body.appendChild(ov);
    editorAberto = ov;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }

  /* ------------------------- melhoria dos campos ------------------------- */
  function melhorar(ta) {
    if (ta.dataset.notasOk) { autosize(ta); return; }
    ta.dataset.notasOk = "1";
    ta.addEventListener("input", () => autosize(ta));
    autosize(ta);

    const emTabela = ta.closest(".dyn-table, .anexo-card");
    const rows = parseInt(ta.getAttribute("rows") || "2", 10);
    if (emTabela || rows < 2 || ta.classList.contains("nota-editor-area")) return;
    if (ta.nextElementSibling && ta.nextElementSibling.classList.contains("nota-rodape")) return;

    const rod = document.createElement("div");
    rod.className = "nota-rodape";
    rod.innerHTML = '<span class="nota-contador"></span><span class="nota-acoes"><button type="button" class="nota-ampliar nota-btn-ampliar" title="Abrir em tela cheia para escrever com mais conforto">⤢ Ampliar</button></span>';
    const cont = rod.querySelector(".nota-contador");
    rod.querySelector(".nota-acoes").prepend(ferramentas(ta));
    const atualiza = () => { cont.textContent = textoContador(ta.value); };
    atualiza();
    ta.addEventListener("input", atualiza);
    rod.querySelector(".nota-btn-ampliar").addEventListener("click", () => ampliar(ta));
    ta.insertAdjacentElement("afterend", rod);
  }

  function varrer() {
    const main = document.getElementById("mainArea");
    if (!main) return;
    main.querySelectorAll("textarea").forEach(melhorar);
  }

  let agendado = false;
  function agendarVarredura() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; varrer(); });
  }

  /* ------------------------- indicador de salvamento ------------------------- */
  let pill, timerPill;
  function garantirPill() {
    if (pill && pill.isConnected) return pill;
    pill = document.createElement("div");
    pill.className = "save-pill";
    pill.setAttribute("role", "status");
    pill.setAttribute("aria-live", "polite");
    document.body.appendChild(pill);
    return pill;
  }
  function mostrar(estado, texto) {
    const p = garantirPill();
    p.dataset.estado = estado;
    p.textContent = texto;
    p.classList.add("visivel");
    clearTimeout(timerPill);
    if (estado === "ok") timerPill = setTimeout(() => p.classList.remove("visivel"), 6000);
  }
  window.__statusSalvamento = function (estado, onde) {
    if (estado === "salvando") mostrar("salvando", "Salvando…");
    else if (estado === "erro") mostrar("erro", "Não foi possível salvar — verifique a conexão");
    else {
      const h = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      mostrar("ok", "✓ Salvo às " + h + (onde === "nuvem" ? " · nuvem" : onde === "local" ? " · neste aparelho" : ""));
    }
  };

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t && t.matches && t.matches("#mainArea [data-field], .nota-editor-area") && !(t.id || "").startsWith("auth")) {
      mostrar("pendente", "Alterações a salvar…");
    }
  }, true);

  // Ctrl+S / Cmd+S salva a ficha aberta (em vez de abrir "salvar página" do navegador).
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "s" || e.key === "S")) {
      if (typeof state !== "undefined" && state.current && document.getElementById("formScroll")) {
        e.preventDefault();
        if (typeof savePAF === "function") savePAF(state.current);
      }
    }
  });


  /* ------------------------- atalhos de teclado do editor ------------------------- */
  // Alt+→ / Alt+← : próxima / anterior seção.  Alt+N : nova anotação.  Alt+F : modo foco.
  document.addEventListener("keydown", (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!document.getElementById("formScroll")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const abas = Array.from(document.querySelectorAll(".tab-rail .tab-item[data-section]"));
      const i = abas.findIndex((a) => a.classList.contains("active"));
      const alvo = abas[i + (e.key === "ArrowRight" ? 1 : -1)];
      if (alvo) { e.preventDefault(); alvo.click(); setTimeout(() => { const f = document.getElementById("formScroll"); if (f) f.scrollTop = 0; }, 60); }
    } else if (e.key === "n" || e.key === "N") {
      // Alt+N : nova anotação (de hoje) na seção aberta, já com o cursor pronta para escrever.
      const sec = document.querySelector("#formScroll");
      const btn = sec && (sec.querySelector("[data-diario-add]") || sec.querySelector('[data-action="add-atendimento"]') || sec.querySelector('[data-action="add-meta-nota"]'));
      if (btn) {
        e.preventDefault();
        const antes = sec.querySelectorAll("textarea").length;
        btn.click();
        setTimeout(() => {
          const tas = Array.from(document.querySelectorAll("#formScroll textarea"));
          // a nova anotação aparece no topo da lista (mais recente primeiro)
          const alvo = tas.find((t) => !t.value && (t.closest(".diario-item, .timeline-card, .meta-nota"))) || tas[Math.max(0, tas.length - 1)];
          if (alvo && tas.length >= antes) { alvo.focus(); alvo.scrollIntoView({ block: "center", behavior: "smooth" }); }
        }, 120);
      }
    } else if (e.key === "f" || e.key === "F") {
      const b = document.getElementById("modoFocoBtn");
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // Lembrete (no máximo 1 por dia) quando faz mais de 30 dias sem backup neste aparelho.
  function lembreteBackup() {
    try {
      if (typeof state === "undefined" || !state.pafs || !state.pafs.length) return;
      const hoje = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("umbrela_lembrete_backup") === hoje) return;
      const ult = Number(localStorage.getItem("umbrela_ultimo_backup")) || 0;
      if (ult && Date.now() - ult < 30 * 86400000) return;
      localStorage.setItem("umbrela_lembrete_backup", hoje);
      if (typeof toast === "function") toast(ult ? "Faz mais de 30 dias do último backup. Em Config > Armazenamento dá para baixar uma cópia de segurança." : "Você ainda não fez backup neste aparelho. Em Config > Armazenamento dá para baixar uma cópia de segurança.");
    } catch (e) { /* ignora */ }
  }
  setTimeout(lembreteBackup, 9000);

  /* ------------------------- "Desfazer" depois de remover ------------------------- */
  let snack, snackTimer;
  window.__desfazer = function (texto, restaurar) {
    if (snack) snack.remove();
    clearTimeout(snackTimer);
    snack = document.createElement("div");
    snack.className = "desfazer-snack";
    snack.setAttribute("role", "status");
    const t = document.createElement("span"); t.textContent = texto;
    const b = document.createElement("button"); b.type = "button"; b.textContent = "Desfazer";
    b.addEventListener("click", () => { clearTimeout(snackTimer); snack.remove(); snack = null; restaurar(); });
    snack.append(t, b);
    document.body.appendChild(snack);
    snackTimer = setTimeout(() => { if (snack) { snack.remove(); snack = null; } }, 9000);
  };

  /* ------------------------- colar imagem (Ctrl+V) na seção Anexos ------------------------- */
  document.addEventListener("paste", (e) => {
    if (!document.getElementById("anexoInput") || typeof adicionarAnexos !== "function") return;
    const alvo = e.target;
    if (alvo && alvo.matches && alvo.matches("input[type=text], input[type=search], textarea")) return;
    const arqs = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => f.type.startsWith("image/"));
    if (!arqs.length) return;
    e.preventDefault();
    const h = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
    adicionarAnexos(arqs.map((f, i) => new File([f], "colado_" + h + (arqs.length > 1 ? "_" + (i + 1) : "") + "." + (f.type.split("/")[1] || "png"), { type: f.type })));
  });

  /* ------------------------- aparência: tamanho do texto e alto contraste ------------------------- */
  const VARS_TEXTO = { "--text-micro": 9.5, "--text-2xs": 10, "--text-xs": 11, "--text-sm": 12.5, "--text-base": 13.5, "--text-md": 15, "--text-lg": 17, "--text-xl": 20, "--text-2xl": 24, "--text-3xl": 30 };
  function aplicarAparencia() {
    const ap = lerLS("umbrela_aparencia", { tamanho: 100, contraste: 0 });
    const k = (Number(ap.tamanho) || 100) / 100;
    const root = document.documentElement;
    Object.keys(VARS_TEXTO).forEach(v => {
      if (k === 1) root.style.removeProperty(v);
      else root.style.setProperty(v, (VARS_TEXTO[v] * k).toFixed(2) + "px");
    });
    if (ap.contraste) root.setAttribute("data-contraste", "alto"); else root.removeAttribute("data-contraste");
    document.querySelectorAll("#mainArea textarea").forEach(autosize);
    return ap;
  }
  function marcarBotoes(raiz) {
    const ap = lerLS("umbrela_aparencia", { tamanho: 100, contraste: 0 });
    raiz.querySelectorAll("[data-aparencia-tamanho]").forEach(b => b.classList.toggle("ativo", Number(b.dataset.aparenciaTamanho) === Number(ap.tamanho || 100)));
    raiz.querySelectorAll("[data-aparencia-contraste]").forEach(b => b.classList.toggle("ativo", Number(b.dataset.aparenciaContraste) === (ap.contraste ? 1 : 0)));
  }
  window.__aparencia = {
    ligarBotoes: function (raiz) {
      marcarBotoes(raiz);
      raiz.querySelectorAll("[data-aparencia-tamanho]").forEach(b => b.addEventListener("click", () => {
        const ap = lerLS("umbrela_aparencia", { tamanho: 100, contraste: 0 });
        ap.tamanho = Number(b.dataset.aparenciaTamanho); gravarLS("umbrela_aparencia", ap); aplicarAparencia(); marcarBotoes(raiz);
      }));
      raiz.querySelectorAll("[data-aparencia-contraste]").forEach(b => b.addEventListener("click", () => {
        const ap = lerLS("umbrela_aparencia", { tamanho: 100, contraste: 0 });
        ap.contraste = Number(b.dataset.aparenciaContraste); gravarLS("umbrela_aparencia", ap); aplicarAparencia(); marcarBotoes(raiz);
      }));
    }
  };
  aplicarAparencia();

  /* ------------------------- exportar todas as anotações do PAF ------------------------- */
  function textoAnotacoes(paf) {
    const itens = [];
    const rot = (typeof DIARIO_ROTULOS !== "undefined" ? DIARIO_ROTULOS : {});
    ((typeof DIARIO_CAMPOS !== "undefined" ? DIARIO_CAMPOS : [])).forEach(k => {
      ((paf.diario || {})[k] || []).forEach(e => { if (e && String(e.texto || "").trim()) itens.push({ data: e.data || "", origem: rot[k] || k, texto: String(e.texto).trim() }); });
    });
    (paf.atendimentos || []).forEach(a => {
      if (a && (String(a.evolucao || "").trim() || String(a.encaminhamentos || "").trim())) {
        const extra = String(a.encaminhamentos || "").trim() ? "\nEncaminhamentos: " + String(a.encaminhamentos).trim() : "";
        itens.push({ data: a.data || "", origem: "Atendimento" + (a.tipo ? " — " + a.tipo : ""), texto: (String(a.evolucao || "").trim() + extra).trim() });
      }
    });
    itens.sort((x, y) => (x.data || "").localeCompare(y.data || ""));
    const br = (d) => d ? d.split("-").reverse().join("/") : "sem data";
    const cab = "Anotações — " + (paf.responsavel || "família sem nome") + "\nGeradas em " + new Date().toLocaleDateString("pt-BR") + "\nDocumento com informação sigilosa (sigilo profissional / LGPD).\n";
    return cab + "\n" + itens.map(i => br(i.data) + " · " + i.origem + "\n" + i.texto).join("\n\n---\n\n") + "\n";
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-exportar-notas]");
    if (!b || typeof state === "undefined" || !state.current) return;
    const txt = textoAnotacoes(state.current);
    if (b.dataset.exportarNotas === "copiar") {
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
        () => typeof toast === "function" && toast("Anotações copiadas."),
        () => typeof toast === "function" && toast("Não foi possível copiar — use o botão Baixar (.txt)."));
    } else {
      const nome = String(state.current.responsavel || "familia").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_").slice(0, 40) || "familia";
      const url = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = "anotacoes_" + nome + ".txt";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  });

  /* ------------------------- não perder o que foi digitado ao fechar/trocar de aba ------------------------- */
  function salvarPendente() {
    if (pill && pill.dataset.estado === "pendente" && typeof state !== "undefined" && state.current && typeof savePAF === "function") {
      try { clearTimeout(state.saveTimer); savePAF(state.current, { silent: true }); } catch (e) { /* ignora */ }
    }
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") salvarPendente(); });
  window.addEventListener("pagehide", salvarPendente);

  window.addEventListener("resize", () => document.querySelectorAll("#mainArea textarea").forEach(autosize));

  function iniciar() {
    const main = document.getElementById("mainArea");
    if (!main) return;
    new MutationObserver(agendarVarredura).observe(main, { childList: true, subtree: true });
    varrer();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();


/* Umbrela — gavetas (menu de seções no celular e painéis recolhíveis).
   - menu de seções: botão Fechar, Esc, deslizar para a esquerda fecha, deslizar da borda esquerda abre,
     tela de trás não rola enquanto aberto, a seção atual aparece já visível;
   - painéis recolhíveis ("Resumo da ficha" etc.): lembram se estavam abertos ao trocar de seção. */
(function () {
  "use strict";
  const CHAVE = "paif_gaveta_";
  const celular = () => window.matchMedia("(max-width: 860px)").matches;
  const rail = () => document.getElementById("tabRail");
  const aberta = () => { const r = rail(); return !!(r && r.classList.contains("open")); };
  function fechar() { const ov = document.getElementById("railOverlay"); if (aberta() && ov) ov.click(); }
  function abrir() { const b = document.getElementById("railToggleBtn"); if (!aberta() && b && b.offsetParent !== null) b.click(); }

  function sincronizar() {
    const a = aberta();
    document.documentElement.classList.toggle("gaveta-aberta", a && celular());
    const b = document.getElementById("railToggleBtn");
    if (b) { b.setAttribute("aria-expanded", a ? "true" : "false"); b.setAttribute("aria-controls", "tabRail"); }
    const r = rail();
    if (r && a) { const ativo = r.querySelector(".tab-item.active"); if (ativo && ativo.scrollIntoView) ativo.scrollIntoView({ block: "center" }); }
  }

  function preparar() {
    const r = rail();
    if (r && !r.querySelector(".rail-fechar")) {
      const x = document.createElement("button");
      x.type = "button"; x.className = "rail-fechar"; x.setAttribute("aria-label", "Fechar menu de seções"); x.textContent = "✕ Fechar";
      x.addEventListener("click", fechar);
      r.insertBefore(x, r.firstChild);
    }
    document.querySelectorAll("details.apoio-mobile").forEach((d) => {
      const sum = d.querySelector("summary");
      const k = CHAVE + (sum ? sum.textContent.trim() : "painel");
      let v = null; try { v = sessionStorage.getItem(k); } catch (e) { /* ignora */ }
      if (v === "1" && !d.open) d.open = true;
      else if (v === "0" && d.open) d.open = false;
    });
    sincronizar();
  }

  // lembra o estado aberto/fechado dos painéis (o evento "toggle" não propaga: usa captura)
  document.addEventListener("toggle", (e) => {
    const d = e.target;
    if (!d || !d.matches || !d.matches("details.apoio-mobile")) return;
    const sum = d.querySelector("summary");
    try { sessionStorage.setItem(CHAVE + (sum ? sum.textContent.trim() : "painel"), d.open ? "1" : "0"); } catch (err) { /* ignora */ }
  }, true);

  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest("#railToggleBtn, #railOverlay, .tab-item")) setTimeout(sincronizar, 30);
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aberta() && celular()) { e.preventDefault(); fechar(); }
  });

  // gestos: deslizar para a esquerda fecha; deslizar a partir da borda esquerda abre
  let t0 = null;
  document.addEventListener("touchstart", (e) => {
    const t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (!t0 || !celular()) { t0 = null; return; }
    const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    const de = t0; t0 = null;
    if (Math.abs(dy) > 60 || Math.abs(dx) < 70) return;
    if (dx < 0 && aberta()) fechar();
    else if (dx > 0 && de.x < 24 && document.getElementById("formScroll")) abrir();
  }, { passive: true });

  let timer = null;
  function agendar() { clearTimeout(timer); timer = setTimeout(preparar, 80); }
  function iniciar() {
    const main = document.getElementById("mainArea");
    if (!main) return;
    new MutationObserver(agendar).observe(main, { childList: true, subtree: true });
    preparar();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();


/* Umbrela — agilidade na escrita: data/hora com um atalho, ajuda de atalhos, Esc fecha menus
   suspensos e campos que acompanham o teclado do celular. */
(function () {
  "use strict";

  function campoAtivo() {
    const a = document.activeElement;
    if (!a || !a.matches) return null;
    if (a.matches("textarea, input[type=text], input[type=search]") && a.closest("#mainArea, .nota-editor")) return a;
    return null;
  }

  function inserir(el, texto) {
    const ini = el.selectionStart == null ? el.value.length : el.selectionStart;
    const fim = el.selectionEnd == null ? ini : el.selectionEnd;
    el.value = el.value.slice(0, ini) + texto + el.value.slice(fim);
    const pos = ini + texto.length;
    try { el.setSelectionRange(pos, pos); } catch (e) { /* ignora */ }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function dataHora() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function ajuda() {
    if (document.getElementById("atalhosAjuda")) return;
    const ov = document.createElement("div");
    ov.id = "atalhosAjuda"; ov.className = "modal-backdrop"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Atalhos de teclado");
    const linhas = [
      ["Ctrl + S", "Salvar a ficha"],
      ["Alt + → / Alt + ←", "Próxima / anterior seção"],
      ["Alt + N", "Nova anotação na seção aberta"],
      ["Alt + D", "Inserir data e hora no campo"],
      ["Alt + F", "Modo foco (tela inteira)"],
      ["/", "Buscar na lista de fichas"],
      ["Alt + H", "Mostrar esta ajuda"],
      ["Esc", "Fechar menus e editor ampliado"]
    ];
    ov.innerHTML = '<div class="modal"><h3>Atalhos de teclado</h3><table class="atalhos-tab">' +
      linhas.map((l) => "<tr><td><kbd>" + l[0] + "</kbd></td><td>" + l[1] + "</td></tr>").join("") +
      '</table><div class="modal-actions"><button type="button" class="btn btn-primary">Fechar</button></div></div>';
    const fechar = () => { document.removeEventListener("keydown", tecla, true); ov.remove(); };
    const tecla = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); } };
    ov.addEventListener("click", (e) => { if (e.target === ov) fechar(); });
    ov.querySelector("button").addEventListener("click", fechar);
    document.addEventListener("keydown", tecla, true);
    document.body.appendChild(ov);
    ov.querySelector("button").focus();
  }

  document.addEventListener("keydown", (e) => {
    // "/" na lista de fichas leva direto à busca (fora de campos de texto)
    if (e.key === "/" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const a = document.activeElement, digitando = a && a.matches && a.matches("input, textarea, select, [contenteditable]");
      const busca = document.getElementById("searchInput");
      if (!digitando && busca) { e.preventDefault(); busca.focus(); busca.select(); }
      return;
    }
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      if (e.key === "d" || e.key === "D") {
        const c = campoAtivo();
        if (c) { e.preventDefault(); inserir(c, dataHora() + " — "); }
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault(); ajuda();
      }
    } else if (e.key === "Escape") {
      // fecha seletores de membros e menus de exportação abertos
      let fechou = false;
      document.querySelectorAll(".situ-membros-dropdown[open]").forEach((d) => { d.removeAttribute("open"); fechou = true; });
      document.querySelectorAll(".export-dropdown").forEach((d) => { if (d.style.display && d.style.display !== "none") { d.style.display = "none"; fechou = true; } });
      if (fechou) e.stopPropagation();
    }
  });

  // celular: letra maiúscula no início das frases e o campo sobe junto com o teclado
  const toque = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!t || !t.matches || !t.matches("#mainArea textarea")) return;
    if (!t.hasAttribute("autocapitalize")) t.setAttribute("autocapitalize", "sentences");
    if (!t.hasAttribute("lang")) t.setAttribute("lang", "pt-BR");
    if (toque) setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (err) { /* ignora */ } }, 320);
  });
})();
