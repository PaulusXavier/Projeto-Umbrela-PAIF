/*
  Paulus no Umbrella — painel de conversa do mascote.

  O Paulus é o copiloto de IA compartilhado pelos apps (repositório "Paulus"). Aqui ele aparece
  com o rosto do mascote do Umbrella: clicar no mascote abre este painel.

  O QUE ELE FAZ
    - tira dúvidas do PAIF/SUAS, citando a norma (artigo e documento) quando a base tem;
    - conhece o que o PRÓPRIO app ensina sobre o PAIF (notas técnicas, listas do formulário, guia de cada
      seção, dicas e o "como usar"): base conhecimento-umbrella.json, gerada por
      scripts/gerar-conhecimento-umbrella.mjs a partir do código (texto fixo, nunca dado de família);
    - reformula a pergunta antes de consultar a base local (paulus-consulta.js), para achar o trecho certo;
    - oferece "No app: ..." e "Ir para a seção ..." depois das respostas, e "Explicar esta seção";
    - explica como usar o app;
    - abre telas ("abrir prioridades", "abrir gráficos", "abrir configurações") e, com um PAF aberto,
      seções do formulário ("abrir diagnóstico", "abrir elaboração do plano");
    - sem internet, ainda responde pela base de normas, que fica no aparelho;
    - edita PDF NO APARELHO (juntar, dividir, remover/girar páginas, numerar, marca d'água, preencher campos): a pessoa
      anexa o arquivo pelo clipe e o próprio Paulus edita; o PDF nunca vai ao Worker nem à IA (shared/pdf.mjs, pdf-lib);
    - traça rota entre unidades e serviços (ordem das paradas, km e tempo estimados, link do mapa), sem IA e sem rede;
    - faz conta no aparelho e mostra o que aprendeu do jeito de cada pessoa (\"O que aprendi\": ver, desligar, exportar, apagar).

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
  // Worker compartilhado do Paulus (o mesmo do Argo e do Anona; tem o bloco "umbrella" em worker/apps.mjs).
  // Vazio = IA desligada: o painel continua funcionando só com a base de normas (no aparelho).
  const PAULUS_ENDPOINT = "https://paulus-ia.paulo-ae18.workers.dev";

  // Base de normas leve (pacote "geral": leis e decretos). Cópia local, serve também offline.
  const PAULUS_CONHECIMENTO = "conhecimento.json";

  // Conhecimento do próprio app sobre o PAIF (gerado do código; sobrevive a uma nova cópia do conhecimento.json).
  const PAULUS_CONHECIMENTO_APP = "conhecimento-umbrella.json";

  const APP_ID = "umbrella";

  // Unidades PÚBLICAS (CRAS, CREAS, UBS, CAPS, Conselho Tutelar...) para o Paulus calcular a melhor ordem da rota, km e tempo.
  // Fica VAZIO de propósito: só preencha com coordenadas conferidas (um pino errado vira uma rota errada). Nunca coloque
  // endereço de família aqui. Formato: { nome: "CRAS Cauamé", lat: 2.8, lng: -60.7, apelidos: ["CRAS Sul"] }
  // Enquanto estiver vazio, o Paulus ainda monta o link do mapa pelos nomes, na ordem escrita, e avisa que não estimou km nem tempo.
  const PONTOS_UNIDADES = [];

  // Pergunta sugerida em cada tela fora do formulário (a resposta vem do manual do app, em conhecimento-umbrella.json).
  const PERGUNTAS_TELA = {
    home: "como buscar e filtrar as fichas da lista?",
    prioridades: "como a escala de prioridades calcula os pontos?",
    dashboard: "como o app calcula os indicadores do RMA?"
  };

  /* ------------------------------------------------------------------ ESTADO */

  let iniciado = false;
  let conversaIniciada = false;
  let baseMesclada = null;            // normas + conhecimento do app, já juntos
  let verbetesApp = new Map();        // "titulo|referencia" -> verbete do app (texto completo e seção)
  let historicoLocal = [];            // últimas perguntas SEM dado pessoal, só para entender "e para adolescente?"
  let ocupado = false;
  let ultimaPergunta = "";          // só para "Tentar de novo"; nunca guardada se tiver dado pessoal
  let aborto = null;
  let humorTimer = null;
  let anexos = [];                    // PDFs/fotos escolhidos pela pessoa para o Paulus EDITAR no aparelho (só memória; nunca enviados)
  let inputArquivo = null, areaAnexos = null, btnAnexo = null;
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
    let aba = mapa[state && state.view] || "";
    // No formulário, também o NOME da seção aberta (ex.: "Diagnóstico"): é o título fixo da seção, nunca o conteúdo preenchido.
    if (state && state.view === "editor" && typeof SECTIONS !== "undefined") {
      const sec = SECTIONS.find(x => x.id === state.activeSection);
      if (sec) aba += ", secao " + sec.label;
    }
    return aba;
  }

  /* ------------------------------------------------------------------ BASE DE CONHECIMENTO */

  const chaveVerbete = (titulo, ref) => String(titulo || "") + "|" + String(ref || "");

  const encurtar = (t, n) => {
    t = String(t || "").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
  };

  // Carrega a base geral e a base do app em paralelo e junta. Se a do app falhar, segue só com a geral.
  function carregarBase() {
    if (typeof fetch !== "function") return;
    const ler = url => fetch(url, { credentials: "omit" }).then(r => (r.ok ? r.json() : [])).catch(() => []);
    Promise.all([ler(PAULUS_CONHECIMENTO), ler(PAULUS_CONHECIMENTO_APP)]).then(([normas, app]) => {
      if (!Array.isArray(normas) || !normas.length) return;   // sem a base geral, o Paulus carrega sozinho pelo endereço
      app = Array.isArray(app) ? app : [];
      verbetesApp = new Map();
      app.forEach(v => verbetesApp.set(chaveVerbete(v.titulo, v.referencia), v));
      baseMesclada = normas.concat(app);
      // Chegou depois do primeiro clique, mas antes de a conversa começar: reinicia o Paulus já com a base completa.
      if (iniciado && !conversaIniciada && typeof Paulus !== "undefined") iniciarPaulus();
    });
  }

  // Identificador opaco da conta (hash do uid; nunca e-mail nem nome): cada pessoa tem a própria memória de estilo.
  function perfilOpaco() {
    const uid = String((state && state.currentUser && state.currentUser.uid) || "");
    if (!uid) return "";
    let h = 5381;
    for (let i = 0; i < uid.length; i++) h = ((h << 5) + h + uid.charCodeAt(i)) >>> 0;
    return "u" + h.toString(36);
  }

  function iniciarPaulus() {
    Paulus.init(Object.assign({
      app: APP_ID,
      endpoint: PAULUS_ENDPOINT,
      perfil: perfilOpaco(),
      pontos: () => PONTOS_UNIDADES,
      cidade: "Boa Vista, RR",   // entra na busca do mapa quando a rota é feita só com nomes de lugares
      // "fichas" omitido de propósito: o Umbrella não tem diretório público, e dado de família jamais vai à IA.
    }, baseMesclada ? { conhecimento: baseMesclada } : { conhecimentoUrl: PAULUS_CONHECIMENTO }));
  }

  const secaoDisponivel = id =>
    !!(state && state.view === "editor" && typeof SECTIONS !== "undefined" && SECTIONS.some(s => s.id === id));

  const rotuloSecao = id =>
    (typeof SECTIONS !== "undefined" && (SECTIONS.find(s => s.id === id) || {}).label) || id;

  // Troca a seção do formulário aberto (mesmo caminho do clique na aba lateral). Só navega, não altera dados.
  function irParaSecao(id) {
    if (!secaoDisponivel(id)) {
      if (typeof toast === "function") toast("Abra um PAF para ir direto a uma seção do formulário.");
      return false;
    }
    state.activeSection = id;
    state.railOpen = false;
    const ov = document.getElementById("railOverlay");
    if (ov) ov.classList.remove("show");
    if (typeof renderApp === "function") renderApp();
    return true;
  }

  /* ------------------------------------------------------------------ INICIALIZAÇÃO DO PAULUS */

  function garantirInicio() {
    if (iniciado) return true;
    if (typeof Paulus === "undefined") return false;   // paulus.v1.js não carregou: o app segue sem ele
    iniciarPaulus();

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

    // Seções do formulário (só navegam; exigem um PAF aberto). Os nomes mais longos vencem: "graficos da familia" abre a
    // seção, "graficos" abre o painel geral.
    const APELIDOS_SECAO = {
      cabecalho: ["cabecalho"], familia: ["membros da familia", "composicao familiar"], diagnostico: ["diagnostico"],
      grupo: ["trabalho coletivo", "situacoes sociais", "servicos da rede"], encaminhamentos: ["encaminhamentos"],
      programas: ["programas e beneficios"], beneficioEventual: ["beneficio eventual"], rede: ["rede do territorio"],
      metas: ["metas e evolucao", "metas", "registro de atendimentos"], estrategias: ["estrategias e eixos", "estrategias"],
      plano: ["elaboracao do plano"], encerramento: ["encerramento"], anexos: ["anexos"], observacoes: ["observacoes"],
      graficos: ["graficos da familia"]
    };
    if (typeof SECTIONS !== "undefined") {
      SECTIONS.forEach(sec => {
        Paulus.registrarAcao({
          id: "secao-" + sec.id,
          rotulos: (APELIDOS_SECAO[sec.id] || []).concat([sec.label]),
          executar: () => { if (sessaoAtiva() && irParaSecao(sec.id)) fecharSeCelular(); }
        });
      });
    }

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
    const aprendi = el("button", "paulus-icon-btn", "O que aprendi");
    aprendi.type = "button";
    aprendi.title = "Ver, desligar, exportar ou apagar o que o Paulus aprendeu neste aparelho";
    aprendi.addEventListener("click", mostrarMemoria);
    const fechar = el("button", "paulus-icon-btn paulus-close", "×");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar conversa");
    fechar.addEventListener("click", fecharPainel);
    acoes.appendChild(aprendi);
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
    inputArquivo = el("input");
    inputArquivo.type = "file";
    inputArquivo.multiple = true;
    inputArquivo.accept = "application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png";
    inputArquivo.hidden = true;
    inputArquivo.addEventListener("change", () => { adicionarArquivos(inputArquivo.files); inputArquivo.value = ""; });
    btnAnexo = el("button", "paulus-attach", "📎");
    btnAnexo.type = "button";
    btnAnexo.title = "Anexar PDF ou foto para o Paulus editar (fica neste aparelho)";
    btnAnexo.setAttribute("aria-label", "Anexar PDF ou foto para o Paulus editar neste aparelho");
    btnAnexo.addEventListener("click", () => inputArquivo.click());
    btnEnviar = el("button", "paulus-send", "Enviar");
    btnEnviar.type = "button";
    btnEnviar.addEventListener("click", () => enviar());
    btnParar = el("button", "paulus-stop", "Parar");
    btnParar.type = "button";
    btnParar.hidden = true;
    btnParar.addEventListener("click", () => { if (aborto) aborto.abort(); });
    rodape.appendChild(btnAnexo);
    rodape.appendChild(entrada);
    rodape.appendChild(btnEnviar);
    rodape.appendChild(btnParar);

    const aviso = el("p", "paulus-note",
      "Não digite nomes, documentos, telefones ou endereços de famílias. Respostas geradas por IA: confira antes de usar em atendimento.");

    painel.appendChild(cab);
    painel.appendChild(statusEl);
    painel.appendChild(log);
    painel.appendChild(areaSugestoes);
    areaAnexos = el("div", "paulus-anexos");
    areaAnexos.hidden = true;
    painel.appendChild(areaAnexos);
    painel.appendChild(inputArquivo);
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
    const base = [];
    // No formulário, a primeira sugestão é a pergunta técnica da seção aberta (só o id da seção, nunca o conteúdo).
    if (state && state.view === "editor" && typeof MASCOTE_PERGUNTAS_SECAO !== "undefined" && MASCOTE_PERGUNTAS_SECAO[state.activeSection]) {
      const q = MASCOTE_PERGUNTAS_SECAO[state.activeSection];
      base.push({ rotulo: q, texto: q });
      const q2 = typeof MASCOTE_PERGUNTAS_SECAO_2 !== "undefined" ? MASCOTE_PERGUNTAS_SECAO_2[state.activeSection] : "";
      if (q2) base.push({ rotulo: q2, texto: q2 });
    }
    // Fora do formulário, a primeira sugestão é sobre a tela aberta (texto fixo; nada do conteúdo da tela).
    const perguntaTela = PERGUNTAS_TELA[state && state.view];
    if (perguntaTela) base.push({ rotulo: perguntaTela, texto: perguntaTela });
    if (state && state.view === "editor" && secaoDisponivel(state.activeSection)) base.push({ rotulo: "Explicar esta seção", explicar: true });
    const pessoais = (typeof Paulus.sugestoesPessoais === "function") ? Paulus.sugestoesPessoais(3) : ((sk && sk.sugestoes) || []);
    pessoais.forEach(t => base.push({ rotulo: t, texto: t }));
    base.length = Math.min(base.length, 3);
    base.push({ rotulo: "Dica do PAIF", dica: true });
    chips(base, c => {
      if (c.explicar) { explicarSecao(); return; }
      if (c.dica) {
        const secDica = (typeof MASCOTE_DICAS_SECAO !== "undefined" && state && state.view === "editor") ? MASCOTE_DICAS_SECAO[state.activeSection] : "";
        if (secDica && Math.random() < 0.5) { mensagem("paulus", secDica); return; }
        const dicas = (typeof MASCOTE_DICAS !== "undefined" && MASCOTE_DICAS.length) ? MASCOTE_DICAS : [];
        if (dicas.length) mensagem("paulus", dicas[Math.floor(Math.random() * dicas.length)]);
      } else enviar(c.texto);
    });
  }

  function boasVindas() {
    log.textContent = "";
    const sk = Paulus.skin(APP_ID);
    mensagem("paulus", (sk && sk.saudacao) || "Oi! Eu sou o Paulus. Posso ajudar a usar o app e tirar dúvidas do SUAS.");
    mensagem("paulus", "Também edito PDF e traço rota, aqui no aparelho (sem IA e sem enviar nada): toque no 📎, anexe o arquivo e peça, por exemplo, \"juntar\", \"remover a página 2\" ou \"numerar as páginas\". Para rota: \"traçar rota do CRAS ao CAPS II e à UBS, de moto\".")
      .classList.add("paulus-dica-uso");
    chipsIniciais();
    atualizarStatus();
  }

  function novaConversa() {
    if (aborto) aborto.abort();
    if (typeof Paulus !== "undefined") Paulus.limpar();
    historicoLocal = [];
    ultimaPergunta = "";
    conversaIniciada = false;
    anexos = [];
    if (log) boasVindas();
    desenharAnexos();
    if (entrada) entrada.focus();
  }

  /* ------------------------------------------------------------------ MASCOTE */

  function humor(mood, voltarMs) {
    if (typeof mascoteRenderizar !== "function") return;
    mascoteRenderizar(mood);
    clearTimeout(humorTimer);
    if (voltarMs) humorTimer = setTimeout(() => mascoteRenderizar("normal"), voltarMs);
  }

  /* ------------------------------------------------------------------ CONHECIMENTO DO APP NA CONVERSA */

  const verbetesDaSecao = id => Array.from(verbetesApp.values()).filter(v => v.secao === id);

  // Mostra o verbete COMPLETO (a busca devolve só um resumo) e, se houver PAF aberto, oferece ir à seção.
  function mostrarVerbete(v) {
    const m = mensagem("paulus", v.texto);
    m.appendChild(el("p", "paulus-aviso", "Fonte: " + v.titulo + ". " + (v.norma || "")));
    const opcoes = [];
    if (v.secao && secaoDisponivel(v.secao)) opcoes.push({ rotulo: "Ir para: " + encurtar(rotuloSecao(v.secao), 32), secao: v.secao });
    opcoes.push({ rotulo: "Voltar às sugestões", voltar: true });
    chips(opcoes, c => {
      if (c.secao) { if (irParaSecao(c.secao)) fecharSeCelular(); } else chipsIniciais();
    });
  }

  function explicarSecao() {
    const id = state && state.activeSection;
    const todos = verbetesDaSecao(id);
    const guia = todos.find(v => v.doc === "umbrella-secoes");
    if (!guia) { mensagem("paulus", "Ainda estou carregando o conteúdo do app. Tente de novo em instantes."); return; }
    const m = mensagem("paulus", guia.texto);
    const notas = todos.filter(v => v.doc === "umbrella-notas-tecnicas");
    if (notas.length) {
      m.appendChild(el("p", "paulus-aviso", "Esta seção tem " + notas.length + " nota(s) técnica(s). Toque em uma para eu mostrar completa."));
      chips(notas.slice(0, 4).map(v => ({ rotulo: encurtar(v.rotulo || v.referencia, 44), verbete: v })), c => mostrarVerbete(c.verbete));
    }
  }

  // Consulta SÓ a base local, com a pergunta limpa e com sinônimos do PAIF. Nunca vai à rede.
  async function consultaLocal(texto) {
    if (typeof Paulus === "undefined" || typeof Paulus.consultarNormas !== "function") return null;
    const refinada = (typeof PaulusConsulta !== "undefined") ? PaulusConsulta.refinar(texto).expandida : texto;
    const hist = historicoLocal.map(t => ({ papel: "usuario", texto: t }));
    try { return await Paulus.consultarNormas(refinada, { historico: hist }); } catch (e) { return null; }
  }

  const achadosDoApp = loc =>
    ((loc && loc.fontes) || []).map(f => verbetesApp.get(chaveVerbete(f.documento, f.referencia))).filter(Boolean).slice(0, 2);

  // Depois da resposta do Paulus: sem IA (ou sem resposta), a busca com a pergunta refinada costuma achar melhor;
  // com IA, só acrescenta os trechos do próprio app ("No app: ...") para a pessoa conferir e navegar.
  async function aprimorar(texto, r) {
    if (!r) return r;
    if (r.tipo === "sem_resposta" || r.tipo === "norma") {
      const loc = await consultaLocal(texto);
      if (loc) r = loc;
    }
    if (r.tipo === "norma") r.noApp = achadosDoApp(r);
    else if (r.tipo === "ia") r.noApp = achadosDoApp(await consultaLocal(texto));
    return r;
  }

  /* ------------------------------------------------------------------ PDF NO APARELHO */

  const LIMITE_ARQUIVOS = 10, LIMITE_BYTES = 40 * 1024 * 1024;

  function descreverTamanho(n) {
    return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  }

  // Mostra os arquivos escolhidos (nome e tamanho; nada além disso) com botão de remover.
  function desenharAnexos() {
    if (!areaAnexos) return;
    areaAnexos.textContent = "";
    areaAnexos.hidden = !anexos.length;
    if (!anexos.length) return;
    areaAnexos.appendChild(el("p", "paulus-aviso", "Neste aparelho, sem enviar: " + anexos.length + " arquivo(s). Diga o que fazer (ex.: \"juntar\")."));
    anexos.forEach((a, i) => {
      const linha = el("span", "paulus-anexo");
      linha.appendChild(el("span", "paulus-anexo-nome", encurtar(a.nome || a.name || "arquivo", 28) + " · " + descreverTamanho(a.bytes ? a.bytes.length : (a.size || 0))));
      const x = el("button", "paulus-anexo-x", "×");
      x.type = "button";
      x.setAttribute("aria-label", "Remover " + (a.nome || a.name || "arquivo"));
      x.addEventListener("click", () => { anexos.splice(i, 1); desenharAnexos(); });
      linha.appendChild(x);
      areaAnexos.appendChild(linha);
    });
  }

  function adicionarArquivos(lista) {
    const novos = Array.from(lista || []);
    let recusados = 0;
    novos.forEach(f => {
      const tipoOk = /pdf|jpe?g|png/i.test(f.type || "") || /\.(pdf|jpe?g|png)$/i.test(f.name || "");
      if (!tipoOk || f.size > LIMITE_BYTES || anexos.length >= LIMITE_ARQUIVOS) { recusados++; return; }
      anexos.push(f);   // o File fica só em memória; quem lê os bytes é o Paulus, no aparelho
    });
    desenharAnexos();
    if (recusados) mensagem("paulus", recusados + " arquivo(s) não entraram: só PDF, JPG e PNG, até " + descreverTamanho(LIMITE_BYTES) + " cada e " + LIMITE_ARQUIVOS + " no máximo.");
    if (anexos.length && entrada) entrada.focus();
  }

  function limparAnexos() { anexos = []; desenharAnexos(); }

  // Resultado de edição de PDF: texto do que foi feito + baixar + continuar editando o resultado.
  function mostrarPdf(bolha, r) {
    const arquivos = r.arquivos || [];
    if (arquivos.length) {
      const lista = el("div", "paulus-arquivos");
      arquivos.forEach(a => {
        const b = el("button", "paulus-chip paulus-chip-ok", "Baixar " + encurtar(a.nome, 30) + (a.paginas ? " (" + a.paginas + " p.)" : ""));
        b.type = "button";
        b.addEventListener("click", () => { try { Paulus.pdf.baixar(a); } catch (e) { mensagem("paulus", "Não consegui baixar o arquivo."); } });
        lista.appendChild(b);
      });
      bolha.appendChild(lista);
      const seguir = el("button", "paulus-chip", "Editar este resultado");
      seguir.type = "button";
      seguir.addEventListener("click", () => {
        anexos = arquivos.map(a => ({ nome: a.nome, bytes: a.bytes }));
        desenharAnexos();
        seguir.remove();
        if (entrada) entrada.focus();
      });
      bolha.appendChild(seguir);
      limparAnexos();   // os originais já foram usados
    }
    if (r.precisaArquivo) {
      const b = el("button", "paulus-chip", "📎 Anexar arquivo");
      b.type = "button";
      b.addEventListener("click", () => inputArquivo && inputArquivo.click());
      bolha.appendChild(b);
    }
    anexarAvisos(bolha, r.avisos);
  }

  /* ------------------------------------------------------------------ ROTA */

  // Link só se for https (vem do Paulus, mas a tela confere de novo). Abre sem dar acesso à janela de origem.
  function mostrarRota(bolha, r) {
    (r.links || []).forEach(l => {
      if (!l || !/^https:\/\//i.test(String(l.url || ""))) return;
      const a = el("a", "paulus-chip paulus-chip-ok", l.rotulo || "Abrir a rota no app de mapas");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      bolha.appendChild(a);
    });
    // Esquema em SVG: vai numa <img> com data: URI, então o navegador não executa script nem evento, mesmo que o SVG tenha algo estranho.
    if (r.svg && typeof r.svg === "string") {
      const d = el("details", "paulus-fontes");
      d.appendChild(el("summary", "", "Esquema da rota"));
      const img = el("img", "paulus-rota-svg");
      img.alt = "Esquema da rota na ordem sugerida: " + ((r.paradas || []).join(", ") || "paradas");
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.svg);
      d.appendChild(img);
      bolha.appendChild(d);
    }
    if (r.km != null && r.minutos != null) {
      bolha.appendChild(el("p", "paulus-aviso", "Estimativa em linha reta, sem trânsito: confira no app de mapas antes de sair."));
    }
    anexarAvisos(bolha, r.avisos);
  }

  /* ------------------------------------------------------------------ MEMÓRIA (O QUE O PAULUS APRENDEU) */

  // Transparência: o que ficou guardado NESTE aparelho (estilo de resposta, temas, apelidos de tela). Nunca vai ao servidor.
  function mostrarMemoria() {
    if (!garantirInicio() || !Paulus.memoria || typeof Paulus.memoria.resumo !== "function") {
      mensagem("paulus", "A memória de uso não está disponível agora.");
      return;
    }
    let res;
    try { res = Paulus.memoria.resumo(); } catch (e) { res = null; }
    const m = mensagem("paulus", null);
    if (!res) { renderTexto(m, "Não consegui ler a memória agora."); return; }
    const linhas = (res.linhas || []).map(t => "- " + t).join("\n");
    renderTexto(m, "Isto fica só neste aparelho (o servidor não guarda nada). " +
      (res.ativa ? "Aprendizado ligado." : "Aprendizado desligado.") + "\n" +
      (res.vazia ? "Ainda não aprendi nada sobre o seu jeito de usar." : linhas));
    const linha = el("div", "paulus-confirm");
    const botao = (rotulo, fn) => {
      const b = el("button", "paulus-chip", rotulo);
      b.type = "button";
      b.addEventListener("click", fn);
      linha.appendChild(b);
      return b;
    };
    botao(res.ativa ? "Desligar aprendizado" : "Ligar aprendizado", () => {
      try { Paulus.memoria.ligar(!res.ativa); } catch (e) { /* opcional */ }
      linha.remove();
      m.appendChild(el("p", "paulus-aviso", res.ativa ? "Desligado. O que já aprendi fica guardado, mas não uso." : "Ligado."));
    });
    if (!res.vazia) {
      botao("Apagar tudo", () => {
        try { Paulus.memoria.esquecer(); } catch (e) { /* opcional */ }
        linha.remove();
        m.appendChild(el("p", "paulus-aviso", "Apaguei o que tinha aprendido."));
        chipsIniciais();
      });
      botao("Exportar", () => {
        try {
          const blob = new Blob([Paulus.memoria.exportar()], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = el("a");
          a.href = url;
          a.download = "paulus-memoria.json";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (e) { m.appendChild(el("p", "paulus-aviso", "Não consegui exportar.")); }
      });
    }
    m.appendChild(linha);
  }

  /* ------------------------------------------------------------------ ENVIO E RESPOSTA */

  function definirOcupado(v) {
    ocupado = v;
    btnEnviar.hidden = v;
    btnParar.hidden = !v;
    entrada.disabled = v;
    if (btnAnexo) btnAnexo.disabled = v;
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

  // "Usei: Visita domiciliar": mostra o roteiro de trabalho que o Paulus aplicou (só o nome, vem do Worker).
  function anexarHabilidades(bolha, habilidades) {
    if (!habilidades || !habilidades.length) return;
    bolha.appendChild(el("p", "paulus-aviso", "Usei: " + habilidades.join(" · ")));
  }

  // 👍 / 👎 / Mais curto: o Paulus aprende o estilo no aparelho (Paulus.avaliar); nada vai ao servidor.
  function anexarReacao(bolha, r) {
    if (typeof Paulus.avaliar !== "function" || !r || r.tipo === "calculo") return;
    const linha = el("div", "paulus-reacao");
    const botao = (rotulo, aria, sinal, resposta, refazer) => {
      const b = el("button", "paulus-chip", rotulo);
      b.type = "button";
      b.setAttribute("aria-label", aria);
      b.addEventListener("click", () => {
        try { Paulus.avaliar(r, sinal); } catch (e) { /* aprender é opcional */ }
        linha.remove();
        if (resposta) bolha.appendChild(el("p", "paulus-aviso", resposta));
        if (refazer) enviar(refazer);
      });
      return b;
    };
    linha.appendChild(botao("👍", "Resposta útil", "bom", "Obrigado! Vou lembrar do que funcionou."));
    linha.appendChild(botao("👎", "Resposta ruim", "ruim", "Entendi. Vou ajustar o jeito de responder."));
    const copiar = el("button", "paulus-chip", "Copiar");
    copiar.type = "button";
    copiar.addEventListener("click", () => {
      const t = bolha.querySelector("p, ul") ? Array.from(bolha.querySelectorAll("p:not(.paulus-aviso), li")).map(n => n.textContent).join("\n") : "";
      try {
        navigator.clipboard.writeText(t).then(() => { copiar.textContent = "Copiado"; try { Paulus.avaliar(r, "copiou"); } catch (e) {} });
      } catch (e) { copiar.textContent = "Não foi possível"; }
    });
    linha.appendChild(botao("Mais curto", "Pedir resposta mais curta", "mais_curto", "", "mais curto"));
    linha.appendChild(copiar);
    bolha.appendChild(linha);
  }

  function ofereceNovaTentativa(bolha, texto) {
    const b = el("button", "paulus-chip", "↻ Tentar de novo");
    b.type = "button";
    b.addEventListener("click", () => { b.remove(); enviar(texto); });
    bolha.appendChild(b);
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
      case "calculo":
        anexarFontes(bolha, r.fontes);
        anexarAvisos(bolha, r.avisos);
        anexarHabilidades(bolha, r.habilidades);
        anexarReacao(bolha, r);
        {
          const lista = (r.noApp || []).map(v => ({ rotulo: "No app: " + encurtar(v.rotulo || v.referencia, 34), verbete: v }))
            .concat((r.sugestoes || []).slice(0, 2).map(t => ({ rotulo: t, texto: t })));
          if (lista.length) chips(lista, c => (c.verbete ? mostrarVerbete(c.verbete) : enviar(c.texto)));
          else chipsIniciais();
        }
        break;
      case "pdf":
        mostrarPdf(bolha, r);
        chipsIniciais();
        break;
      case "rota":
        mostrarRota(bolha, r);
        chipsIniciais();
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
        if (r.opcoesAcoes && r.opcoesAcoes.length && typeof r.aprender === "function") {
          bolha.appendChild(el("p", "paulus-aviso", "Não achei essa tela. Era uma destas?"));
          chips(r.opcoesAcoes.map(o => ({ rotulo: o.rotulo, id: o.id })), c => {
            try { r.aprender(c.id); } catch (e) { /* aprender é opcional */ }
            enviar("abrir " + c.rotulo);
          });
        } else if (r.opcoes && r.opcoes.length) chips(r.opcoes.map(o => ({ rotulo: "abrir " + o, texto: "abrir " + o })), c => enviar(c.texto));
        break;
      case "erro":
      case "sem_resposta":
        mood = "preocupado";
        if (r.pergunta || ultimaPergunta) ofereceNovaTentativa(bolha, ultimaPergunta);
        break;
      case "bloqueio":
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
    conversaIniciada = true;
    ultimaPergunta = Paulus.temDadoPessoal(texto) ? "" : texto;

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
      let r = await Paulus.perguntar(texto, {
        aba: abaAtual(),
        arquivos: anexos.length ? anexos.slice() : undefined,   // só para edição de PDF no aparelho; nunca vão à rede
        sinal: aborto ? aborto.signal : undefined,
        onToken: (_pedaco, tudo) => {
          bolha.classList.remove("paulus-digitando");
          renderTexto(bolha, tudo);
          rolarParaFim();
        }
      });
      if (!painel) return;   // a sessão acabou no meio da resposta: o painel já foi apagado
      r = await aprimorar(texto, r);
      if (!painel) return;
      if (!sensivel) { historicoLocal.push(texto); historicoLocal = historicoLocal.slice(-3); }
      bolha.classList.remove("paulus-digitando");
      mostrarResultado(bolha, r);
    } catch (e) {
      if (!painel) return;
      bolha.classList.remove("paulus-digitando");
      renderTexto(bolha, "Não consegui responder agora. Tente de novo em instantes.");
      if (ultimaPergunta) ofereceNovaTentativa(bolha, ultimaPergunta);
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
    historicoLocal = [];
    ultimaPergunta = "";
    conversaIniciada = false;
    anexos = [];   // PDFs escolhidos somem da memória junto com a conversa
    if (painel) { painel.remove(); painel = log = entrada = btnEnviar = btnParar = areaSugestoes = statusEl = inputArquivo = areaAnexos = btnAnexo = null; }
    ocupado = false;
  }

  carregarBase();

  window.paulusAbrir = abrirPainel;
  window.paulusEncerrar = encerrar;
})();
