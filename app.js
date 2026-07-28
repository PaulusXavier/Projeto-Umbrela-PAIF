/* =========================================================================
   Plano de Acompanhamento Familiar - PAF / PAIF
   Lógica do aplicativo: dados, telas, sincronização e exportação.
   ========================================================================= */

/* ---------------------------- Registro do Service Worker (Offline/PWA) ---------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}

/* ---------------------------- Listas fixas do formulário ---------------------------- */

const VULNERABILIDADES_FAMILIA = [
  "Famílias de baixa renda",
  "Famílias beneficiárias do Programa Bolsa Família",
  "Famílias beneficiárias do Programa Bolsa Família, em não cumprimento de condicionalidades",
  "Famílias com membros beneficiários do Benefício de Prestação Continuada - BPC",
  "Famílias que atendem aos critérios de elegibilidade do Programa Bolsa Família e do BPC, mas que ainda não foram beneficiadas",
  "Famílias em situação de vulnerabilidade em decorrência de dificuldades vivenciadas por algum de seus membros",
  "Pessoas com deficiência e/ou pessoas idosas que vivenciam situações de vulnerabilidade e risco social",
  "Famílias com crianças ou adolescentes em situação de trabalho infantil",
  "Famílias com crianças ou adolescentes em Serviço de Acolhimento Institucional"
];

const SITUACOES_SOCIAIS = [
  "Ausência de documentação civil",
  "Precária situação de moradia",
  "Dificuldade de acesso a serviços públicos/benefícios",
  "Em contextos de violência",
  "Família de baixa renda",
  "Ausência de qualificação profissional",
  "Criança/adolescente fora da escola",
  "Criança/adolescente com baixa frequência escolar",
  "Beneficiária do PBF",
  "Beneficiária do PBF, em não cumprimento de condicionalidades",
  "Beneficiária(s) do BPC",
  "Famílias elegíveis ao PBF",
  "Famílias elegíveis ao BPC",
  "Situação de Trabalho infantil",
  "Membro da família em privação de liberdade",
  "Egresso de sistema penitenciário",
  "Uso abusivo de álcool e outras drogas",
  "Vivência de situações de discriminação relacionada com a cor, origem, religião, local de moradia, sexo, orientação sexual",
  "Questões relacionadas a saúde mental",
  "Membro com problemas de saúde com doença limitadora de atividades cotidianas",
  "Pessoa(s) com deficiência(s)",
  "Presença de idosos com dependência que permanecem períodos do dia em casa sem a companhia de outro adulto",
  "Maternidade/Paternidade na adolescência",
  "Crianças pequenas que permanecem períodos do dia em casa sem a companhia de um adulto",
  "Família que reside a pouco tempo na cidade",
  "Outras situações"
];

const SERVICOS_BASICA = ["PAIF", "SCFV", "Serviço de Proteção Social Básica no Domicílio para Pessoas com Deficiência e Idosas"];
const SERVICOS_MEDIA = ["PAEFI", "Medidas Socioeducativas em Meio Aberto", "Para idosos, PCD e suas famílias", "Para pessoas em situação de rua"];
const SERVICOS_ALTA = ["Acolhimento Institucional", "Acolhimento em República", "Acolhimento em Família Acolhedora"];

const PROGRAMAS_QUAIS = ["Bolsa Família", "BPC - Benefício de Prestação Continuada", "Programa Família que Acolhe (FQA)"];
const BENEFICIOS_QUAIS = ["Cesta Básica", "Auxílio Natalidade", "Auxílio Funeral", "Aluguel Social", "Auxílio transporte", "Em Pecúnia (dinheiro, cartão, cheque, depósito bancário)"];
const REDE_APOIO = ["Creches", "Escolas em tempo integral", "Projetos sociais em contraturno escolar", "OSC's e/ou associação de bairro"];

const METAS_FIXAS = [
  "Fortalecer a função protetiva da família",
  "Prevenir a ruptura de vínculos",
  "Promover aquisições sociais",
  "Promover acesso a benefícios",
  "Promover acesso a programas de transferência de renda",
  "Encaminhar à rede intersetorial (serviços da política pública)",
  "Promover a inclusão escolar",
  "Encaminhar para acesso/regularização à documentação civil",
  "Elaboração de relatório externo",
  "Demais encaminhamentos",
  "Inserir em ações do PAIF"
];

const ESTRATEGIAS = ["Atendimento técnico", "Atendimento multiprofissional", "Visita domiciliar", "Inserção no SCFV",
  "Elaboração de relatório externo", "Articulação com a rede socioassistencial e/ou intersetorial",
  "Estudo Social", "Oficinas com famílias", "Ações particularizadas", "Participação em ações comunitárias", "Encaminhamentos"];

const EIXOS = ["Educação", "Saúde", "Habitação", "Trabalho", "Qualificação Profissional/Cursos",
  "Sociocultural/Esporte e Lazer", "Serviços Socioassistenciais", "Documentação", "Aspectos jurídicos",
  "Sistema de justiça", "Conselho Tutelar", "Programas e benefícios socioassistenciais"];

const ENCERRAMENTO_MOTIVOS = [
  { v: "1", label: "Mudança de domicílio" },
  { v: "2", label: "Encaminhamento para o CREAS" },
  { v: "3", label: "Objetivos do PAIF alcançados" },
  { v: "4", label: "Óbito" },
  { v: "5", label: "Recusa da família" },
  { v: "6", label: "Outros" }
];

const STATUS_LABELS = { andamento: "Em andamento", encaminhado: "Encaminhado", concluido: "Concluído", cancelado: "Cancelado" };

const SECTIONS = [
  { id: "cabecalho", label: "Cabeçalho" },
  { id: "familia", label: "Membros da Família" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "grupo", label: "Situações e Serviços" },
  { id: "programas", label: "Programas e Benefícios" },
  { id: "rede", label: "Rede do Território" },
  { id: "metas", label: "Metas e Evolução" },
  { id: "estrategias", label: "Estratégias e Eixos" },
  { id: "plano", label: "Elaboração do Plano" },
  { id: "encerramento", label: "Encerramento" },
  { id: "observacoes", label: "Observações" }
];

/* ---------------------------- Estado ---------------------------- */

const state = {
  view: "home",              // 'home' | 'editor'
  pafs: [],                  // todos os registros
  current: null,             // PAF em edição
  activeSection: "cabecalho",
  search: "",
  statusFilter: "todos",
  mode: "local",             // 'cloud' | 'local'
  db: null,
  unsub: null,
  saveTimer: null,
  railOpen: false
};

function uid() {
  return "paf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyPAF() {
  const now = new Date().toISOString();
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    crasNome: "",
    responsavel: "",
    cpf: "",
    nis: "",
    endereco: "",
    dataInicial: todayISO(),
    periodicidade: "",
    situacaoPAF: "andamento",
    situacaoData: "",
    membros: [{ nome: "", nascimento: "", parentesco: "" }],
    vulnerabilidades: [],
    vulnerabilidadesOutros: "",
    situacoesSociais: SITUACOES_SOCIAIS.map(s => ({ situacao: s, membros: "", superada: false })),
    servBasica: [], servMedia: [], servAlta: [],
    participaProgramas: "",
    programasQuais: [],
    programasMunicipalQual: "",
    programasProjetoQual: "",
    programasOutros: "",
    recebeBeneficio: "",
    beneficioQuais: [],
    beneficioOutro: "",
    redeApoio: [],
    redeApoioOutros: "",
    metas: METAS_FIXAS.map(m => ({ meta: m, prazo: "", resultados: "" })),
    estrategias: [],
    estrategiasOutras: "",
    eixos: [],
    eixosOutros: "",
    familiaParticipou: "",
    prazoExecucaoPlano: "",
    prazoAvaliacaoPlano: "",
    tecnicoReferencia: "",
    dataElaboracao: todayISO(),
    encerramentoMotivo: "",
    encerramentoOutros: "",
    encerramentoTecnico: "",
    encerramentoData: "",
    observacoes: ""
  };
}

/* ---------------------------- Utilitários de dados ---------------------------- */

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = isFinite(keys[i + 1]) ? [] : {};
    if (o[keys[i]] === undefined || o[keys[i]] === null) o[keys[i]] = Array.isArray(k) ? [] : {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
}
function toggleArrayValue(arr, value) {
  const i = arr.indexOf(value);
  if (i === -1) arr.push(value); else arr.splice(i, 1);
  return arr;
}
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/* ---------------------------- Modal e Toast ---------------------------- */

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function confirmModal(title, msg, onConfirm) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-box">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(msg)}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modalCancel">Cancelar</button>
          <button class="btn btn-danger" id="modalConfirm">Confirmar</button>
        </div>
      </div>
    </div>`;
  document.getElementById("modalCancel").onclick = () => root.innerHTML = "";
  document.getElementById("modalConfirm").onclick = () => {
    onConfirm();
    root.innerHTML = "";
  };
}

/* ---------------------------- Firebase / armazenamento ---------------------------- */

function firebaseConfigured() {
  return typeof FIREBASE_CONFIG !== "undefined" &&
    FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "COLE_AQUI" &&
    FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId !== "COLE_AQUI";
}

function setSyncPill(kind, label) {
  const pill = document.getElementById("syncPill");
  if (!pill) return;
  pill.className = "sync-pill " + kind;
  document.getElementById("syncLabel").textContent = label;
}

function initStorage() {
  if (firebaseConfigured()) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      state.db = firebase.firestore();
      state.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      state.mode = "cloud";
      setSyncPill("ok", "Sincronizado (nuvem)");
      subscribeCloud();
    } catch (e) {
      console.error(e);
      state.mode = "local";
      setSyncPill("err", "Falha na nuvem — usando local");
      loadLocal();
    }
  } else {
    state.mode = "local";
    setSyncPill("local", "Somente neste dispositivo");
    loadLocal();
  }
}

function subscribeCloud() {
  const col = state.db.collection(FIRESTORE_COLLECTION);
  state.unsub = col.onSnapshot(
    snap => {
      state.pafs = snap.docs.map(d => d.data());
      localStorage.setItem("paf_cache", JSON.stringify(state.pafs));
      setSyncPill("ok", "Sincronizado (nuvem)");
      if (state.view === "home") renderApp();
    },
    err => {
      console.error(err);
      setSyncPill("err", "Sem conexão — mostrando cópia local");
      loadLocalCacheOnly();
    }
  );
}

function loadLocalCacheOnly() {
  const raw = localStorage.getItem("paf_cache");
  state.pafs = raw ? JSON.parse(raw) : [];
  if (state.view === "home") renderApp();
}

function loadLocal() {
  const raw = localStorage.getItem("paf_records");
  state.pafs = raw ? JSON.parse(raw) : [];
  renderApp();
}

function persistLocalArray() {
  localStorage.setItem("paf_records", JSON.stringify(state.pafs));
}

function savePAF(paf, opts = {}) {
  paf.updatedAt = new Date().toISOString();
  if (state.mode === "cloud" && state.db) {
    state.db.collection(FIRESTORE_COLLECTION).doc(paf.id).set(paf)
      .then(() => { if (!opts.silent) toast("Salvo e sincronizado."); })
      .catch(err => { console.error(err); toast("Não foi possível sincronizar — verifique a conexão."); });
  } else {
    const idx = state.pafs.findIndex(p => p.id === paf.id);
    if (idx === -1) state.pafs.unshift(paf); else state.pafs[idx] = paf;
    persistLocalArray();
    if (!opts.silent) toast("Salvo neste dispositivo.");
  }
}

function deletePAFRecord(id) {
  if (state.mode === "cloud" && state.db) {
    state.db.collection(FIRESTORE_COLLECTION).doc(id).delete()
      .then(() => toast("Registro excluído."))
      .catch(err => { console.error(err); toast("Não foi possível excluir na nuvem."); });
  } else {
    state.pafs = state.pafs.filter(p => p.id !== id);
    persistLocalArray();
    toast("Registro excluído.");
  }
  if (!state.db) renderApp();
}

function scheduleAutosave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    if (state.current) savePAF(state.current, { silent: true });
  }, 700);
}

/* ---------------------------- Navegação ---------------------------- */

function goHome() {
  state.view = "home";
  state.current = null;
  renderApp();
}

function openPAF(id) {
  const paf = state.pafs.find(p => p.id === id);
  if (!paf) return;
  state.current = JSON.parse(JSON.stringify(paf));
  const blank = emptyPAF();
  Object.keys(blank).forEach(k => { if (state.current[k] === undefined) state.current[k] = blank[k]; });
  state.view = "editor";
  state.activeSection = "cabecalho";
  renderApp();
}

function newPAF() {
  state.current = emptyPAF();
  state.view = "editor";
  state.activeSection = "cabecalho";
  savePAF(state.current, { silent: true });
  renderApp();
}

/* ---------------------------- Render: SHELL ---------------------------- */

function renderApp() {
  const main = document.getElementById("mainArea");
  main.innerHTML = state.view === "home" ? renderHomeHTML() : renderEditorHTML();
  attachGlobalHandlers();
  if (state.view === "home") attachHomeHandlers(); else attachEditorHandlers();
}

/* ---------------------------- Render: HOME ---------------------------- */

function renderHomeHTML() {
  const q = state.search.trim().toLowerCase();
  let list = state.pafs.filter(p => {
    const matchesQ = !q || (p.responsavel || "").toLowerCase().includes(q) || (p.cpf || "").includes(q) || (p.crasNome || "").toLowerCase().includes(q);
    const matchesStatus = state.statusFilter === "todos" || p.situacaoPAF === state.statusFilter;
    return matchesQ && matchesStatus;
  }).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const chips = ["todos", "andamento", "encaminhado", "concluido", "cancelado"].map(s => {
    const label = s === "todos" ? "Todos" : STATUS_LABELS[s];
    return `<button class="filter-chip ${state.statusFilter === s ? "active" : ""}" data-status="${s}">${label}</button>`;
  }).join("");

  const cards = list.map(p => {
    const membrosCount = (p.membros || []).filter(m => m.nome).length;
    return `
    <div class="paf-card status-${p.situacaoPAF}" data-open="${p.id}">
      <span class="stamp ${p.situacaoPAF}">${STATUS_LABELS[p.situacaoPAF] || "Em andamento"}</span>
      <h3>${escapeHtml(p.responsavel) || "Sem nome do responsável"}</h3>
      <div class="meta">
        <span>CRAS: ${escapeHtml(p.crasNome) || "—"}</span>
        <span>Início: ${fmtDateBR(p.dataInicial) || "—"} · ${membrosCount} membro(s)</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-open="${p.id}">Abrir</button>
        <div class="export-menu">
          <button class="btn btn-ghost btn-sm" data-export-toggle="${p.id}">Exportar ▾</button>
          <div class="export-dropdown" id="exp-${p.id}" style="display:none">
            <button data-export-pdf="${p.id}">Baixar PDF</button>
            <button data-export-word="${p.id}">Baixar Word (.doc)</button>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" data-del="${p.id}">Excluir</button>
      </div>
    </div>`;
  }).join("");

  const empty = `
    <div class="empty-state">
      <div class="glyph">🗂️</div>
      <p>${state.pafs.length === 0 ? "Nenhum Plano de Acompanhamento Familiar cadastrado ainda." : "Nenhum registro corresponde à busca/filtro."}</p>
      ${state.pafs.length === 0 ? '<button class="btn btn-primary" id="emptyNewBtn">+ Novo PAF</button>' : ""}
    </div>`;

  return `
  <div class="home-wrap">
    <div class="home-head">
      <div>
        <h1>Planos de Acompanhamento Familiar</h1>
        <p>PAF · Serviço de Proteção e Atendimento Integral à Família (PAIF)</p>
      </div>
      <button class="btn btn-primary" id="newPafBtn">+ Novo PAF</button>
    </div>
    <div class="search-row">
      <input type="search" id="searchInput" placeholder="Buscar por responsável, CPF ou CRAS…" value="${escapeHtml(state.search)}">
      ${chips}
    </div>
    ${list.length ? `<div class="paf-grid">${cards}</div>` : empty}
  </div>`;
}

function attachHomeHandlers() {
  document.getElementById("newPafBtn")?.addEventListener("click", newPAF);
  document.getElementById("emptyNewBtn")?.addEventListener("click", newPAF);
  const search = document.getElementById("searchInput");
  search?.addEventListener("input", e => { state.search = e.target.value; renderApp(); focusSearchEnd(); });

  document.querySelectorAll("[data-status]").forEach(btn => {
    btn.addEventListener("click", () => { state.statusFilter = btn.dataset.status; renderApp(); });
  });
  document.querySelectorAll("[data-open]").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); openPAF(el.dataset.open); });
  });
  document.querySelectorAll("[data-del]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmModal("Excluir este PAF?", "Essa ação não pode ser desfeita. O registro será removido de todos os dispositivos sincronizados.", () => deletePAFRecord(el.dataset.del));
    });
  });
  document.querySelectorAll("[data-export-toggle]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = document.getElementById("exp-" + el.dataset.exportToggle);
      const isOpen = dd.style.display === "block";
      document.querySelectorAll(".export-dropdown").forEach(d => d.style.display = "none");
      dd.style.display = isOpen ? "none" : "block";
    });
  });
  document.querySelectorAll("[data-export-pdf]").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); exportPDF(state.pafs.find(p => p.id === el.dataset.exportPdf)); });
  });
  document.querySelectorAll("[data-export-word]").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); exportWord(state.pafs.find(p => p.id === el.dataset.exportWord)); });
  });
}

function focusSearchEnd() {
  const el = document.getElementById("searchInput");
  if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
}

/* ---------------------------- Render: EDITOR ---------------------------- */

function tabCompleteness(paf) {
  return {
    cabecalho: !!(paf.responsavel && paf.crasNome),
    familia: paf.membros.some(m => m.nome),
    diagnostico: paf.vulnerabilidades.length > 0,
    grupo: paf.situacoesSociais.some(s => s.membros) || paf.servBasica.length || paf.servMedia.length || paf.servAlta.length,
    programas: !!paf.participaProgramas,
    rede: paf.redeApoio.length > 0,
    metas: paf.metas.some(m => m.prazo || m.resultados),
    estrategias: paf.estrategias.length > 0,
    plano: !!(paf.tecnicoReferencia && paf.prazoExecucaoPlano),
    encerramento: !!paf.encerramentoMotivo,
    observacoes: !!paf.observacoes
  };
}

function renderEditorHTML() {
  const paf = state.current;
  const complete = tabCompleteness(paf);
  const rail = SECTIONS.map(s => `
    <div class="tab-item ${state.activeSection === s.id ? "active" : ""} ${complete[s.id] ? "complete" : ""}" data-section="${s.id}">
      <span class="rivet"></span>${s.label}
    </div>`).join("");

  return `
  <div class="editor-wrap">
    <nav class="tab-rail ${state.railOpen ? "open" : ""}" id="tabRail">
      <div class="rail-label">Seções do PAF</div>
      ${rail}
    </nav>
    <div class="form-scroll" id="formScroll">
      <div class="form-inner">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <button class="btn btn-ghost btn-sm" id="backHomeBtn">← Voltar à lista</button>
          <div class="status-picker" style="margin-left:auto">
            ${["andamento", "encaminhado", "concluido", "cancelado"].map(s => `
              <button class="status-opt ${paf.situacaoPAF === s ? "selected " + s : ""}" data-set-status="${s}">${STATUS_LABELS[s]}</button>
            `).join("")}
          </div>
        </div>
        ${renderSection(state.activeSection, paf)}
      </div>
    </div>
  </div>
  <div class="footer-bar">
    <button class="btn btn-ghost" id="exportPdfBtn">Baixar PDF</button>
    <button class="btn btn-ghost" id="exportWordBtn">Baixar Word (.doc)</button>
    <button class="btn btn-primary" id="saveBtn">Salvar</button>
  </div>`;
}

function sectionHeader(num, title, sub) {
  return `<h2><span class="num">${num}</span>${title}</h2>${sub ? `<p class="section-sub">${sub}</p>` : ""}`;
}

function chkList(groupName, options, selectedArr, cols) {
  return `<div class="check-list ${cols ? "grid2" : ""}">` + options.map(opt => `
    <label class="chk">
      <input type="checkbox" data-check-group="${groupName}" data-check-value="${escapeHtml(opt)}" ${selectedArr.includes(opt) ? "checked" : ""}>
      <span>${escapeHtml(opt)}</span>
    </label>`).join("") + `</div>`;
}

function renderSection(id, paf) {
  switch (id) {
    case "cabecalho": return `
      <div class="section-card">
        ${sectionHeader("01", "Cabeçalho", "Identificação do CRAS, do responsável familiar e do plano.")}
        <div class="field-grid">
          <div class="f c6"><label>Nome do CRAS</label><input type="text" data-field="crasNome" value="${escapeHtml(paf.crasNome)}"></div>
          <div class="f c6"><label>Responsável Familiar</label><input type="text" data-field="responsavel" value="${escapeHtml(paf.responsavel)}"></div>
          <div class="f c4"><label>CPF</label><input type="text" data-field="cpf" placeholder="000.000.000-00" value="${escapeHtml(paf.cpf)}"></div>
          <div class="f c4"><label>NIS</label><input type="text" data-field="nis" value="${escapeHtml(paf.nis)}"></div>
          <div class="f c4"><label>Data inicial do PAF</label><input type="date" data-field="dataInicial" value="${escapeHtml(paf.dataInicial)}"></div>
          <div class="f c8"><label>Endereço</label><input type="text" data-field="endereco" value="${escapeHtml(paf.endereco)}"></div>
          <div class="f c4"><label>Periodicidade de acompanhamento</label><input type="text" data-field="periodicidade" placeholder="Ex.: mensal, quinzenal…" value="${escapeHtml(paf.periodicidade)}"></div>
          <div class="f c4"><label>Data da situação atual</label><input type="date" data-field="situacaoData" value="${escapeHtml(paf.situacaoData)}"></div>
        </div>
      </div>`;

    case "familia": return `
      <div class="section-card">
        ${sectionHeader("02", "Membros da Família em Acompanhamento", "")}
        <table class="dyn-table">
          <thead><tr><th style="width:40%">Nome</th><th style="width:25%">Data de nascimento</th><th>Parentesco</th><th></th></tr></thead>
          <tbody>
            ${paf.membros.map((m, i) => `
              <tr>
                <td><input type="text" data-field="membros.${i}.nome" value="${escapeHtml(m.nome)}"></td>
                <td><input type="date" data-field="membros.${i}.nascimento" value="${escapeHtml(m.nascimento)}"></td>
                <td><input type="text" data-field="membros.${i}.parentesco" value="${escapeHtml(m.parentesco)}"></td>
                <td><button class="row-del" data-action="remove-membro" data-idx="${i}" title="Remover">✕</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
        <button class="add-row-btn" data-action="add-membro">+ Adicionar membro</button>
      </div>`;

    case "diagnostico": return `
      <div class="section-card">
        ${sectionHeader("03", "Diagnóstico", "Família inserida em acompanhamento familiar no PAIF para superação da(s) seguinte(s) vulnerabilidade(s):")}
        ${chkList("vulnerabilidades", VULNERABILIDADES_FAMILIA, paf.vulnerabilidades)}
        <div class="f" style="margin-top:12px"><label>Outros</label><input type="text" data-field="vulnerabilidadesOutros" value="${escapeHtml(paf.vulnerabilidadesOutros)}"></div>
      </div>`;

    case "grupo": return `
      <div class="section-card">
        ${sectionHeader("04", "Sobre o Grupo Familiar", "Vulnerabilidades e riscos sociais a serem superados, gerados pelas múltiplas expressões da questão social.")}
        ${paf.situacoesSociais.map((row, i) => `
          <div class="matrix-row">
            <div class="situ-label">${escapeHtml(row.situacao)}</div>
            <input type="text" placeholder="Membro(s) da família nesta situação" data-field="situacoesSociais.${i}.membros" value="${escapeHtml(row.membros)}">
            <label class="chk"><input type="checkbox" data-field-check="situacoesSociais.${i}.superada" ${row.superada ? "checked" : ""}><span>Superada</span></label>
          </div>`).join("")}
      </div>
      <div class="section-card">
        <h2><span class="num">04a</span>Serviços da Rede Socioassistencial</h2>
        <div class="field-grid">
          <div class="f c4"><label>Proteção Social Básica</label>${chkList("servBasica", SERVICOS_BASICA, paf.servBasica)}</div>
          <div class="f c4"><label>Média Complexidade</label>${chkList("servMedia", SERVICOS_MEDIA, paf.servMedia)}</div>
          <div class="f c4"><label>Alta Complexidade</label>${chkList("servAlta", SERVICOS_ALTA, paf.servAlta)}</div>
        </div>
      </div>`;

    case "programas": return `
      <div class="section-card">
        ${sectionHeader("05", "Programas, Projetos, Serviços e Benefícios Socioassistenciais", "")}
        <div class="field-grid">
          <div class="f c6">
            <label>a) Participa de programas, projetos sociais ou de geração de renda?</label>
            <div class="radio-row">
              <label><input type="radio" name="participaProgramas" data-field="participaProgramas" value="Sim" ${paf.participaProgramas === "Sim" ? "checked" : ""}> Sim</label>
              <label><input type="radio" name="participaProgramas" data-field="participaProgramas" value="Não" ${paf.participaProgramas === "Não" ? "checked" : ""}> Não</label>
            </div>
            ${chkList("programasQuais", PROGRAMAS_QUAIS, paf.programasQuais)}
            <div class="f" style="margin-top:6px"><label>Municipal — qual?</label><input type="text" data-field="programasMunicipalQual" value="${escapeHtml(paf.programasMunicipalQual)}"></div>
            <div class="f" style="margin-top:6px"><label>Projetos sociais — qual?</label><input type="text" data-field="programasProjetoQual" value="${escapeHtml(paf.programasProjetoQual)}"></div>
            <div class="f" style="margin-top:6px"><label>Outros</label><input type="text" data-field="programasOutros" value="${escapeHtml(paf.programasOutros)}"></div>
          </div>
          <div class="f c6">
            <label>b) Recebe algum outro benefício assistencial e/ou eventual?</label>
            <div class="radio-row">
              <label><input type="radio" name="recebeBeneficio" data-field="recebeBeneficio" value="Sim" ${paf.recebeBeneficio === "Sim" ? "checked" : ""}> Sim</label>
              <label><input type="radio" name="recebeBeneficio" data-field="recebeBeneficio" value="Não" ${paf.recebeBeneficio === "Não" ? "checked" : ""}> Não</label>
            </div>
            ${chkList("beneficioQuais", BENEFICIOS_QUAIS, paf.beneficioQuais)}
            <div class="f" style="margin-top:6px"><label>Outro</label><input type="text" data-field="beneficioOutro" value="${escapeHtml(paf.beneficioOutro)}"></div>
          </div>
        </div>
      </div>`;

    case "rede": return `
      <div class="section-card">
        ${sectionHeader("06", "Recursos que o Território Possui (Articulação da Rede)", "Rede de Apoio Institucional (recursos institucionais).")}
        ${chkList("redeApoio", REDE_APOIO, paf.redeApoio, true)}
        <div class="f" style="margin-top:12px"><label>Outros</label><input type="text" data-field="redeApoioOutros" value="${escapeHtml(paf.redeApoioOutros)}"></div>
      </div>`;

    case "metas": return `
      <div class="section-card">
        ${sectionHeader("07", "Metas, Evolução e Acompanhamento", "Equipe técnica.")}
        <div class="meta-row" style="font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;">
          <div>Meta</div><div>Prazo de execução</div><div>Resultados alcançados</div>
        </div>
        ${paf.metas.map((row, i) => `
          <div class="meta-row">
            <div class="meta-label">${escapeHtml(row.meta)}</div>
            <input type="text" placeholder="Prazo" data-field="metas.${i}.prazo" value="${escapeHtml(row.prazo)}">
            <input type="text" placeholder="Resultados" data-field="metas.${i}.resultados" value="${escapeHtml(row.resultados)}">
          </div>`).join("")}
      </div>`;

    case "estrategias": return `
      <div class="section-card">
        ${sectionHeader("08", "Estratégias a serem adotadas para superação das vulnerabilidades", "")}
        ${chkList("estrategias", ESTRATEGIAS, paf.estrategias, true)}
        <div class="f" style="margin-top:12px"><label>Outras</label><input type="text" data-field="estrategiasOutras" value="${escapeHtml(paf.estrategiasOutras)}"></div>
      </div>
      <div class="section-card">
        <h2><span class="num">08a</span>Eixos de intervenção</h2>
        ${chkList("eixos", EIXOS, paf.eixos, true)}
        <div class="f" style="margin-top:12px"><label>Outros</label><input type="text" data-field="eixosOutros" value="${escapeHtml(paf.eixosOutros)}"></div>
      </div>`;

    case "plano": return `
      <div class="section-card">
        ${sectionHeader("09", "Elaboração do Plano", "")}
        <div class="field-grid">
          <div class="f c6">
            <label>A família participou da construção do Plano de Acompanhamento?</label>
            <div class="radio-row">
              ${["Sim", "Não", "Parcialmente"].map(v => `<label><input type="radio" name="familiaParticipou" data-field="familiaParticipou" value="${v}" ${paf.familiaParticipou === v ? "checked" : ""}> ${v}</label>`).join("")}
            </div>
          </div>
          <div class="f c3"><label>Prazo de execução do Plano</label><input type="text" data-field="prazoExecucaoPlano" value="${escapeHtml(paf.prazoExecucaoPlano)}"></div>
          <div class="f c3"><label>Prazo de avaliação do Plano</label><input type="text" data-field="prazoAvaliacaoPlano" value="${escapeHtml(paf.prazoAvaliacaoPlano)}"></div>
          <div class="f c6"><label>Técnico de Referência</label><input type="text" data-field="tecnicoReferencia" value="${escapeHtml(paf.tecnicoReferencia)}"></div>
          <div class="f c3"><label>Data de elaboração</label><input type="date" data-field="dataElaboracao" value="${escapeHtml(paf.dataElaboracao)}"></div>
        </div>
      </div>`;

    case "encerramento": return `
      <div class="section-card">
        ${sectionHeader("10", "Encerramento do Acompanhamento Familiar", "")}
        <div class="radio-row" style="flex-direction:column;align-items:flex-start;gap:10px;">
          ${ENCERRAMENTO_MOTIVOS.map(m => `<label style="display:flex;gap:8px;align-items:center;"><input type="radio" name="encerramentoMotivo" data-field="encerramentoMotivo" value="${m.v}" ${paf.encerramentoMotivo === m.v ? "checked" : ""}> (${m.v}) ${m.label}</label>`).join("")}
        </div>
        <div class="field-grid" style="margin-top:14px">
          <div class="f c6"><label>Observações do motivo / outros</label><input type="text" data-field="encerramentoOutros" value="${escapeHtml(paf.encerramentoOutros)}"></div>
          <div class="f c3"><label>Técnico de Referência</label><input type="text" data-field="encerramentoTecnico" value="${escapeHtml(paf.encerramentoTecnico)}"></div>
          <div class="f c3"><label>Data</label><input type="date" data-field="encerramentoData" value="${escapeHtml(paf.encerramentoData)}"></div>
        </div>
      </div>`;

    case "observacoes": return `
      <div class="section-card">
        ${sectionHeader("11", "Observações", "")}
        <div class="f"><textarea data-field="observacoes" rows="8">${escapeHtml(paf.observacoes)}</textarea></div>
      </div>`;
  }
}

function attachEditorHandlers() {
  document.getElementById("backHomeBtn")?.addEventListener("click", goHome);
  document.getElementById("saveBtn")?.addEventListener("click", () => savePAF(state.current));
  document.getElementById("exportPdfBtn")?.addEventListener("click", () => exportPDF(state.current));
  document.getElementById("exportWordBtn")?.addEventListener("click", () => exportWord(state.current));

  document.querySelectorAll("[data-section]").forEach(el => {
    el.addEventListener("click", () => {
      state.activeSection = el.dataset.section;
      state.railOpen = false;
      renderApp();
    });
  });

  document.querySelectorAll("[data-set-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.current.situacaoPAF = btn.dataset.setStatus;
      scheduleAutosave();
      renderApp();
    });
  });

  document.querySelectorAll("[data-field]").forEach(input => {
    input.addEventListener("input", e => {
      setPath(state.current, e.target.dataset.field, e.target.value);
      scheduleAutosave();
    });
  });

  document.querySelectorAll("[data-field-check]").forEach(chk => {
    chk.addEventListener("change", e => {
      setPath(state.current, e.target.dataset.fieldCheck, e.target.checked);
      scheduleAutosave();
    });
  });

  document.querySelectorAll("[data-check-group]").forEach(chk => {
    chk.addEventListener("change", e => {
      const grp = e.target.dataset.checkGroup;
      const val = e.target.dataset.checkValue;
      if (!Array.isArray(state.current[grp])) state.current[grp] = [];
      toggleArrayValue(state.current[grp], val);
      scheduleAutosave();
    });
  });

  document.querySelectorAll("[data-action='add-membro']").forEach(btn => {
    btn.addEventListener("click", () => {
      state.current.membros.push({ nome: "", nascimento: "", parentesco: "" });
      scheduleAutosave();
      renderApp();
    });
  });

  document.querySelectorAll("[data-action='remove-membro']").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      state.current.membros.splice(idx, 1);
      scheduleAutosave();
      renderApp();
    });
  });
}

function attachGlobalHandlers() {
  document.getElementById("railToggleBtn")?.onclick = () => {
    state.railOpen = !state.railOpen;
    const rail = document.getElementById("tabRail");
    if (rail) rail.classList.toggle("open", state.railOpen);
  };
  
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".export-menu")) {
      document.querySelectorAll(".export-dropdown").forEach(d => d.style.display = "none");
    }
  });
}

/* ---------------------------- Exportação (PDF e Word) ---------------------------- */

function exportPDF(paf) {
  if (!paf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let y = 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Plano de Acompanhamento Familiar - PAF / PAIF", 10, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`CRAS: ${paf.crasNome || "—"}`, 10, y);
  doc.text(`Responsável: ${paf.responsavel || "—"}`, 100, y);
  
  y += 6;
  doc.text(`CPF: ${paf.cpf || "—"}`, 10, y);
  doc.text(`NIS: ${paf.nis || "—"}`, 100, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Membros da Família:", 10, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  (paf.membros || []).forEach(m => {
    if (m.nome) {
      doc.text(`• ${m.nome} (${m.parentesco || "Parentesco N/A"}) - Nasc: ${fmtDateBR(m.nascimento)}`, 14, y);
      y += 6;
    }
  });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Vulnerabilidades Marcadas:", 10, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  (paf.vulnerabilidades || []).forEach(v => {
    doc.text(`- ${v}`, 14, y);
    y += 5;
  });

  doc.save(`PAF_${(paf.responsavel || "Registro").replace(/\s+/g, "_")}.pdf`);
  toast("PDF gerado com sucesso.");
}

function exportWord(paf) {
  if (!paf) return;
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>PAF</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2>Plano de Acompanhamento Familiar - PAF / PAIF</h2>
      <p><b>CRAS:</b> ${escapeHtml(paf.crasNome)} | <b>Responsável:</b> ${escapeHtml(paf.responsavel)}</p>
      <p><b>CPF:</b> ${escapeHtml(paf.cpf)} | <b>NIS:</b> ${escapeHtml(paf.nis)}</p>
      <hr>
      <h3>Membros da Família</h3>
      <ul>
        ${(paf.membros || []).map(m => `<li>${escapeHtml(m.nome)} - ${escapeHtml(m.parentesco)} (${fmtDateBR(m.nascimento)})</li>`).join("")}
      </ul>
      <h3>Observações</h3>
      <p>${escapeHtml(paf.observacoes || "Nenhuma observação informada.")}</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PAF_${(paf.responsavel || "Registro").replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Arquivo Word (.doc) gerado com sucesso.");
}

/* ---------------------------- Inicialização ---------------------------- */

window.addEventListener("DOMContentLoaded", () => {
  initStorage();
});
