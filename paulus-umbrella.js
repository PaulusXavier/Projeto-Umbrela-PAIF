/*
  Paulus no Umbrella — painel de conversa do mascote.

  O Paulus é o copiloto de IA compartilhado pelos apps (repositório "Paulus"). Aqui ele aparece
  com o rosto do mascote do Umbrella: clicar no mascote abre este painel.

  O QUE ELE FAZ
    - tira dúvidas do PAIF/SUAS, citando a norma (artigo e documento) quando a base tem;
    - explica como usar o app;
    - abre telas ("abrir prioridades", "abrir gráficos", "abrir configurações");
    - sem internet, ainda responde pela base de normas, que fica no aparelho.

  O QUE ELE NUNCA FAZ (regra de ouro — veja docs/SEGURANCA.md do Paulus)
    - Este arquivo NÃO lê state.pafs, state.current, anexos, Firestore nem localStorage de registros.
      Nenhum dado de família chega ao Paulus. Não há busca registrada sobre os PAFs de propósito.
    - O filtro do Paulus bloqueia perguntas com nome, documento, telefone ou endereço residencial;
      nesse caso a mensagem também é ocultada aqui na tela.
    - Toda resposta é inserida com textContent (nunca innerHTML).
    - Ao sair da conta, por inatividade ou "Nova conversa", a conversa é apagada (Paulus.limpar()).

  Depende de: paulus.v1.js (módulo do Paulus, cópia local) e de funções globais do app.js
  (state, goHome, goDashboard, goPrioridades, openSettingsModal, newPAF, firebaseConfigured,
  mascoteRenderizar, MASCOTE_DICAS). Carregue DEPOIS do app.js.
*/
(function () {
  "use strict";

  /* ------------------------------------------------------------------ CONFIGURAÇÃO */

  // Endereço do Worker do Paulus na Cloudflare (termina em .workers.dev). Veja docs/DEPLOY.md do Paulus.
  // Exemplo: "https://paulus-ia.SEU-NOME.workers.dev"
  // Vazio = IA desligada: o painel continua funcionando só com a base de normas (no aparelho).
  const PAULUS_ENDPOINT = "";

  // Base de normas leve (pacote "geral": leis e decretos). Cópia local, serve também offline.
  const PAULUS_CONHECIMENTO = "conhecimento.json";

  const APP_ID = "umbrella";

  /* ------------------------------------------------------------------ ESTADO */

  let iniciado = false;
  let ocupado = false;
  let aborto = null;
  let humorTimer = null;
  let painel = null, log = null, entrada = null, btnEnviar = null, btnParar = null,
      areaSugestoes = null, statusEl = null;

  const el = (tag, cls, texto) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  };

  const sessaoAtiva = () =>
    typeof firebaseConfigured !== "function" || !firebaseConfigured() || !!(state && state.currentUser);

  // Só o NOME GENÉRICO da tela (nunca o PAF aberto, nome de família ou seção preenchida).
  function abaAtual() {
    const mapa = { home: "registros", editor: "formulario do PAF", dashboard: "graficos", prioridades: "prioridades" };
    return mapa[state && state.view] || "";
  }

  /* ------------------------------------------------------------------ INICIALIZAÇÃO DO PAULUS */

  function garantirInicio() {
    if (iniciado) return true;
    if (typeof Paulus === "undefined") return false;   // paulus.v1.js não carregou: o app segue sem ele
    Paulus.init({
      app: APP_ID,
      endpoint: PAULUS_ENDPOINT,
      conhecimentoUrl: PAULUS_CONHECIMENTO
      // "fichas" omitido de propósito: o Umbrella não tem diretório público, e dado de família jamais vai à IA.
    });

    // Telas que o Paulus pode abrir. Só existe o que for registrado aqui.
    // Usam as mesmas funções dos botões do topo.
    Paulus.registrarAcao({
      id: "registros",
      rotulos: ["registros", "lista de pafs", "lista de registros", "tela inicial", "inicio"],
      executar: () => { if (sessaoAtiva()) goHome(); }
    });
    Paulus.registrarAcao({
      id: "prioridades",
      rotulos: ["prioridades", "prioridade"],
      executar: () => { if (sessaoAtiva()) goPrioridades(); }
    });
    Paulus.registrarAcao({
      id: "graficos",
      rotulos: ["graficos", "grafico", "painel", "indicadores", "estatisticas"],
      executar: () => { if (sessaoAtiva()) goDashboard(); }
    });
    Paulus.registrarAcao({
      id: "configuracoes",
      rotulos: ["configuracoes", "configuracao", "config", "backup", "familias desistentes"],
      executar: () => { if (sessaoAtiva()) openSettingsModal(); }
    });
    // Cria e SALVA na hora um PAF em branco: mexe em dados, então pede confirmação.
    Paulus.registrarAcao({
      id: "novo-paf",
      rotulos: ["novo paf", "novo plano", "novo registro", "criar paf", "nova ficha"],
      confirmar: true,
      executar: () => { if (sessaoAtiva()) newPAF(); }
    });

    iniciado = true;
    return true;
  }

  /* ------------------------------------------------------------------ TEXTO SEGURO */

  // Converte o texto da IA (com **negrito** e listas "- item") em elementos DOM, sem innerHTML.
  function inline(pai, texto) {
    String(texto).split(/(\*\*[^*\n]+\*\*)/g).forEach(parte => {
      if (!parte) return;
      if (/^\*\*[^*\n]+\*\*$/.test(parte)) pai.appendChild(el("strong", "", parte.slice(2, -2)));
      else pai.appendChild(document.createTextNode(parte));
    });
  }

  function renderTexto(alvo, texto) {
    alvo.textContent = "";
    let lista = null, par = null;
    String(texto || "").replace(/\r/g, "").split("\n").forEach(linha => {
      const item = /^\s*[-*•]\s+(.*)$/.exec(linha);
      if (item) {
        par = null;
        if (!lista) { lista = el("ul"); alvo.appendChild(lista); }
        const li = el("li"); inline(li, item[1]); lista.appendChild(li);
      } else if (linha.trim()) {
        lista = null;
        par = el("p"); inline(par, linha.trim()); alvo.appendChild(par);
      } else { lista = null; par = null; }
    });
  }

  /* ------------------------------------------------------------------ PAINEL */

  function construirPainel() {
    painel = el("section", "paulus-panel");
    painel.id = "paulusPanel";
    painel.setAttribute("role", "dialog");
    painel.setAttribute("aria-label", "Conversa com o Paulus, assistente do Umbrella");
    painel.hidden = true;

    const cab = el("header", "paulus-head");
    const titulo = el("div", "paulus-head-title");
    titulo.appendChild(el("strong", "", "Paulus"));
    titulo.appendChild(el("span", "", "aqui como Umbrella"));
    const acoes = el("div", "paulus-head-actions");
    const nova = el("button", "paulus-icon-btn", "Nova conversa");
    nova.type = "button";
    nova.addEventListener("click", novaConversa);
    const fechar = el("button", "paulus-icon-btn paulus-close", "×");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar conversa");
    fechar.addEventListener("click", fecharPainel);
    acoes.appendChild(nova);
    acoes.appendChild(fechar);
    cab.appendChild(titulo);
    cab.appendChild(acoes);

    statusEl = el("div", "paulus-status");

    log = el("div", "paulus-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");

    areaSugestoes = el("div", "paulus-chips");

    const rodape = el("div", "paulus-compose");
    entrada = el("input", "paulus-input");
    entrada.type = "text";
    entrada.maxLength = 600;
    entrada.autocomplete = "off";
    entrada.placeholder = "Pergunte ao Paulus…";
    entrada.setAttribute("aria-label", "Sua pergunta ao Paulus");
    entrada.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); enviar(); }
    });
    btnEnviar = el("button", "paulus-send", "Enviar");
    btnEnviar.type = "button";
    btnEnviar.addEventListener("click", () => enviar());
    btnParar = el("button", "paulus-stop", "Parar");
    btnParar.type = "button";
    btnParar.hidden = true;
    btnParar.addEventListener("click", () => { if (aborto) aborto.abort(); });
    rodape.appendChild(entrada);
    rodape.appendChild(btnEnviar);
    rodape.appendChild(btnParar);

    const aviso = el("p", "paulus-note",
      "Não digite nomes, documentos, telefones ou endereços de famílias. Respostas geradas por IA: confira antes de usar em atendimento.");

    painel.appendChild(cab);
    painel.appendChild(statusEl);
    painel.appendChild(log);
    painel.appendChild(areaSugestoes);
    painel.appendChild(rodape);
    painel.appendChild(aviso);
    painel.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); fecharPainel(); } });
    document.body.appendChild(painel);
  }

  function atualizarStatus() {
    if (!statusEl) return;
    statusEl.textContent = Paulus.iaLigada()
      ? ""
      : "IA indisponível agora (sem internet ou não configurada). Respondo só pela base de normas deste aparelho.";
    statusEl.hidden = !statusEl.textContent;
  }

  function rolarParaFim() { if (log) log.scrollTop = log.scrollHeight; }

  function mensagem(papel, texto) {
    const m = el("div", "paulus-msg paulus-" + papel);
    if (texto != null) renderTexto(m, texto);
    log.appendChild(m);
    rolarParaFim();
    return m;
  }

  function chips(lista, aoEscolher) {
    areaSugestoes.textContent = "";
    (lista || []).slice(0, 4).forEach(t => {
      const b = el("button", "paulus-chip", t.rotulo || t);
      b.type = "button";
      b.addEventListener("click", () => aoEscolher(t));
      areaSugestoes.appendChild(b);
    });
  }

  function chipsIniciais() {
    const sk = Paulus.skin(APP_ID);
    const base = ((sk && sk.sugestoes) || []).map(t => ({ rotulo: t, texto: t }));
    base.push({ rotulo: "Dica do PAIF", dica: true });
    chips(base, c => {
      if (c.dica) {
        const dicas = (typeof MASCOTE_DICAS !== "undefined" && MASCOTE_DICAS.length) ? MASCOTE_DICAS : [];
        if (dicas.length) mensagem("paulus", dicas[Math.floor(Math.random() * dicas.length)]);
      } else enviar(c.texto);
    });
  }

  function boasVindas() {
    log.textContent = "";
    const sk = Paulus.skin(APP_ID);
    mensagem("paulus", (sk && sk.saudacao) || "Oi! Eu sou o Paulus. Posso ajudar a usar o app e tirar dúvidas do SUAS.");
    chipsIniciais();
    atualizarStatus();
  }

  function novaConversa() {
    if (aborto) aborto.abort();
    if (typeof Paulus !== "undefined") Paulus.limpar();
    if (log) boasVindas();
    if (entrada) entrada.focus();
  }

  /* ------------------------------------------------------------------ MASCOTE */

  function humor(mood, voltarMs) {
    if (typeof mascoteRenderizar !== "function") return;
    mascoteRenderizar(mood);
    clearTimeout(humorTimer);
    if (voltarMs) humorTimer = setTimeout(() => mascoteRenderizar("normal"), voltarMs);
  }

  /* ------------------------------------------------------------------ ENVIO E RESPOSTA */

  function definirOcupado(v) {
    ocupado = v;
    btnEnviar.hidden = v;
    btnParar.hidden = !v;
    entrada.disabled = v;
    if (!v) entrada.focus();
  }

  function anexarAvisos(bolha, avisos) {
    (avisos || []).forEach(a => bolha.appendChild(el("p", "paulus-aviso", a)));
  }

  function anexarFontes(bolha, fontes) {
    if (!fontes || !fontes.length) return;
    const d = el("details", "paulus-fontes");
    d.appendChild(el("summary", "", "Fontes (" + fontes.length + ")"));
    const ul = el("ul");
    fontes.forEach(f => {
      const partes = [f.documento || f.norma, f.referencia, f.ano].filter(Boolean);
      ul.appendChild(el("li", "", partes.join(" · ") || "Documento da base de normas"));
    });
    d.appendChild(ul);
    bolha.appendChild(d);
  }

  function mostrarTelefones(bolha, telefones) {
    if (!telefones || !telefones.length) return;
    const ul = el("ul", "paulus-telefones");
    telefones.forEach(t => {
      const li = el("li");
      const numero = String(t.numero || "").replace(/\D/g, "");
      const a = el("a", "", numero + " · " + (t.nome || ""));
      a.href = "tel:" + numero;
      li.appendChild(a);
      ul.appendChild(li);
    });
    bolha.appendChild(ul);
  }

  function pedirConfirmacao(bolha, r) {
    const linha = el("div", "paulus-confirm");
    const sim = el("button", "paulus-chip paulus-chip-ok", "Confirmar");
    const nao = el("button", "paulus-chip", "Cancelar");
    sim.type = nao.type = "button";
    const encerrar = txt => { linha.remove(); bolha.appendChild(el("p", "paulus-aviso", txt)); };
    sim.addEventListener("click", () => { try { r.confirmar(); } catch (e) { /* a própria ação avisa pelo toast */ } encerrar("Feito."); fecharSeCelular(); });
    nao.addEventListener("click", () => encerrar("Tudo bem, não fiz nada."));
    linha.appendChild(sim);
    linha.appendChild(nao);
    bolha.appendChild(linha);
  }

  function fecharSeCelular() {
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) fecharPainel();
  }

  function mostrarResultado(bolha, r) {
    renderTexto(bolha, r.texto);
    let mood = "feliz";
    switch (r.tipo) {
      case "ia":
      case "norma":
        anexarFontes(bolha, r.fontes);
        anexarAvisos(bolha, r.avisos);
        if (r.sugestoes && r.sugestoes.length) chips(r.sugestoes, t => enviar(t)); else chipsIniciais();
        break;
      case "crise":
        mood = "preocupado";
        mostrarTelefones(bolha, r.telefones);
        break;
      case "acao":
        if (r.pedeConfirmacao) { mood = "pensativo"; pedirConfirmacao(bolha, r); }
        else if (r.executada) fecharSeCelular();
        break;
      case "acao_desconhecida":
        mood = "pensativo";
        if (r.opcoes && r.opcoes.length) chips(r.opcoes.map(o => ({ rotulo: "abrir " + o, texto: "abrir " + o })), c => enviar(c.texto));
        break;
      case "bloqueio":
      case "erro":
      case "sem_resposta":
        mood = "preocupado";
        break;
    }
    humor(mood, 3500);
  }

  async function enviar(textoDado) {
    if (ocupado || !garantirInicio()) return;
    const texto = String(textoDado != null ? textoDado : entrada.value).replace(/\s+/g, " ").trim();
    if (!texto) return;
    entrada.value = "";
    areaSugestoes.textContent = "";

    // Se a mensagem tem dado pessoal, ela NÃO fica visível na tela (e o Paulus a bloqueia antes de qualquer envio).
    const sensivel = Paulus.temDadoPessoal(texto);
    const minha = mensagem("usuario", null);
    if (sensivel) { minha.textContent = "(mensagem ocultada: continha dado pessoal)"; minha.classList.add("paulus-oculta"); }
    else minha.textContent = texto;

    const bolha = mensagem("paulus", null);
    bolha.classList.add("paulus-digitando");
    bolha.setAttribute("aria-busy", "true");
    bolha.textContent = "Pensando…";
    definirOcupado(true);
    humor("pensativo");
    aborto = typeof AbortController === "function" ? new AbortController() : null;

    try {
      const r = await Paulus.perguntar(texto, {
        aba: abaAtual(),
        sinal: aborto ? aborto.signal : undefined,
        onToken: (_pedaco, tudo) => {
          bolha.classList.remove("paulus-digitando");
          renderTexto(bolha, tudo);
          rolarParaFim();
        }
      });
      if (!painel) return;   // a sessão acabou no meio da resposta: o painel já foi apagado
      bolha.classList.remove("paulus-digitando");
      mostrarResultado(bolha, r);
    } catch (e) {
      if (!painel) return;
      bolha.classList.remove("paulus-digitando");
      renderTexto(bolha, "Não consegui responder agora. Tente de novo em instantes.");
      humor("preocupado", 3500);
      chipsIniciais();
    } finally {
      aborto = null;
      if (painel) {
        bolha.removeAttribute("aria-busy");
        definirOcupado(false);
        atualizarStatus();
        rolarParaFim();
      }
    }
  }

  /* ------------------------------------------------------------------ ABRIR / FECHAR */

  // Devolve true se abriu o painel; false para o app mostrar só a dica de sempre
  // (Paulus não carregou, ou ainda não há sessão: o painel não aparece na tela de login).
  function abrirPainel() {
    if (!sessaoAtiva() || !garantirInicio()) return false;
    if (!painel) { construirPainel(); boasVindas(); }
    if (!painel.hidden) { fecharPainel(); return true; }   // clicar de novo no mascote recolhe
    painel.hidden = false;
    const balao = document.getElementById("mascoteBubble");   // a dica do mascote não fica espiando atrás do painel
    if (balao) balao.classList.remove("show");
    atualizarStatus();
    entrada.focus();
    return true;
  }

  function fecharPainel() {
    if (!painel || painel.hidden) return;
    painel.hidden = true;
    const btn = document.getElementById("mascoteBtn");
    if (btn) btn.focus();
  }

  // Sessão acabou (sair, inatividade, conta desativada): some com a conversa e com o histórico do Paulus.
  function encerrar() {
    if (aborto) aborto.abort();
    if (typeof Paulus !== "undefined") Paulus.limpar();
    if (painel) { painel.remove(); painel = log = entrada = btnEnviar = btnParar = areaSugestoes = statusEl = null; }
    ocupado = false;
  }

  window.paulusAbrir = abrirPainel;
  window.paulusEncerrar = encerrar;
})();
