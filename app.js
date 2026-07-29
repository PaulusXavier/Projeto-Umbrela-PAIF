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

const TIPOS_ATENDIMENTO = ["Atendimento no CRAS", "Visita Domiciliar", "Contato Telefônico", "Encaminhamento", "Reunião de Rede", "Grupo/SCFV", "Outro"];

const TIPO_ATENDIMENTO_COR = {
  "Atendimento no CRAS": "#2E7D6B",
  "Visita Domiciliar": "#B98A34",
  "Contato Telefônico": "#3E6B8A",
  "Encaminhamento": "#B5473F",
  "Reunião de Rede": "#6B5B95",
  "Grupo/SCFV": "#1F5C4E",
  "Outro": "#8496A8"
};

const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

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
  railOpen: false,
  currentUser: null,         // usuário autenticado (Firebase Auth) ou null
  authError: ""
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
    atendimentos: [],
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
function dateBadgeParts(iso) {
  if (!iso) return { dia: "—", mes: "" };
  const [, m, d] = iso.split("-");
  if (!m || !d) return { dia: "—", mes: "" };
  return { dia: d, mes: MESES_ABREV[parseInt(m, 10) - 1] || "" };
}
function mesesEmAcompanhamento(iso) {
  if (!iso) return null;
  const inicio = new Date(iso + "T00:00:00");
  if (isNaN(inicio.getTime())) return null;
  const hoje = new Date();
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  if (hoje.getDate() < inicio.getDate()) meses--;
  return Math.max(0, meses);
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
  if (!root) return;
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
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
  return typeof firebase !== "undefined" && firebase.apps.length > 0;
}

function setSyncPill(kind, label) {
  const pill = document.getElementById("syncPill");
  if (!pill) return;
  pill.className = "sync-pill " + kind;
  const labelEl = document.getElementById("syncLabel");
  if (labelEl) labelEl.textContent = label;
}

/* ---------------------------- Autenticação (Firebase Auth) ---------------------------- */

function showAuthScreen() {
  const el = document.getElementById("authScreen");
  if (el) el.style.display = "flex";
}

function hideAuthScreen() {
  const el = document.getElementById("authScreen");
  if (el) el.style.display = "none";
}

function authError(msg) {
  const el = document.getElementById("authError");
  if (!el) return;
  if (!msg) { el.style.display = "none"; el.textContent = ""; return; }
  el.textContent = msg;
  el.style.display = "block";
}

function translateAuthError(code) {
  const map = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-disabled": "Este usuário foi desativado.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed": "Sem conexão com a internet."
  };
  return map[code] || "Não foi possível entrar. Verifique os dados e tente novamente.";
}

function attachAuthHandlers() {
  const form = () => ({
    email: document.getElementById("authEmail")?.value.trim() || "",
    password: document.getElementById("authPassword")?.value || ""
  });

  const submit = () => {
    const { email, password } = form();
    authError(null);
    if (!email || !password) { authError("Preencha e-mail e senha."); return; }
    const btn = document.getElementById("authSubmitBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Entrando…"; }
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(err => {
        console.error(err);
        authError(translateAuthError(err.code));
      })
      .finally(() => {
        if (btn) { btn.disabled = false; btn.textContent = "Entrar"; }
      });
  };

  document.getElementById("authSubmitBtn")?.addEventListener("click", submit);
  document.getElementById("authPassword")?.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  document.getElementById("authEmail")?.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });

  document.getElementById("forgotPasswordLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    const email = form().email;
    if (!email) { authError("Digite seu e-mail acima e clique em \"Esqueci minha senha\" novamente."); return; }
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => { authError(null); toast("E-mail de redefinição enviado para " + email + "."); })
      .catch(err => { console.error(err); authError(translateAuthError(err.code)); });
  });
}

function updateUserPill(user) {
  const pill = document.getElementById("userPill");
  const label = document.getElementById("userEmailLabel");
  const logoutBtn = document.getElementById("logoutBtn");
  if (user) {
    if (label) label.textContent = user.email;
    if (pill) pill.style.display = "flex";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
  } else {
    if (label) label.textContent = "";
    if (pill) pill.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

function handleLogout() {
  confirmModal("Sair da conta?", "Você precisará entrar novamente com seu e-mail e senha para acessar os registros.", () => {
    if (state.unsub) { state.unsub(); state.unsub = null; }
    firebase.auth().signOut();
  });
}

function initAuth() {
  attachAuthHandlers();

  if (!firebaseConfigured()) {
    // Sem Firebase configurado: não há login, o app roda 100% local.
    initStorage();
    return;
  }

  firebase.auth().onAuthStateChanged(user => {
    state.currentUser = user;
    updateUserPill(user);
    if (user) {
      hideAuthScreen();
      authError(null);
      const pwField = document.getElementById("authPassword");
      if (pwField) pwField.value = "";
      if (!state.unsub) initStorage();
    } else {
      if (state.unsub) { state.unsub(); state.unsub = null; }
      state.db = null;
      state.mode = "local";
      state.pafs = [];
      state.view = "home";
      showAuthScreen();
    }
  });
}

/* ---------------------------- Armazenamento (Firestore / local) ---------------------------- */

function initStorage() {
  if (firebaseConfigured()) {
    try {
      state.db = firebase.firestore();
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
  if (!main) return;
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
      if (!dd) return;
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
    metas: paf.metas.some(m => m.prazo || m.resultados) || (paf.atendimentos || []).length > 0,
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

    case "metas": {
      const ultimoAtendimento = (paf.atendimentos || [])
        .filter(a => a.data)
        .sort((a, b) => b.data.localeCompare(a.data))[0];
      const meses = mesesEmAcompanhamento(paf.dataInicial);
      return `
      <div class="section-card prontuario-header">
        <div class="prontuario-avatar">${escapeHtml((paf.responsavel || "?").trim().charAt(0).toUpperCase() || "?")}</div>
        <div class="prontuario-info">
          <h2 class="prontuario-nome">${escapeHtml(paf.responsavel) || "Responsável não informado"}</h2>
          <div class="prontuario-tags">
            <span class="stamp ${paf.situacaoPAF}" style="position:static;transform:none;display:inline-block;">${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</span>
          </div>
          <div class="prontuario-fields">
            <div><span class="k">CRAS</span><span class="v">${escapeHtml(paf.crasNome) || "—"}</span></div>
            <div><span class="k">CPF</span><span class="v">${escapeHtml(paf.cpf) || "—"}</span></div>
            <div><span class="k">Técnico de Referência</span><span class="v">${escapeHtml(paf.tecnicoReferencia) || "—"}</span></div>
            <div><span class="k">Início do Acompanhamento</span><span class="v">${fmtDateBR(paf.dataInicial) || "—"}</span></div>
            <div><span class="k">Periodicidade</span><span class="v">${escapeHtml(paf.periodicidade) || "—"}</span></div>
          </div>
        </div>
        <div class="prontuario-stats">
          <div class="stat-box"><span class="stat-num">${(paf.atendimentos || []).length}</span><span class="stat-label">Atendimentos</span></div>
          <div class="stat-box"><span class="stat-num">${meses === null ? "—" : meses}</span><span class="stat-label">Meses em acompanhamento</span></div>
          <div class="stat-box"><span class="stat-num" style="font-size:14px;">${ultimoAtendimento ? fmtDateBR(ultimoAtendimento.data) : "—"}</span><span class="stat-label">Último atendimento</span></div>
        </div>
      </div>

      <div class="section-card">
        ${sectionHeader("07", "Registro de Atendimentos", "Cada visita, contato ou encaminhamento realizado com a família, em ordem cronológica.")}
        <div class="timeline">
          ${(paf.atendimentos || []).length === 0 ? `<p class="hint" style="margin:6px 0 14px;">Nenhum atendimento registrado ainda. Clique em "Adicionar atendimento" para começar o histórico.</p>` : ""}
          ${(paf.atendimentos || []).map((a, i) => {
            const cor = TIPO_ATENDIMENTO_COR[a.tipo] || TIPO_ATENDIMENTO_COR["Outro"];
            const badge = dateBadgeParts(a.data);
            return `
            <div class="timeline-item" style="--tipo-cor:${cor}">
              <div class="timeline-date-badge">
                <span class="dia">${escapeHtml(badge.dia)}</span>
                <span class="mes">${escapeHtml(badge.mes)}</span>
              </div>
              <div class="timeline-card">
                <button class="row-del" data-action="remove-atendimento" data-idx="${i}" title="Remover este atendimento">✕</button>
                <div class="timeline-row">
                  <div class="f"><label>Data</label><input type="date" data-field="atendimentos.${i}.data" value="${escapeHtml(a.data)}"></div>
                  <div class="f"><label>Tipo de Atendimento</label>
                    <select data-field="atendimentos.${i}.tipo" class="tipo-select" style="border-color:${cor};color:${cor};background:${cor}14;">
                      <option value="">Selecione…</option>
                      ${TIPOS_ATENDIMENTO.map(t => `<option value="${escapeHtml(t)}" ${a.tipo === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="f"><label>Técnico Responsável</label><input type="text" data-field="atendimentos.${i}.tecnico" value="${escapeHtml(a.tecnico)}" placeholder="${escapeHtml(paf.tecnicoReferencia) || 'Nome do técnico'}"></div>
                </div>
                <div class="f" style="margin-top:10px"><label>Evolução / Observações do Atendimento</label><textarea data-field="atendimentos.${i}.evolucao" rows="3" placeholder="O que foi discutido, observado ou trabalhado neste atendimento...">${escapeHtml(a.evolucao)}</textarea></div>
                <div class="f" style="margin-top:10px"><label>Encaminhamentos Realizados</label><input type="text" data-field="atendimentos.${i}.encaminhamentos" value="${escapeHtml(a.encaminhamentos)}" placeholder="Ex.: encaminhado ao CREAS, agendada nova visita..."></div>
              </div>
            </div>`;
          }).join("")}
        </div>
        <button class="add-row-btn" data-action="add-atendimento">+ Adicionar atendimento</button>
      </div>

      <div class="section-card">
        <h2><span class="num">07a</span>Metas, Evolução e Resultados</h2>
        <p class="section-sub">Equipe técnica.</p>
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
    }

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
        <div class="field-grid" style="margin-top:14px;">
          <div class="f c12"><label>Outros motivos / Observações do encerramento</label><input type="text" data-field="encerramentoOutros" value="${escapeHtml(paf.encerramentoOutros)}"></div>
          <div class="f c6"><label>Técnico Responsável</label><input type="text" data-field="encerramentoTecnico" value="${escapeHtml(paf.encerramentoTecnico)}"></div>
          <div class="f c6"><label>Data de Encerramento</label><input type="date" data-field="encerramentoData" value="${escapeHtml(paf.encerramentoData)}"></div>
        </div>
      </div>`;

    case "observacoes": return `
      <div class="section-card">
        ${sectionHeader("11", "Observações Gerais", "Anotações complementares técnicas sobre o acompanhamento da família.")}
        <div class="f">
          <textarea data-field="observacoes" rows="8" placeholder="Digite aqui observações adicionais...">${escapeHtml(paf.observacoes)}</textarea>
        </div>
      </div>`;

    default: return "";
  }
}

/* ---------------------------- Eventos do Editor ---------------------------- */

function attachEditorHandlers() {
  document.getElementById("backHomeBtn")?.addEventListener("click", goHome);
  document.getElementById("saveBtn")?.addEventListener("click", () => {
    savePAF(state.current);
    renderApp();
  });

  document.getElementById("exportPdfBtn")?.addEventListener("click", () => exportPDF(state.current));
  document.getElementById("exportWordBtn")?.addEventListener("click", () => exportWord(state.current));

  // Troca de Seções (Tabs)
  document.querySelectorAll("[data-section]").forEach(el => {
    el.addEventListener("click", () => {
      state.activeSection = el.dataset.section;
      state.railOpen = false;
      renderApp();
    });
  });

  // Troca rápida de status da capa
  document.querySelectorAll("[data-set-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.current.situacaoPAF = btn.dataset.setStatus;
      scheduleAutosave();
      renderApp();
    });
  });

  // Binding de Inputs Gerais (text, date, select, textarea, radio)
  const container = document.getElementById("formScroll");
  if (!container) return;

  container.querySelectorAll("[data-field]").forEach(input => {
    const path = input.dataset.field;
    const evt = input.type === "radio" || input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input";
    
    input.addEventListener(evt, () => {
      if (input.type === "radio") {
        if (input.checked) setPath(state.current, path, input.value);
      } else {
        setPath(state.current, path, input.value);
      }
      scheduleAutosave();
    });
  });

  // Binding para Checkboxes de Matrizes Dinâmicas
  container.querySelectorAll("[data-field-check]").forEach(chk => {
    chk.addEventListener("change", () => {
      setPath(state.current, chk.dataset.fieldCheck, chk.checked);
      scheduleAutosave();
    });
  });

  // Binding para Listas de Checkbox (arrays)
  container.querySelectorAll("[data-check-group]").forEach(chk => {
    chk.addEventListener("change", () => {
      const groupName = chk.dataset.checkGroup;
      const val = chk.dataset.checkValue;
      let arr = getPath(state.current, groupName) || [];
      toggleArrayValue(arr, val);
      setPath(state.current, groupName, arr);
      scheduleAutosave();
    });
  });

  // Ações de Tabela Dinâmica (Membros da Família)
  container.querySelectorAll("[data-action='add-membro']").forEach(btn => {
    btn.addEventListener("click", () => {
      state.current.membros.push({ nome: "", nascimento: "", parentesco: "" });
      savePAF(state.current, { silent: true });
      renderApp();
    });
  });

  container.querySelectorAll("[data-action='remove-membro']").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      state.current.membros.splice(idx, 1);
      savePAF(state.current, { silent: true });
      renderApp();
    });
  });

  // Ações da Linha do Tempo de Atendimentos (Registro de Acompanhamento)
  container.querySelectorAll("[data-action='add-atendimento']").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.current.atendimentos) state.current.atendimentos = [];
      state.current.atendimentos.unshift({ data: todayISO(), tipo: "", tecnico: state.current.tecnicoReferencia || "", evolucao: "", encaminhamentos: "" });
      savePAF(state.current, { silent: true });
      renderApp();
    });
  });

  container.querySelectorAll("[data-action='remove-atendimento']").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      confirmModal("Remover este atendimento?", "Este registro do histórico de acompanhamento será apagado.", () => {
        state.current.atendimentos.splice(idx, 1);
        savePAF(state.current, { silent: true });
        renderApp();
      });
    });
  });
}

/* ---------------------------- Global Handlers ---------------------------- */

function attachGlobalHandlers() {
  document.getElementById("btnGoHome")?.addEventListener("click", goHome);
  document.getElementById("btnNewPafHeader")?.addEventListener("click", newPAF);
  
  const railToggle = document.getElementById("railToggleBtn");
  if (railToggle) {
    railToggle.onclick = () => {
      state.railOpen = !state.railOpen;
      const rail = document.getElementById("tabRail");
      if (rail) rail.classList.toggle("open", state.railOpen);
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = handleLogout;

  // Fechar dropdowns de exportação ao clicar fora
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".export-menu")) {
      document.querySelectorAll(".export-dropdown").forEach(d => d.style.display = "none");
    }
  });
}

/* ---------------------------- Exportação: PDF (Impressão Nativa) ---------------------------- */

function exportPDF(paf) {
  if (!paf) return;
  const printWin = window.open("", "_blank");
  if (!printWin) {
    toast("Bloqueador de pop-ups ativo. Permita pop-ups para exportar.");
    return;
  }

  const membrosHTML = (paf.membros || []).map(m => `
    <tr>
      <td>${escapeHtml(m.nome)}</td>
      <td>${fmtDateBR(m.nascimento)}</td>
      <td>${escapeHtml(m.parentesco)}</td>
    </tr>
  `).join("") || "<tr><td colspan='3'>Nenhum membro informado</td></tr>";

  const situacoesHTML = (paf.situacoesSociais || [])
    .filter(s => s.membros || s.superada)
    .map(s => `<tr><td>${escapeHtml(s.situacao)}</td><td>${escapeHtml(s.membros)}</td><td>${s.superada ? "Sim" : "Não"}</td></tr>`)
    .join("") || "<tr><td colspan='3'>Nenhuma situação registrada</td></tr>";

  const metasHTML = (paf.metas || [])
    .filter(m => m.prazo || m.resultados)
    .map(m => `<tr><td>${escapeHtml(m.meta)}</td><td>${escapeHtml(m.prazo)}</td><td>${escapeHtml(m.resultados)}</td></tr>`)
    .join("") || "<tr><td colspan='3'>Nenhuma meta informada</td></tr>";

  const atendimentosOrdenados = [...(paf.atendimentos || [])].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const meses = mesesEmAcompanhamento(paf.dataInicial);
  const ultimoAtendimento = atendimentosOrdenados.find(a => a.data);

  const atendimentosHTML = atendimentosOrdenados.length
    ? atendimentosOrdenados.map(a => {
        const cor = TIPO_ATENDIMENTO_COR[a.tipo] || TIPO_ATENDIMENTO_COR["Outro"];
        const badge = dateBadgeParts(a.data);
        return `
        <div class="reg-item" style="border-left-color:${cor}">
          <div class="reg-badge" style="border-color:${cor};color:${cor}">
            <span class="dia">${escapeHtml(badge.dia)}</span>
            <span class="mes">${escapeHtml(badge.mes)}</span>
          </div>
          <div class="reg-body">
            <div class="reg-top">
              <span class="reg-tipo" style="background:${cor}1a;color:${cor}">${escapeHtml(a.tipo) || "Atendimento"}</span>
              <span class="reg-tecnico">${escapeHtml(a.tecnico) || escapeHtml(paf.tecnicoReferencia) || "Técnico não informado"}</span>
            </div>
            ${a.evolucao ? `<p class="reg-evolucao">${escapeHtml(a.evolucao)}</p>` : `<p class="reg-evolucao muted">Sem observações registradas.</p>`}
            ${a.encaminhamentos ? `<p class="reg-encam"><strong>↳ Encaminhamentos:</strong> ${escapeHtml(a.encaminhamentos)}</p>` : ""}
          </div>
        </div>`;
      }).join("")
    : `<p class="muted">Nenhum atendimento registrado.</p>`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Prontuário PAF - ${escapeHtml(paf.responsavel)}</title>
      <style>
        @page { margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1F3A5F;
          line-height: 1.45; margin: 0; padding: 0;
        }
        .brasao { font-family: Georgia, 'Times New Roman', serif; }

        .capa-header {
          display: flex; align-items: center; gap: 14px; border-bottom: 2.5px solid #1F3A5F; padding-bottom: 10px; margin-bottom: 14px;
        }
        .capa-selo {
          width: 40px; height: 40px; border-radius: 50%; border: 1.6px solid #B98A34; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 18px; color: #B98A34;
        }
        .capa-titulos h1 { font-family: Georgia, serif; font-size: 16px; margin: 0; color: #1F3A5F; }
        .capa-titulos p { margin: 2px 0 0; font-size: 10.5px; color: #52667C; }
        .capa-meta { margin-left: auto; text-align: right; font-size: 9.5px; color: #8496A8; }

        .id-band {
          background: #F6F8F9; border: 1px solid #D7E0E6; border-radius: 6px; padding: 12px 14px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .id-nome-wrap { flex: 1 1 200px; }
        .id-nome { font-family: Georgia, serif; font-size: 15px; font-weight: bold; margin: 0 0 4px; }
        .id-status {
          display: inline-block; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; font-weight: bold;
          padding: 2px 8px; border-radius: 999px; border: 1.2px solid #2E7D6B; color: #2E7D6B;
        }
        .id-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 20px; flex: 2 1 380px; font-size: 10.5px; }
        .id-grid .k { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: .04em; color: #8496A8; }
        .id-grid .v { display: block; font-weight: 600; }
        .id-stats { display: flex; gap: 8px; flex: 0 0 auto; }
        .id-stat { text-align: center; background: #fff; border: 1px solid #D7E0E6; border-radius: 6px; padding: 6px 10px; min-width: 58px; }
        .id-stat .n { display: block; font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #B98A34; line-height: 1; }
        .id-stat .l { display: block; font-size: 7.5px; text-transform: uppercase; color: #8496A8; margin-top: 2px; }

        h2 { font-size: 12.5px; color: #2E7D6B; margin: 18px 0 6px; border-bottom: 1px solid #D7E0E6; padding-bottom: 3px; page-break-after: avoid; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; margin-bottom: 6px; }
        .field { margin-bottom: 4px; }
        .label { font-weight: bold; font-size: 9px; text-transform: uppercase; color: #52667C; display: block; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
        th, td { border: 1px solid #D7E0E6; padding: 5px 6px; text-align: left; vertical-align: top; }
        th { background: #F6F8F9; font-weight: bold; font-size: 9.5px; text-transform: uppercase; }
        .tag { display: inline-block; background: #DEEAE6; color: #1F5C4E; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; margin: 2px 4px 2px 0; }
        .muted { color: #8496A8; font-style: italic; }

        .reg-item {
          display: flex; gap: 10px; border: 1px solid #D7E0E6; border-left-width: 3px; border-radius: 6px;
          padding: 8px 10px; margin-bottom: 8px; page-break-inside: avoid;
        }
        .reg-badge {
          flex-shrink: 0; width: 42px; height: 42px; border-radius: 6px; border: 1.4px solid;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .reg-badge .dia { font-family: Georgia, serif; font-size: 14px; font-weight: bold; line-height: 1; }
        .reg-badge .mes { font-size: 7px; text-transform: uppercase; letter-spacing: .04em; margin-top: 1px; }
        .reg-body { flex: 1; min-width: 0; }
        .reg-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
        .reg-tipo { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: .03em; padding: 2px 7px; border-radius: 999px; }
        .reg-tecnico { font-size: 9.5px; color: #52667C; }
        .reg-evolucao { margin: 0 0 4px; font-size: 10.5px; }
        .reg-encam { margin: 0; font-size: 10px; color: #52667C; }

        .assinaturas { display: flex; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
        .assinatura { flex: 1; text-align: center; }
        .assinatura .linha { border-top: 1px solid #1F3A5F; margin-bottom: 4px; padding-top: 4px; }
        .assinatura .titulo { font-size: 9.5px; color: #52667C; }

        .rodape-print {
          margin-top: 24px; padding-top: 8px; border-top: 1px solid #D7E0E6;
          font-size: 8.5px; color: #8496A8; text-align: center;
        }

        @media print {
          .capa-header, h2 { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="capa-header">
        <div class="capa-selo">P</div>
        <div class="capa-titulos">
          <h1>Plano de Acompanhamento Familiar — Prontuário</h1>
          <p>Serviço de Proteção e Atendimento Integral à Família (PAIF) ${paf.crasNome ? "· " + escapeHtml(paf.crasNome) : ""}</p>
        </div>
        <div class="capa-meta">
          Ficha nº ${escapeHtml((paf.id || "").split("_")[1] || "—")}<br>
          Emitido em ${fmtDateBR(todayISO())}
        </div>
      </div>

      <div class="id-band">
        <div class="id-nome-wrap">
          <p class="id-nome">${escapeHtml(paf.responsavel) || "Responsável não informado"}</p>
          <span class="id-status">${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</span>
        </div>
        <div class="id-grid">
          <div><span class="k">CPF</span><span class="v">${escapeHtml(paf.cpf) || "—"}</span></div>
          <div><span class="k">NIS</span><span class="v">${escapeHtml(paf.nis) || "—"}</span></div>
          <div><span class="k">Técnico de Referência</span><span class="v">${escapeHtml(paf.tecnicoReferencia) || "—"}</span></div>
          <div><span class="k">Endereço</span><span class="v">${escapeHtml(paf.endereco) || "—"}</span></div>
          <div><span class="k">Início do Acompanhamento</span><span class="v">${fmtDateBR(paf.dataInicial) || "—"}</span></div>
          <div><span class="k">Periodicidade</span><span class="v">${escapeHtml(paf.periodicidade) || "—"}</span></div>
        </div>
        <div class="id-stats">
          <div class="id-stat"><span class="n">${(paf.atendimentos || []).length}</span><span class="l">Atendimentos</span></div>
          <div class="id-stat"><span class="n">${meses === null ? "—" : meses}</span><span class="l">Meses</span></div>
          <div class="id-stat"><span class="n" style="font-size:11px;">${ultimoAtendimento ? fmtDateBR(ultimoAtendimento.data) : "—"}</span><span class="l">Último atend.</span></div>
        </div>
      </div>

      <h2>Membros da Família</h2>
      <table>
        <thead><tr><th>Nome</th><th>Data Nasc.</th><th>Parentesco</th></tr></thead>
        <tbody>${membrosHTML}</tbody>
      </table>

      <h2>Diagnóstico e Vulnerabilidades</h2>
      <div>${(paf.vulnerabilidades || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhuma selecionada</span>"}</div>
      ${paf.vulnerabilidadesOutros ? `<p style="margin:6px 0 0;"><strong>Outras:</strong> ${escapeHtml(paf.vulnerabilidadesOutros)}</p>` : ""}

      <h2>Situações Sociais Registradas</h2>
      <table>
        <thead><tr><th>Situação Social</th><th>Membros</th><th>Superada</th></tr></thead>
        <tbody>${situacoesHTML}</tbody>
      </table>

      <h2>Registro de Atendimentos</h2>
      ${atendimentosHTML}

      <h2>Metas e Evolução</h2>
      <table>
        <thead><tr><th>Meta</th><th>Prazo</th><th>Resultados</th></tr></thead>
        <tbody>${metasHTML}</tbody>
      </table>

      <h2>Elaboração e Encerramento</h2>
      <div class="grid">
        <div class="field"><span class="label">Técnico de Referência</span>${escapeHtml(paf.tecnicoReferencia) || "—"}</div>
        <div class="field"><span class="label">Data de Elaboração</span>${fmtDateBR(paf.dataElaboracao) || "—"}</div>
        <div class="field"><span class="label">Motivo de Encerramento</span>${escapeHtml(ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo)?.label) || "—"}</div>
        <div class="field"><span class="label">Data de Encerramento</span>${fmtDateBR(paf.encerramentoData) || "—"}</div>
      </div>

      ${paf.observacoes ? `<h2>Observações Gerais</h2><p>${escapeHtml(paf.observacoes)}</p>` : ""}

      <div class="assinaturas">
        <div class="assinatura">
          <div class="linha">${escapeHtml(paf.tecnicoReferencia) || "Técnico de Referência"}</div>
          <div class="titulo">Assinatura do Técnico de Referência</div>
        </div>
        <div class="assinatura">
          <div class="linha">${escapeHtml(paf.responsavel) || "Responsável Familiar"}</div>
          <div class="titulo">Assinatura do Responsável Familiar</div>
        </div>
      </div>

      <div class="rodape-print">
        Plano de Acompanhamento Familiar (PAF) · Serviço de Proteção e Atendimento Integral à Família (PAIF) — Paulo Xavier, CRP-20/09816, Psicólogo — Boa Vista, RR
      </div>

      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/* ---------------------------- Exportação: Word (.doc) ---------------------------- */

function exportWord(paf) {
  if (!paf) return;

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>PAF - ${escapeHtml(paf.responsavel)}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.3; }
      h1 { font-size: 16pt; color: #1F3A5F; }
      h2 { font-size: 13pt; color: #2E7D6B; margin-top: 15pt; }
      table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
      td, th { border: 1px solid #CCCCCC; padding: 5pt; font-size: 10pt; }
      th { background-color: #F0F4F8; }
    </style>
    </head>
    <body>
      <h1>Plano de Acompanhamento Familiar - PAF</h1>
      <p><b>CRAS:</b> ${escapeHtml(paf.crasNome)} | <b>Status:</b> ${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</p>
      <hr/>
      <h2>01. Identificação</h2>
      <p><b>Responsável:</b> ${escapeHtml(paf.responsavel)}<br>
      <b>CPF:</b> ${escapeHtml(paf.cpf)} | <b>NIS:</b> ${escapeHtml(paf.nis)}<br>
      <b>Endereço:</b> ${escapeHtml(paf.endereco)}<br>
      <b>Data de Início:</b> ${fmtDateBR(paf.dataInicial)}</p>

      <h2>02. Composição Familiar</h2>
      <table>
        <tr><th>Nome</th><th>Data Nasc.</th><th>Parentesco</th></tr>
        ${(paf.membros || []).map(m => `<tr><td>${escapeHtml(m.nome)}</td><td>${fmtDateBR(m.nascimento)}</td><td>${escapeHtml(m.parentesco)}</td></tr>`).join("")}
      </table>

      <h2>03. Diagnóstico e Vulnerabilidades</h2>
      <p>${(paf.vulnerabilidades || []).join(", ") || "Nenhuma registrada"}</p>

      <h2>04. Registro de Atendimentos</h2>
      <table>
        <tr><th>Data</th><th>Tipo</th><th>Técnico</th><th>Evolução</th><th>Encaminhamentos</th></tr>
        ${(paf.atendimentos || []).map(a => `<tr><td>${fmtDateBR(a.data)}</td><td>${escapeHtml(a.tipo)}</td><td>${escapeHtml(a.tecnico)}</td><td>${escapeHtml(a.evolucao)}</td><td>${escapeHtml(a.encaminhamentos)}</td></tr>`).join("") || "<tr><td colspan='5'>Nenhum atendimento registrado</td></tr>"}
      </table>

      <h2>05. Metas e Resultados</h2>
      <table>
        <tr><th>Meta</th><th>Prazo</th><th>Resultados</th></tr>
        ${(paf.metas || []).map(m => `<tr><td>${escapeHtml(m.meta)}</td><td>${escapeHtml(m.prazo)}</td><td>${escapeHtml(m.resultados)}</td></tr>`).join("")}
      </table>

      <h2>06. Encerramento e Validação</h2>
      <p><b>Técnico de Referência:</b> ${escapeHtml(paf.tecnicoReferencia)}<br>
      <b>Data de Elaboração:</b> ${fmtDateBR(paf.dataElaboracao)}<br>
      <b>Observações:</b> ${escapeHtml(paf.observacoes)}</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PAF_${(paf.responsavel || "registro").replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Documento Word gerado.");
}

/* ---------------------------- Inicialização do App ---------------------------- */

window.addEventListener("DOMContentLoaded", () => {
  initAuth();
});
