/* =========================================================================
   Plano de Acompanhamento Familiar - PAF / PAIF
   Lógica do aplicativo: dados, telas, sincronização e exportação.
   ========================================================================= */

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

/* ---------------------------- Toast ---------------------------- */

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------------------------- Firebase / armazenamento ---------------------------- */

function firebaseConfigured() {
  return typeof FIREBASE_CONFIG !== "undefined" &&
    FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "COLE_AQUI" &&
    FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId !== "COLE_AQUI";
}

function setSyncPill(kind, label) {
  const pill = document.getElementById("syncPill");
  pill.className = "sync-pill " + kind;
  document.getElementById("syncLabel").textContent = label;
}

function initStorage() {
  if (firebaseConfigured()) {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
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
  // garante compatibilidade caso o registro seja antigo e falte algum campo novo
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

/* ---------------------------- Render: shell ---------------------------- */

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
        <p class="hint">O status geral do PAF (Em andamento / Encaminhado / Concluído / Cancelado) fica nos botões no topo desta tela.</p>
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
        <p class="hint">O responsável familiar assina a via impressa (PDF/Word) gerada a partir deste registro.</p>
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

    default: return "";
  }
}

function attachEditorHandlers() {
  document.getElementById("backHomeBtn").addEventListener("click", () => { savePAF(state.current); goHome(); });
  document.getElementById("saveBtn").addEventListener("click", () => savePAF(state.current));
  document.getElementById("exportPdfBtn").addEventListener("click", () => exportPDF(state.current));
  document.getElementById("exportWordBtn").addEventListener("click", () => exportWord(state.current));
  document.getElementById("railToggleBtn").addEventListener("click", () => { state.railOpen = !state.railOpen; document.getElementById("tabRail").classList.toggle("open", state.railOpen); });

  document.querySelectorAll("[data-section]").forEach(el => {
    el.addEventListener("click", () => { state.activeSection = el.dataset.section; state.railOpen = false; renderApp(); });
  });
  document.querySelectorAll("[data-set-status]").forEach(el => {
    el.addEventListener("click", () => { state.current.situacaoPAF = el.dataset.setStatus; savePAF(state.current); renderApp(); });
  });

  const scroll = document.getElementById("formScroll");

  scroll.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.field) {
      setPath(state.current, t.dataset.field, t.value);
      scheduleAutosave();
    }
  });

  scroll.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.checkGroup) {
      toggleArrayValue(state.current[t.dataset.checkGroup], t.dataset.checkValue);
      scheduleAutosave();
    } else if (t.dataset.fieldCheck) {
      setPath(state.current, t.dataset.fieldCheck, t.checked);
      scheduleAutosave();
    } else if (t.dataset.field && (t.type === "radio")) {
      setPath(state.current, t.dataset.field, t.value);
      scheduleAutosave();
    }
  });

  scroll.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "add-membro") {
      state.current.membros.push({ nome: "", nascimento: "", parentesco: "" });
      savePAF(state.current, { silent: true });
      renderApp();
    } else if (btn.dataset.action === "remove-membro") {
      state.current.membros.splice(Number(btn.dataset.idx), 1);
      if (state.current.membros.length === 0) state.current.membros.push({ nome: "", nascimento: "", parentesco: "" });
      savePAF(state.current, { silent: true });
      renderApp();
    }
  });
}

/* ---------------------------- Modais ---------------------------- */

function confirmModal(title, body, onConfirm) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop" id="confirmBackdrop">
      <div class="modal">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="confirmCancel">Cancelar</button>
          <button class="btn btn-danger" id="confirmOk">Confirmar</button>
        </div>
      </div>
    </div>`;
  document.getElementById("confirmCancel").addEventListener("click", () => root.innerHTML = "");
  document.getElementById("confirmBackdrop").addEventListener("click", e => { if (e.target.id === "confirmBackdrop") root.innerHTML = ""; });
  document.getElementById("confirmOk").addEventListener("click", () => { root.innerHTML = ""; onConfirm(); });
}

function settingsModal() {
  const root = document.getElementById("modalRoot");
  const cloud = state.mode === "cloud";
  root.innerHTML = `
    <div class="modal-backdrop" id="settingsBackdrop">
      <div class="modal">
        <h3>Sincronização</h3>
        <p>
          ${cloud
            ? "Este aplicativo está conectado a um banco de dados na nuvem (Firebase). Todos os dispositivos que abrirem este mesmo link compartilham os mesmos Planos de Acompanhamento Familiar automaticamente."
            : "Este aplicativo ainda está salvando os registros apenas neste dispositivo. Para compartilhar entre vários aparelhos, configure o Firebase no arquivo <code>firebase-config.js</code> — o passo a passo está no README.md do projeto."}
        </p>
        <p>Total de registros: <strong>${state.pafs.length}</strong></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="backupExportBtn">Exportar backup (JSON)</button>
          <button class="btn btn-primary" id="settingsCloseBtn">Fechar</button>
        </div>
      </div>
    </div>`;
  document.getElementById("settingsCloseBtn").addEventListener("click", () => root.innerHTML = "");
  document.getElementById("settingsBackdrop").addEventListener("click", e => { if (e.target.id === "settingsBackdrop") root.innerHTML = ""; });
  document.getElementById("backupExportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.pafs, null, 2)], { type: "application/json" });
    triggerDownload(blob, `backup-paf-paif-${todayISO()}.json`);
  });
}

/* ---------------------------- Handlers globais ---------------------------- */

function attachGlobalHandlers() {
  // handlers estáticos do topbar já são ligados uma única vez no boot
}
document.addEventListener("click", e => {
  if (!e.target.closest(".export-menu")) {
    document.querySelectorAll(".export-dropdown").forEach(d => d.style.display = "none");
  }
});

document.getElementById("settingsBtn").addEventListener("click", settingsModal);

/* ---------------------------- Exportação: download helper ---------------------------- */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function safeFileName(paf) {
  const base = (paf.responsavel || "sem-nome").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `PAF-${base || "registro"}-${paf.dataInicial || todayISO()}`;
}

/* ---------------------------- Exportação: PDF ---------------------------- */

function exportPDF(paf) {
  if (!paf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 44;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 50;

  function ensureSpace(h) {
    if (y + h > pageH - 40) { doc.addPage(); y = 50; }
  }
  function h1(text) {
    ensureSpace(30);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(31, 58, 95);
    doc.text(text, marginX, y); y += 10;
    doc.setDrawColor(46, 125, 107); doc.setLineWidth(1.2);
    doc.line(marginX, y, pageW - marginX, y); y += 18;
  }
  function h2(text) {
    ensureSpace(22);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(31, 58, 95);
    doc.text(text, marginX, y); y += 16;
  }
  function field(label, value) {
    const val = value && String(value).trim() ? String(value) : "—";
    const lines = doc.splitTextToSize(val, pageW - marginX * 2 - 140);
    ensureSpace(14 * Math.max(lines.length, 1) + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(82, 102, 124);
    doc.text(label.toUpperCase(), marginX, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(31, 58, 95);
    doc.text(lines, marginX + 155, y);
    y += 14 * Math.max(lines.length, 1) + 6;
  }
  function bullet(text, checked) {
    ensureSpace(13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.7); doc.setTextColor(31, 58, 95);
    const mark = checked ? "[x] " : "[ ] ";
    const lines = doc.splitTextToSize(mark + text, pageW - marginX * 2 - 10);
    doc.text(lines, marginX + 6, y);
    y += 12.5 * lines.length + 1;
  }
  function spacer(n) { y += (n || 10); }

  h1("Plano de Acompanhamento Familiar — PAF / PAIF");
  field("Nome do CRAS", paf.crasNome);
  field("Responsável Familiar", paf.responsavel);
  field("CPF", paf.cpf);
  field("NIS", paf.nis);
  field("Endereço", paf.endereco);
  field("Data inicial do PAF", fmtDateBR(paf.dataInicial));
  field("Periodicidade", paf.periodicidade);
  field("Situação do PAF", STATUS_LABELS[paf.situacaoPAF] + (paf.situacaoData ? " em " + fmtDateBR(paf.situacaoData) : ""));
  spacer(6);

  h2("Membros da Família em Acompanhamento");
  (paf.membros || []).filter(m => m.nome).forEach(m => bullet(`${m.nome} — nasc. ${fmtDateBR(m.nascimento) || "—"} — ${m.parentesco || "—"}`, true));
  spacer(6);

  h2("Diagnóstico — Vulnerabilidades da Família");
  VULNERABILIDADES_FAMILIA.forEach(v => bullet(v, paf.vulnerabilidades.includes(v)));
  if (paf.vulnerabilidadesOutros) field("Outros", paf.vulnerabilidadesOutros);
  spacer(6);

  h2("Situações e Riscos Sociais");
  paf.situacoesSociais.filter(r => r.membros || r.superada).forEach(r => {
    bullet(`${r.situacao} — ${r.membros || "—"}${r.superada ? " (superada)" : ""}`, true);
  });
  spacer(6);

  h2("Serviços da Rede Socioassistencial");
  if (paf.servBasica.length) field("Proteção Social Básica", paf.servBasica.join(", "));
  if (paf.servMedia.length) field("Média Complexidade", paf.servMedia.join(", "));
  if (paf.servAlta.length) field("Alta Complexidade", paf.servAlta.join(", "));
  spacer(6);

  h2("Programas, Projetos e Benefícios");
  field("Participa de programas/projetos sociais", paf.participaProgramas);
  if (paf.programasQuais.length) field("Quais programas", paf.programasQuais.join(", "));
  if (paf.programasMunicipalQual) field("Municipal", paf.programasMunicipalQual);
  if (paf.programasProjetoQual) field("Projeto social", paf.programasProjetoQual);
  if (paf.programasOutros) field("Outros programas", paf.programasOutros);
  field("Recebe outro benefício assistencial/eventual", paf.recebeBeneficio);
  if (paf.beneficioQuais.length) field("Quais benefícios", paf.beneficioQuais.join(", "));
  if (paf.beneficioOutro) field("Outro benefício", paf.beneficioOutro);
  spacer(6);

  h2("Rede de Apoio Institucional do Território");
  if (paf.redeApoio.length) field("Recursos", paf.redeApoio.join(", "));
  if (paf.redeApoioOutros) field("Outros recursos", paf.redeApoioOutros);
  spacer(6);

  h2("Metas, Evolução e Acompanhamento");
  paf.metas.filter(m => m.prazo || m.resultados).forEach(m => {
    field(m.meta, `Prazo: ${m.prazo || "—"} · Resultados: ${m.resultados || "—"}`);
  });
  spacer(6);

  h2("Estratégias e Eixos de Intervenção");
  if (paf.estrategias.length) field("Estratégias", paf.estrategias.join(", "));
  if (paf.estrategiasOutras) field("Outras estratégias", paf.estrategiasOutras);
  if (paf.eixos.length) field("Eixos de intervenção", paf.eixos.join(", "));
  if (paf.eixosOutros) field("Outros eixos", paf.eixosOutros);
  spacer(6);

  h2("Elaboração do Plano");
  field("Família participou da construção do Plano", paf.familiaParticipou);
  field("Prazo de execução do Plano", paf.prazoExecucaoPlano);
  field("Prazo de avaliação do Plano", paf.prazoAvaliacaoPlano);
  field("Técnico de Referência", paf.tecnicoReferencia);
  field("Data de elaboração", fmtDateBR(paf.dataElaboracao));

  if (paf.encerramentoMotivo || paf.encerramentoTecnico) {
    spacer(6);
    h2("Encerramento do Acompanhamento Familiar");
    const motivo = ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo);
    field("Motivo", motivo ? `(${motivo.v}) ${motivo.label}` : "—");
    if (paf.encerramentoOutros) field("Observações do motivo", paf.encerramentoOutros);
    field("Técnico de Referência", paf.encerramentoTecnico);
    field("Data", fmtDateBR(paf.encerramentoData));
  }

  if (paf.observacoes) {
    spacer(6);
    h2("Observações");
    field("", paf.observacoes);
  }

  spacer(20);
  ensureSpace(60);
  doc.setDrawColor(215, 224, 230); doc.line(marginX, y, pageW - marginX, y); y += 30;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(82, 102, 124);
  doc.text("_______________________________________________", marginX, y); y += 14;
  doc.text("Técnico de Referência", marginX, y); y += 26;
  doc.text("_______________________________________________", marginX, y); y += 14;
  doc.text("Assinatura do Responsável Familiar", marginX, y);

  doc.save(safeFileName(paf) + ".pdf");
  toast("PDF gerado.");
}

/* ---------------------------- Exportação: Word (.doc compatível) ---------------------------- */

function exportWord(paf) {
  if (!paf) return;

  function row(label, value) {
    const val = value && String(value).trim() ? escapeHtml(value) : "—";
    return `<tr><td style="padding:4px 8px;font-weight:bold;color:#1F3A5F;width:220px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 8px;vertical-align:top;">${val}</td></tr>`;
  }
  function sectionTitle(text) {
    return `<h2 style="color:#1F3A5F;border-bottom:1px solid #2E7D6B;padding-bottom:4px;margin-top:26px;font-size:14pt;">${escapeHtml(text)}</h2>`;
  }
  function checklist(items, selected) {
    return `<ul style="margin:4px 0 10px;padding-left:18px;">` + items.map(it =>
      `<li>${selected.includes(it) ? "☑" : "☐"} ${escapeHtml(it)}</li>`
    ).join("") + `</ul>`;
  }

  let body = "";
  body += `<h1 style="color:#1F3A5F;font-size:18pt;margin-bottom:2px;">Plano de Acompanhamento Familiar — PAF / PAIF</h1>`;
  body += `<p style="color:#52667C;margin-top:0;">Serviço de Proteção e Atendimento Integral à Família</p>`;
  body += `<table style="width:100%;border-collapse:collapse;">`
    + row("Nome do CRAS", paf.crasNome) + row("Responsável Familiar", paf.responsavel)
    + row("CPF", paf.cpf) + row("NIS", paf.nis) + row("Endereço", paf.endereco)
    + row("Data inicial do PAF", fmtDateBR(paf.dataInicial)) + row("Periodicidade", paf.periodicidade)
    + row("Situação do PAF", STATUS_LABELS[paf.situacaoPAF] + (paf.situacaoData ? " em " + fmtDateBR(paf.situacaoData) : ""))
    + `</table>`;

  body += sectionTitle("Membros da Família em Acompanhamento");
  body += `<table style="width:100%;border-collapse:collapse;" border="1" cellpadding="5">
    <tr style="background:#DEEAE6;"><th>Nome</th><th>Data de nascimento</th><th>Parentesco</th></tr>
    ${(paf.membros || []).filter(m => m.nome).map(m => `<tr><td>${escapeHtml(m.nome)}</td><td>${fmtDateBR(m.nascimento)}</td><td>${escapeHtml(m.parentesco)}</td></tr>`).join("")}
  </table>`;

  body += sectionTitle("Diagnóstico — Vulnerabilidades da Família");
  body += checklist(VULNERABILIDADES_FAMILIA, paf.vulnerabilidades);
  if (paf.vulnerabilidadesOutros) body += `<p><strong>Outros:</strong> ${escapeHtml(paf.vulnerabilidadesOutros)}</p>`;

  body += sectionTitle("Situações e Riscos Sociais");
  body += `<table style="width:100%;border-collapse:collapse;" border="1" cellpadding="5">
    <tr style="background:#DEEAE6;"><th>Situação</th><th>Membro(s)</th><th>Superada</th></tr>
    ${paf.situacoesSociais.filter(r => r.membros || r.superada).map(r => `<tr><td>${escapeHtml(r.situacao)}</td><td>${escapeHtml(r.membros)}</td><td>${r.superada ? "Sim" : "Não"}</td></tr>`).join("")}
  </table>`;

  body += sectionTitle("Serviços da Rede Socioassistencial");
  body += `<p><strong>Proteção Social Básica:</strong> ${paf.servBasica.map(escapeHtml).join(", ") || "—"}</p>`;
  body += `<p><strong>Média Complexidade:</strong> ${paf.servMedia.map(escapeHtml).join(", ") || "—"}</p>`;
  body += `<p><strong>Alta Complexidade:</strong> ${paf.servAlta.map(escapeHtml).join(", ") || "—"}</p>`;

  body += sectionTitle("Programas, Projetos e Benefícios");
  body += `<table style="width:100%;border-collapse:collapse;">`
    + row("Participa de programas/projetos sociais", paf.participaProgramas)
    + row("Quais programas", paf.programasQuais.join(", "))
    + row("Municipal", paf.programasMunicipalQual)
    + row("Projeto social", paf.programasProjetoQual)
    + row("Outros programas", paf.programasOutros)
    + row("Recebe outro benefício assistencial/eventual", paf.recebeBeneficio)
    + row("Quais benefícios", paf.beneficioQuais.join(", "))
    + row("Outro benefício", paf.beneficioOutro)
    + `</table>`;

  body += sectionTitle("Rede de Apoio Institucional do Território");
  body += `<p>${paf.redeApoio.map(escapeHtml).join(", ") || "—"}</p>`;
  if (paf.redeApoioOutros) body += `<p><strong>Outros:</strong> ${escapeHtml(paf.redeApoioOutros)}</p>`;

  body += sectionTitle("Metas, Evolução e Acompanhamento");
  body += `<table style="width:100%;border-collapse:collapse;" border="1" cellpadding="5">
    <tr style="background:#DEEAE6;"><th>Meta</th><th>Prazo</th><th>Resultados</th></tr>
    ${paf.metas.map(m => `<tr><td>${escapeHtml(m.meta)}</td><td>${escapeHtml(m.prazo)}</td><td>${escapeHtml(m.resultados)}</td></tr>`).join("")}
  </table>`;

  body += sectionTitle("Estratégias e Eixos de Intervenção");
  body += `<p><strong>Estratégias:</strong> ${paf.estrategias.map(escapeHtml).join(", ") || "—"}${paf.estrategiasOutras ? " · Outras: " + escapeHtml(paf.estrategiasOutras) : ""}</p>`;
  body += `<p><strong>Eixos:</strong> ${paf.eixos.map(escapeHtml).join(", ") || "—"}${paf.eixosOutros ? " · Outros: " + escapeHtml(paf.eixosOutros) : ""}</p>`;

  body += sectionTitle("Elaboração do Plano");
  body += `<table style="width:100%;border-collapse:collapse;">`
    + row("Família participou da construção do Plano", paf.familiaParticipou)
    + row("Prazo de execução do Plano", paf.prazoExecucaoPlano)
    + row("Prazo de avaliação do Plano", paf.prazoAvaliacaoPlano)
    + row("Técnico de Referência", paf.tecnicoReferencia)
    + row("Data de elaboração", fmtDateBR(paf.dataElaboracao))
    + `</table>`;

  if (paf.encerramentoMotivo || paf.encerramentoTecnico) {
    const motivo = ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo);
    body += sectionTitle("Encerramento do Acompanhamento Familiar");
    body += `<table style="width:100%;border-collapse:collapse;">`
      + row("Motivo", motivo ? `(${motivo.v}) ${motivo.label}` : "—")
      + row("Observações do motivo", paf.encerramentoOutros)
      + row("Técnico de Referência", paf.encerramentoTecnico)
      + row("Data", fmtDateBR(paf.encerramentoData))
      + `</table>`;
  }

  if (paf.observacoes) {
    body += sectionTitle("Observações");
    body += `<p>${escapeHtml(paf.observacoes).replace(/\n/g, "<br>")}</p>`;
  }

  body += `<br><br><table style="width:100%;margin-top:40px;">
    <tr><td style="width:50%;">_______________________________________<br>Técnico de Referência</td>
    <td style="width:50%;">_______________________________________<br>Assinatura do Responsável Familiar</td></tr>
  </table>`;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${escapeHtml(safeFileName(paf))}</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
    <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1F3A5F;} table{border-collapse:collapse;} td,th{border:1px solid #D7E0E6;}</style>
    </head><body>${body}</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  triggerDownload(blob, safeFileName(paf) + ".doc");
  toast("Word gerado (.doc — abre normalmente no Microsoft Word).");
}

/* ---------------------------- Boot ---------------------------- */

initStorage();
renderApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
