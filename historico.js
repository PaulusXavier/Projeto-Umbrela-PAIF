/* =====================================================================
   Histórico de Evolução da Família

   Registra, automaticamente, cada alteração feita no PAF (data, quem
   alterou, valor anterior → valor novo) para que a evolução da família
   possa ser acompanhada ao longo do tempo. Também permite marcos manuais
   (anotações datadas) e mostra a trajetória de cada campo.

   Funcionamento:
   - state.historicoBase guarda uma "foto" do PAF no último salvamento.
   - A cada savePAF(), a foto anterior é comparada com o estado atual
     (histRegistrar) e as diferenças entram em paf.historico.
   - Alterações do mesmo dia, do mesmo usuário, são agrupadas num único
     registro (o autosave grava a cada pausa na digitação, então sem isso
     haveria um registro por letra). O "antes" é sempre o valor do início
     do dia; o "depois" é o valor mais recente.
   - Incluir/remover linhas (membro, encaminhamento...) abre um registro
     próprio, para não misturar posições de linhas diferentes.
   ===================================================================== */

const HIST_IGNORAR = new Set([
  "diario", "habitacaoObs", "eduObs", "rendaObs", "saudeObs", "aspectosPsicossociaisObs", "barreirasDesafios", "observacoes", // campos de texto agora são anotações datadas (ver "Anotações por dia")
  "id", "createdAt", "updatedAt", "criadoPor", "atualizadoPor",
  "anexos", "anexosCount", "historico", "tipo", "situacaoData"
]);

// Listas de itens fixos (o app cria sempre os mesmos itens): comparadas pelo nome do item.
const HIST_LISTAS_FIXAS = { situacoesSociais: "situacao", potencialidades: "potencial", metas: "meta" };

const HIST_ROTULOS = {
  crasNome: "Nome do CRAS", responsavel: "Responsável familiar", responsavelSexo: "Sexo do responsável",
  responsavelEstadoCivil: "Estado civil do responsável", responsavelNacionalidade: "Nacionalidade do responsável",
  responsavelEtnia: "Etnia do responsável", responsavelNascimento: "Nascimento do responsável",
  apelido: "Apelido", nomeMae: "Nome da mãe", cpf: "CPF", nis: "NIS", rg: "RG", rgOrgao: "Órgão emissor do RG",
  rgUf: "UF do RG", rgDataEmissao: "Data de emissão do RG", endereco: "Endereço",
  enderecoRua: "Rua", enderecoNumero: "Número", enderecoComplemento: "Complemento", enderecoBairro: "Bairro",
  enderecoMunicipio: "Município", enderecoUf: "UF", enderecoCep: "CEP", pontoReferencia: "Ponto de referência",
  telefones: "Telefones", localizacaoDomicilio: "Localização do domicílio", dataInicial: "Data de início do acompanhamento",
  periodicidade: "Periodicidade", situacaoPAF: "Situação do PAF",
  vulnerabilidades: "Vulnerabilidades", vulnerabilidadesOutros: "Outras vulnerabilidades",
  barreirasDesafios: "Barreiras e desafios",
  servBasica: "Serviços da Proteção Básica", servMedia: "Serviços da Proteção Especial de Média Complexidade",
  servAlta: "Serviços da Proteção Especial de Alta Complexidade",
  atividadesColetivas: "Atividades coletivas", atividadesColetivasOutras: "Outras atividades coletivas",
  habitacaoTipo: "Habitação — tipo", habitacaoParedes: "Habitação — paredes", habitacaoEnergia: "Habitação — energia",
  habitacaoAgua: "Habitação — água", habitacaoEsgoto: "Habitação — esgoto", habitacaoLixo: "Habitação — lixo",
  habitacaoComodos: "Habitação — nº de cômodos", habitacaoDormitorios: "Habitação — nº de dormitórios",
  habitacaoAreaRisco: "Habitação — área de risco", habitacaoObs: "Habitação — observações",
  habitacaoAbrigoNome: "Abrigo onde a família reside",
  migracaoDataChegadaBrasil: "Data de chegada ao Brasil", migracaoDocumentacao: "Documentação migratória",
  migracaoDocumentacaoOutro: "Documentação migratória — outro", migracaoInteriorizacao: "Interiorização",
  eduForaEscola06: "Educação — 0 a 6 anos fora da escola", eduForaEscola614: "Educação — 6 a 14 anos fora da escola",
  eduForaEscola1517: "Educação — 15 a 17 anos fora da escola", eduAnalfabetismo1017: "Analfabetismo — 10 a 17 anos",
  eduAnalfabetismo1859: "Analfabetismo — 18 a 59 anos", eduAnalfabetismo60mais: "Analfabetismo — 60 anos ou mais",
  eduObs: "Educação — observações", rendaTotal: "Renda total da família", rendaPerCapita: "Renda per capita",
  rendaObs: "Renda — observações",
  saudeDoencaGrave: "Saúde — doença grave", saudeDoencaGraveQuem: "Saúde — doença grave (quem)",
  saudeMedicacaoControlada: "Saúde — medicação controlada", saudeMedicacaoQuem: "Saúde — medicação controlada (quem)",
  saudeAlcool: "Saúde — uso de álcool", saudeAlcoolQuem: "Saúde — uso de álcool (quem)",
  saudeDrogas: "Saúde — uso de drogas", saudeDrogasQuem: "Saúde — uso de drogas (quem)",
  saudeGestante: "Saúde — gestante", saudeGestanteQuem: "Saúde — gestante (quem)", saudeObs: "Saúde — observações",
  instrumentaisTecnicos: "Instrumentais técnicos", aspectosPsicossociaisObs: "Aspectos relacionais observados",
  participaProgramas: "Participa de programas", programasQuais: "Programas dos quais participa",
  programasOutros: "Outros programas", recebeBeneficio: "Recebe benefício", beneficioQuais: "Benefícios que recebe",
  beneficioOutro: "Outro benefício", redeApoio: "Rede de apoio", redeApoioOutros: "Rede de apoio — outros",
  estrategias: "Estratégias", estrategiasOutras: "Outras estratégias", eixos: "Eixos de trabalho",
  eixosOutros: "Outros eixos", familiaParticipou: "Família participou da elaboração do plano",
  objetivosPaif: "Objetivos do PAIF", objetivosPaifOutros: "Outros objetivos do PAIF",
  segurancasSocioassistenciais: "Seguranças socioassistenciais",
  segurancasSocioassistenciaisOutras: "Outras seguranças socioassistenciais",
  prazoExecucaoPlano: "Prazo de execução do plano", prazoAvaliacaoPlano: "Prazo de avaliação do plano",
  tecnicoReferencia: "Técnico de referência", dataElaboracao: "Data de elaboração do plano",
  encerramentoMotivo: "Motivo do encerramento", encerramentoOutros: "Encerramento — outros",
  encerramentoTecnico: "Técnico do encerramento", encerramentoData: "Data de encerramento",
  observacoes: "Observações gerais"
};

const HIST_ROTULOS_LISTA = {
  membros: "Membro", atendimentos: "Atendimento", encaminhamentosForm: "Encaminhamento",
  beneficiosEventuaisForm: "Benefício eventual", situacoesSociais: "Situação social",
  potencialidades: "Potencialidade", metas: "Meta"
};

const HIST_ROTULOS_SUB = {
  nome: "Nome", nascimento: "Nascimento", parentesco: "Parentesco", sexo: "Sexo", nacionalidade: "Nacionalidade",
  etnia: "Etnia", pcd: "Pessoa com deficiência", membros: "Membros envolvidos", superada: "Superada",
  situacao: "Situação", observacoes: "Observações", prazo: "Prazo", resultados: "Resultados", data: "Data",
  tipo: "Tipo", tecnico: "Técnico", evolucao: "Evolução", encaminhamentos: "Encaminhamentos", area: "Área",
  orgaoDestino: "Órgão de destino", objetivo: "Objetivo", profissionalOrigem: "Profissional de origem",
  telefoneOrigem: "Telefone de origem", contraReferencia: "Contrarreferência", situacaoMotivadora: "Situação motivadora",
  situacaoDetalhe: "Detalhe da situação", formaConcessao: "Forma de concessão", valor: "Valor",
  situacaoRequerimento: "Situação do requerimento", dataConcessao: "Data de concessão",
  parecerTecnico: "Parecer técnico", profissionalResponsavel: "Profissional responsável"
};

const HIST_SECAO_REGRAS = [
  ["familia", /^membros$/],
  ["observacoes", /^observacoes$/],
  ["encerramento", /^encerramento/],
  ["encaminhamentos", /^encaminhamentosForm$/],
  ["beneficioEventual", /^beneficiosEventuaisForm$/],
  ["rede", /^redeApoio/],
  ["metas", /^(metas|atendimentos)$/],
  ["estrategias", /^(estrategias|eixos|familiaParticipou)/],
  ["plano", /^(objetivosPaif|segurancas|prazoExecucao|prazoAvaliacao|tecnicoReferencia|dataElaboracao)/],
  ["programas", /^(participaProgramas|programas|recebeBeneficio|beneficioQuais|beneficioOutro)/],
  ["grupo", /^(situacoesSociais|servBasica|servMedia|servAlta|atividadesColetivas)/],
  ["diagnostico", /^(vulnerabilidades|potencialidades|barreirasDesafios|habitacao|migracao|edu|renda|saude|instrumentaisTecnicos|aspectosPsicossociais)/],
  ["cabecalho", /.*/]
];

// Campos numéricos que ganham um minigráfico de evolução na visão "Por campo".
const HIST_CAMPOS_NUMERICOS = /^(renda|habitacaoComodos|habitacaoDormitorios|eduForaEscola|eduAnalfabetismo)/;

const HIST_UI = { view: "linha", secao: "" };

/* ---------------------------- Utilitários ---------------------------- */

function histHoje() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; // data local, não UTC
}

function histId() {
  return "h_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function histCorta(v) {
  if (typeof v === "string" && v.length > 600) return v.slice(0, 600) + "…";
  return v;
}

function histSecaoId(key) {
  const k = String(key).split("|")[0];
  return (HIST_SECAO_REGRAS.find(([, re]) => re.test(k)) || ["cabecalho"])[0];
}

function histSecaoLabel(secaoId) {
  const s = (typeof SECTIONS !== "undefined" ? SECTIONS : []).find(x => x.id === secaoId);
  return s ? s.label : secaoId;
}

function histRotuloCampo(key) {
  if (HIST_ROTULOS[key]) return HIST_ROTULOS[key];
  const t = String(key).replace(/([A-Z0-9])/g, " $1").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function histRotuloSub(f) {
  if (HIST_ROTULOS_SUB[f]) return HIST_ROTULOS_SUB[f];
  const t = String(f).replace(/([A-Z0-9])/g, " $1").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function histSnapshot(paf) {
  const out = {};
  Object.keys(paf).forEach(k => {
    if (!HIST_IGNORAR.has(k)) out[k] = paf[k];
  });
  return JSON.parse(JSON.stringify(out));
}

function histIgual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function histVazio(v) {
  if (v == null || v === "" || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function histLinhaVazia(row) {
  return !row || Object.values(row).every(histVazio);
}

function histDescLinha(key, row, i) {
  const n = i + 1;
  switch (key) {
    case "membros": return row.nome ? `Membro: ${row.nome}` : `Membro nº ${n}`;
    case "atendimentos": return row.data ? `Atendimento de ${fmtDateBR(row.data)}` : `Atendimento nº ${n}`;
    case "encaminhamentosForm": return `Encaminhamento${row.orgaoDestino || row.area ? ": " + (row.orgaoDestino || row.area) : " nº " + n}`;
    case "beneficiosEventuaisForm": return `Benefício eventual${row.tipo ? ": " + row.tipo : " nº " + n}`;
    default: return `${HIST_ROTULOS_LISTA[key] || key} nº ${n}`;
  }
}

/* ---------------------------- Comparação ---------------------------- */

function histDiffCampos(prefixo, idChave, rotuloBase, ra, rb, out) {
  const campos = new Set([...Object.keys(ra || {}), ...Object.keys(rb || {})]);
  campos.forEach(f => {
    const va = ra ? ra[f] : undefined, vb = rb ? rb[f] : undefined;
    const na = va == null ? "" : va, nb = vb == null ? "" : vb;
    if (histIgual(na, nb)) return;
    out.push({
      k: `${prefixo}|${idChave}|${f}`,
      rotulo: `${rotuloBase} — ${histRotuloSub(f)}`,
      secao: histSecaoId(prefixo),
      tipo: "valor",
      antes: histCorta(na),
      depois: histCorta(nb)
    });
  });
}

function histDiffLinhas(key, la, lb, out) {
  let ini = 0;
  while (ini < la.length && ini < lb.length && histIgual(la[ini], lb[ini])) ini++;
  let fa = la.length, fb = lb.length;
  while (fa > ini && fb > ini && histIgual(la[fa - 1], lb[fb - 1])) { fa--; fb--; }
  const mA = la.slice(ini, fa), mB = lb.slice(ini, fb);
  const n = Math.min(mA.length, mB.length);
  for (let i = 0; i < n; i++) {
    const rb = mB[i], ra = mA[i];
    const rotulo = histDescLinha(key, rb.nome || !ra.nome ? rb : ra, ini + i);
    histDiffCampos(key, ini + i, rotulo, ra, rb, out);
  }
  mA.slice(n).forEach((r, i) => {
    if (histLinhaVazia(r)) return;
    out.push({ k: `${key}|-|${ini + n + i}`, rotulo: HIST_ROTULOS_LISTA[key] || key, secao: histSecaoId(key), tipo: "linha-", antes: histDescLinha(key, r, ini + n + i), depois: null });
  });
  mB.slice(n).forEach((r, i) => {
    if (histLinhaVazia(r)) return;
    out.push({ k: `${key}|+|${ini + n + i}`, rotulo: HIST_ROTULOS_LISTA[key] || key, secao: histSecaoId(key), tipo: "linha+", antes: null, depois: histDescLinha(key, r, ini + n + i) });
  });
}

function histDiffFixas(key, idCampo, la, lb, out) {
  const mapa = arr => { const m = new Map(); arr.forEach(r => m.set(r[idCampo], r)); return m; };
  const ma = mapa(la), mb = mapa(lb);
  const ids = new Set([...ma.keys(), ...mb.keys()]);
  ids.forEach(id => {
    const ra = ma.get(id), rb = mb.get(id);
    const nome = String(id).length > 70 ? String(id).slice(0, 70) + "…" : id;
    const rotuloBase = `${HIST_ROTULOS_LISTA[key]}: ${nome}`;
    if (ra && rb) histDiffCampos(key, id, rotuloBase, ra, rb, out);
    else if (rb && !histLinhaVazia(Object.assign({}, rb, { [idCampo]: "" }))) out.push({ k: `${key}|+|${id}`, rotulo: HIST_ROTULOS_LISTA[key], secao: histSecaoId(key), tipo: "linha+", antes: null, depois: rotuloBase });
    else if (ra && !histLinhaVazia(Object.assign({}, ra, { [idCampo]: "" }))) out.push({ k: `${key}|-|${id}`, rotulo: HIST_ROTULOS_LISTA[key], secao: histSecaoId(key), tipo: "linha-", antes: rotuloBase, depois: null });
  });
}

function histDiff(a, b) {
  const out = [];
  const chaves = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  chaves.forEach(key => {
    if (HIST_IGNORAR.has(key)) return;
    const va = a ? a[key] : undefined, vb = b ? b[key] : undefined;
    if (Array.isArray(va) || Array.isArray(vb)) {
      const la = Array.isArray(va) ? va : [], lb = Array.isArray(vb) ? vb : [];
      const temObjetos = [...la, ...lb].some(x => x && typeof x === "object");
      if (!temObjetos) {
        const sa = [...la].sort(), sb = [...lb].sort();
        if (!histIgual(sa, sb)) out.push({ k: key, rotulo: histRotuloCampo(key), secao: histSecaoId(key), tipo: "lista", antes: la, depois: lb });
      } else if (HIST_LISTAS_FIXAS[key]) {
        histDiffFixas(key, HIST_LISTAS_FIXAS[key], la, lb, out);
      } else {
        histDiffLinhas(key, la, lb, out);
      }
      return;
    }
    if ((va && typeof va === "object") || (vb && typeof vb === "object")) return;
    const na = va == null ? "" : va, nb = vb == null ? "" : vb;
    if (na === nb) return;
    out.push({ k: key, rotulo: histRotuloCampo(key), secao: histSecaoId(key), tipo: "valor", antes: histCorta(na), depois: histCorta(nb) });
  });
  return out;
}

/* ---------------------------- Registro ---------------------------- */

function histIniciarBase(paf) {
  state.historicoBase = { id: paf.id, snap: histSnapshot(paf) };
}

function histLimitar(paf) {
  const h = paf.historico;
  if (h.length > 1000) h.splice(0, h.length - 1000);
  // O PAF inteiro vai num único documento do Firestore (limite de 1 MB):
  // se o histórico crescer demais, descarta os registros automáticos mais antigos.
  while (h.length > 20 && JSON.stringify(h).length > 600000) {
    const i = h.findIndex(e => e.tipo === "auto");
    h.splice(i === -1 ? 0 : i, 1);
  }
}

function histRegistrar(paf) {
  if (!paf || paf !== state.current) return;
  const atual = histSnapshot(paf);
  const base = state.historicoBase;
  if (!base || base.id !== paf.id) { state.historicoBase = { id: paf.id, snap: atual }; return; }
  const mud = histDiff(base.snap, atual);
  base.snap = atual;
  if (!mud.length) return;

  if (!Array.isArray(paf.historico)) paf.historico = [];
  const agora = new Date().toISOString();
  const hoje = histHoje();
  const usuario = (state.currentUser && state.currentUser.email) || null;
  const estrutural = mud.some(m => m.tipo === "linha+" || m.tipo === "linha-");
  const ult = paf.historico[paf.historico.length - 1];

  if (!estrutural && ult && ult.tipo === "auto" && !ult.estrutural && ult.data === hoje && ult.usuario === usuario) {
    mud.forEach(m => {
      const x = ult.mudancas.find(e => e.k === m.k && e.tipo === m.tipo);
      if (!x) { ult.mudancas.push(m); return; }
      x.depois = m.depois;
      x.rotulo = m.rotulo;
      const igual = m.tipo === "lista" ? histIgual([...x.antes].sort(), [...x.depois].sort()) : x.antes === x.depois;
      if (igual) ult.mudancas.splice(ult.mudancas.indexOf(x), 1);
    });
    ult.atualizadoEm = agora;
    if (!ult.mudancas.length && !ult.nota) paf.historico.pop();
  } else {
    paf.historico.push({ id: histId(), tipo: "auto", data: hoje, criadoEm: agora, atualizadoEm: agora, usuario, estrutural, nota: "", mudancas: mud });
  }
  histLimitar(paf);
}

function histAdicionarMarco(paf, data, nota) {
  if (!Array.isArray(paf.historico)) paf.historico = [];
  const agora = new Date().toISOString();
  paf.historico.push({
    id: histId(), tipo: "manual", data: data || histHoje(), criadoEm: agora, atualizadoEm: agora,
    usuario: (state.currentUser && state.currentUser.email) || null, estrutural: true, nota, mudancas: []
  });
  histLimitar(paf);
}

/* ---------------------------- Apresentação ---------------------------- */

function histFmt(v) {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  if (v == null || v === "") return "(vazio)";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDateBR(v);
    if (typeof STATUS_LABELS !== "undefined" && STATUS_LABELS[v]) return STATUS_LABELS[v];
  }
  return String(v);
}

function histListaDelta(m) {
  const a = new Set(m.antes || []), b = new Set(m.depois || []);
  return {
    add: [...b].filter(x => !a.has(x)),
    rem: [...a].filter(x => !b.has(x))
  };
}

function histTextoMudanca(m) {
  if (m.tipo === "valor") return `${m.rotulo}: ${histFmt(m.antes)} → ${histFmt(m.depois)}`;
  if (m.tipo === "lista") {
    const d = histListaDelta(m);
    return `${m.rotulo}: ${[...d.add.map(x => "+ " + x), ...d.rem.map(x => "− " + x)].join("; ")}`;
  }
  if (m.tipo === "linha+") return `${m.depois} — adicionado(a)`;
  return `${m.antes} — removido(a)`;
}

function histMudancaHTML(m) {
  const rot = `<span class="hist-campo">${escapeHtml(m.rotulo)}</span>`;
  if (m.tipo === "valor") {
    return `<div class="hist-mud">${rot}<span class="hist-de-para"><span class="hist-antes" title="${escapeHtml(m.antes)}">${escapeHtml(histFmt(m.antes))}</span><span class="hist-seta">→</span><span class="hist-depois" title="${escapeHtml(m.depois)}">${escapeHtml(histFmt(m.depois))}</span></span></div>`;
  }
  if (m.tipo === "lista") {
    const d = histListaDelta(m);
    return `<div class="hist-mud">${rot}<span class="hist-de-para">${d.add.map(x => `<span class="hist-chip add">+ ${escapeHtml(x)}</span>`).join("")}${d.rem.map(x => `<span class="hist-chip rem">− ${escapeHtml(x)}</span>`).join("")}</span></div>`;
  }
  if (m.tipo === "linha+") return `<div class="hist-mud">${rot}<span class="hist-de-para"><span class="hist-chip add">+ ${escapeHtml(m.depois)}</span></span></div>`;
  return `<div class="hist-mud">${rot}<span class="hist-de-para"><span class="hist-chip rem">− ${escapeHtml(m.antes)}</span></span></div>`;
}

function histOrdenar(paf) {
  return (paf.historico || [])
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (b.e.data || "").localeCompare(a.e.data || "") || (b.e.criadoEm || "").localeCompare(a.e.criadoEm || ""));
}

function histHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function histEstatisticas(paf) {
  const h = paf.historico || [];
  const datas = h.map(e => e.data).filter(Boolean).sort();
  const campos = new Set();
  h.forEach(e => (e.mudancas || []).forEach(m => campos.add(m.k)));
  return {
    registros: h.length,
    campos: campos.size,
    primeira: datas[0] || "",
    ultima: datas[datas.length - 1] || "",
    marcos: h.filter(e => e.tipo === "manual").length
  };
}

function histSparkSVG(vals) {
  const w = 120, hgt = 28, pad = 3;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / Math.max(vals.length - 1, 1);
    const y = hgt - pad - ((v - min) / span) * (hgt - 2 * pad);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const ult = pts[pts.length - 1];
  return `<svg class="hist-spark" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" role="img" aria-label="Evolução numérica: de ${vals[0]} para ${vals[vals.length - 1]}"><polyline fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => p.join(",")).join(" ")}"/><circle cx="${ult[0]}" cy="${ult[1]}" r="2.6" fill="currentColor"/></svg>`;
}

function histPorCampoHTML(paf, secaoFiltro) {
  const cron = (paf.historico || [])
    .filter(e => e.tipo === "auto")
    .slice()
    .sort((a, b) => (a.data || "").localeCompare(b.data || "") || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const grupos = new Map();
  cron.forEach(e => (e.mudancas || []).forEach(m => {
    if (secaoFiltro && m.secao !== secaoFiltro) return;
    if (!grupos.has(m.k)) grupos.set(m.k, { m, itens: [] });
    const g = grupos.get(m.k);
    g.m = m;
    g.itens.push({ data: e.data, m });
  }));
  if (!grupos.size) return `<p class="hint">Nenhuma alteração registrada${secaoFiltro ? " nesta seção" : ""} ainda.</p>`;
  const lista = [...grupos.values()].sort((a, b) => b.itens.length - a.itens.length);
  return lista.map(g => {
    const primeiro = g.itens[0].m, tipo = g.m.tipo;
    let corpo = "";
    if (tipo === "valor") {
      const pontos = [{ data: "", v: primeiro.antes }, ...g.itens.map(it => ({ data: it.data, v: it.m.depois }))];
      corpo = `<div class="hist-trilha">${pontos.map((p, i) => `<span class="hist-ponto${i === pontos.length - 1 ? " atual" : ""}"><b>${escapeHtml(histFmt(p.v))}</b><em>${p.data ? fmtDateBR(p.data) : "início"}</em></span>`).join('<span class="hist-seta">→</span>')}</div>`;
      if (HIST_CAMPOS_NUMERICOS.test(g.m.k)) {
        const nums = pontos
          .map(p => (/^\s*(R\$)?\s*[\d.,]+\s*$/.test(String(p.v)) ? parseValorMonetario(p.v) : null))
          .filter(n => n !== null && !isNaN(n));
        if (nums.length >= 2) corpo += histSparkSVG(nums);
      }
    } else {
      corpo = `<div class="hist-trilha col">${g.itens.map(it => `<span class="hist-linha-tempo"><em>${fmtDateBR(it.data)}</em> ${escapeHtml(histTextoMudanca(it.m).replace(it.m.rotulo + ": ", ""))}</span>`).join("")}</div>`;
    }
    return `<div class="hist-campo-card"><div class="hist-campo-topo"><span class="hist-campo">${escapeHtml(g.m.rotulo)}</span><span class="hist-secao-tag">${escapeHtml(histSecaoLabel(g.m.secao))}</span><span class="hist-qtd">${g.itens.length} alteraç${g.itens.length > 1 ? "ões" : "ão"}</span></div>${corpo}</div>`;
  }).join("");
}

function histLinhaTempoHTML(paf, secaoFiltro) {
  const ordenado = histOrdenar(paf);
  const itens = ordenado.map(({ e, i }) => {
    let muds = e.mudancas || [];
    if (secaoFiltro) {
      muds = muds.filter(m => m.secao === secaoFiltro);
      if (!muds.length) return "";
    }
    const badge = dateBadgeParts(e.data);
    const manual = e.tipo === "manual";
    const grupos = {};
    muds.forEach(m => { (grupos[m.secao] = grupos[m.secao] || []).push(m); });
    const corpo = Object.keys(grupos).map(s => `
      <div class="hist-grupo"><div class="hist-grupo-titulo">${escapeHtml(histSecaoLabel(s))}</div>${grupos[s].map(histMudancaHTML).join("")}</div>`).join("");
    const quem = [e.usuario, histHora(e.atualizadoEm || e.criadoEm)].filter(Boolean).join(" · ");
    return `
    <div class="timeline-item hist-item ${manual ? "manual" : ""}" style="--tipo-cor:${manual ? "var(--gold)" : "var(--accent)"}">
      <div class="timeline-date-badge"><span class="dia">${escapeHtml(badge.dia)}</span><span class="mes">${escapeHtml(badge.mes)}</span></div>
      <div class="timeline-card">
        <button class="row-del" data-hist-del="${escapeHtml(e.id)}" title="Remover este registro do histórico" aria-label="Remover este registro do histórico">${uiIconSvg("close", 12)}</button>
        <div class="hist-topo">
          <span class="hist-tipo ${manual ? "manual" : ""}">${manual ? "Marco de evolução" : (muds.length + (muds.length === 1 ? " alteração" : " alterações"))}</span>
          <span class="hist-quem">${escapeHtml(quem)}</span>
        </div>
        ${corpo}
        <div class="timeline-row hist-edit">
          <div class="f"><label>Data da evolução</label><input type="date" data-field="historico.${i}.data" value="${escapeHtml(e.data)}"></div>
          <div class="f" style="grid-column: span 2"><label>${manual ? "Anotação técnica" : "Anotação técnica sobre esta evolução (opcional)"}</label><textarea data-field="historico.${i}.nota" rows="${manual ? 3 : 2}" placeholder="${manual ? "Descreva a evolução observada na família..." : "Ex.: motivo da mudança, contexto, quem informou..."}">${escapeHtml(e.nota || "")}</textarea></div>
        </div>
      </div>
    </div>`;
  }).join("");
  return itens.trim() ? `<div class="timeline">${itens}</div>` : `<p class="hint">Nenhum registro${secaoFiltro ? " nesta seção" : ""} ainda.</p>`;
}

function historicoSectionHTML(paf) {
  const st = histEstatisticas(paf);
  const secoes = [...new Set((paf.historico || []).flatMap(e => (e.mudancas || []).map(m => m.secao)))];
  if (HIST_UI.secao && !secoes.includes(HIST_UI.secao)) HIST_UI.secao = "";
  const vazio = !st.registros;
  return `
  <div class="section-card">
    ${sectionHeader("15", "Histórico de Evolução", "Cada alteração feita neste PAF fica registrada com data, para acompanhar a evolução da família ao longo do tempo.")}
    ${notaTecnica("O acompanhamento do PAIF é um processo continuado, e o registro técnico deve permitir compreender a trajetória da família (Trilha da Primeira Infância, MDS, 2026). Por isso, sempre que você altera uma informação — renda, moradia, situação de saúde, escolaridade, vulnerabilidades, metas, etc. — o app guarda o valor anterior e o novo, com a data. Se a mudança aconteceu em outra data, corrija a \"Data da evolução\" no registro. Use o marco manual para anotar avanços e retrocessos que não aparecem em nenhum campo.")}
    <div class="hist-stats">
      <div class="stat-box"><span class="stat-num">${st.registros}</span><span class="stat-label">Registros</span></div>
      <div class="stat-box"><span class="stat-num">${st.campos}</span><span class="stat-label">Campos alterados</span></div>
      <div class="stat-box"><span class="stat-num">${st.marcos}</span><span class="stat-label">Marcos manuais</span></div>
      <div class="stat-box"><span class="stat-num" style="font-size:14px">${st.ultima ? fmtDateBR(st.ultima) : "—"}</span><span class="stat-label">Última evolução</span></div>
    </div>
    <div class="hist-novo">
      <h3>Registrar marco de evolução</h3>
      <div class="timeline-row">
        <div class="f"><label>Data</label><input type="date" id="histNovaData" value="${histHoje()}"></div>
        <div class="f" style="grid-column: span 2"><label>O que mudou ou foi observado</label><textarea id="histNovaNota" rows="2" placeholder="Ex.: família passou a frequentar o SCFV; responsável conseguiu emprego formal; vínculo com a escola retomado..."></textarea></div>
      </div>
      <button class="btn btn-primary btn-sm" id="histAddBtn" style="margin-top:10px">${uiIconSvg("plus", 13)} Registrar marco</button>
    </div>
  </div>

  <div class="section-card">
    <div class="hist-barra">
      <div class="status-picker">
        <button class="status-opt ${HIST_UI.view === "linha" ? "selected andamento" : ""}" data-hist-view="linha">Linha do tempo</button>
        <button class="status-opt ${HIST_UI.view === "campo" ? "selected andamento" : ""}" data-hist-view="campo">Por campo</button>
      </div>
      <div class="f hist-filtro"><label for="histFiltroSecao">Seção</label>
        <select id="histFiltroSecao"><option value="">Todas</option>${secoes.map(s => `<option value="${s}" ${HIST_UI.secao === s ? "selected" : ""}>${escapeHtml(histSecaoLabel(s))}</option>`).join("")}</select>
      </div>
    </div>
    ${vazio ? `<p class="hint" style="margin:10px 0 0">O histórico começa a ser registrado a partir da próxima alteração feita neste PAF.</p>` : (HIST_UI.view === "campo" ? histPorCampoHTML(paf, HIST_UI.secao) : histLinhaTempoHTML(paf, HIST_UI.secao))}
  </div>`;
}

function attachHistoricoHandlers(container) {
  container.querySelectorAll("[data-hist-view]").forEach(b => b.addEventListener("click", () => {
    HIST_UI.view = b.dataset.histView;
    renderApp();
  }));
  const filtro = container.querySelector("#histFiltroSecao");
  if (filtro) filtro.addEventListener("change", () => { HIST_UI.secao = filtro.value; renderApp(); });

  const add = container.querySelector("#histAddBtn");
  if (add) add.addEventListener("click", () => {
    const nota = (container.querySelector("#histNovaNota").value || "").trim();
    const data = container.querySelector("#histNovaData").value || histHoje();
    if (!nota) { toast("Descreva o marco de evolução antes de registrar."); return; }
    histAdicionarMarco(state.current, data, nota);
    savePAF(state.current, { silent: true });
    renderApp();
    toast("Marco de evolução registrado.");
  });

  container.querySelectorAll("[data-hist-del]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.histDel;
    confirmModal("Remover este registro do histórico?", "O registro de evolução será apagado definitivamente. O valor atual do campo no PAF não é alterado.", () => {
      state.current.historico = (state.current.historico || []).filter(e => e.id !== id);
      savePAF(state.current, { silent: true });
      renderApp();
    });
  }));
}

/* ---------------------------- Exportação (PDF / Word) ---------------------------- */

function histLinhasExportacao(paf, max) {
  const linhas = [];
  histOrdenar(paf).forEach(({ e }) => {
    if (e.tipo === "manual") linhas.push({ data: e.data, campo: "Marco de evolução", detalhe: e.nota || "" });
    (e.mudancas || []).forEach(m => {
      linhas.push({
        data: e.data,
        campo: m.rotulo,
        detalhe: m.tipo === "valor" ? `${histFmt(m.antes)} → ${histFmt(m.depois)}` : histTextoMudanca(m).replace(m.rotulo + ": ", "")
      });
    });
    if (e.tipo === "auto" && e.nota) linhas.push({ data: e.data, campo: "Anotação técnica", detalhe: e.nota });
  });
  return linhas.slice(0, max || 150);
}

// Síntese para impressão: situação inicial x situação atual de cada campo que mudou ao longo do acompanhamento.
function histSinteseExportacao(paf) {
  const cron = (paf.historico || []).filter(e => e.tipo === "auto").slice()
    .sort((a, b) => (a.data || "").localeCompare(b.data || "") || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const grupos = new Map();
  cron.forEach(e => (e.mudancas || []).forEach(m => {
    if (m.tipo !== "valor" && m.tipo !== "lista") return;
    if (!grupos.has(m.k)) grupos.set(m.k, { rotulo: m.rotulo, tipo: m.tipo, ini: m.antes, fim: m.depois, d1: e.data, d2: e.data, n: 0 });
    const g = grupos.get(m.k);
    g.rotulo = m.rotulo; g.fim = m.depois; g.d2 = e.data; g.n++;
  }));
  const txt = (g, v) => g.tipo === "lista" ? ((v || []).join("; ") || "(vazio)") : histFmt(v);
  return [...grupos.values()]
    .filter(g => !histIgual(g.tipo === "lista" ? [...g.ini].sort() : g.ini, g.tipo === "lista" ? [...g.fim].sort() : g.fim))
    .map(g => ({ campo: g.rotulo, inicial: txt(g, g.ini), atual: txt(g, g.fim), periodo: g.d1 === g.d2 ? fmtDateBR(g.d1) : `${fmtDateBR(g.d1)} a ${fmtDateBR(g.d2)}`, n: g.n }));
}

function historicoPdfHTML(paf) {
  const l = histLinhasExportacao(paf);
  if (!l.length) return "";
  const sint = histSinteseExportacao(paf);
  return `
      <h2>Evolução da Família</h2>
      ${sint.length ? `
      <p style="margin:0 0 6px;"><strong>Síntese:</strong> situação inicial e situação atual dos campos que mudaram durante o acompanhamento.</p>
      <table>
        <thead><tr><th style="width:30%">Campo</th><th>Situação inicial</th><th>Situação atual</th><th style="width:16%">Período</th><th style="width:8%">Alterações</th></tr></thead>
        <tbody>${sint.map(r => `<tr><td>${escapeHtml(r.campo)}</td><td>${escapeHtml(r.inicial)}</td><td>${escapeHtml(r.atual)}</td><td>${r.periodo}</td><td style="text-align:center">${r.n}</td></tr>`).join("")}</tbody>
      </table>` : ""}
      <p style="margin:10px 0 6px;"><strong>Registro cronológico:</strong></p>
      <table>
        <thead><tr><th style="width:12%">Data</th><th style="width:34%">Campo</th><th>Alteração / anotação</th></tr></thead>
        <tbody>${l.map(r => `<tr><td>${fmtDateBR(r.data)}</td><td>${escapeHtml(r.campo)}</td><td>${escapeHtml(r.detalhe)}</td></tr>`).join("")}</tbody>
      </table>`;
}

function historicoWordLinhas(paf) {
  return histLinhasExportacao(paf).map(r => `<tr><td>${fmtDateBR(r.data)}</td><td>${escapeHtml(r.campo)}</td><td class="anotacao">${escapeHtml(r.detalhe)}</td></tr>`).join("");
}

function historicoWordSintese(paf) {
  const sint = histSinteseExportacao(paf);
  if (!sint.length) return "";
  return `<table class="dados">
        <tr><th>Campo</th><th>Situação inicial</th><th>Situação atual</th><th>Período</th><th>Alterações</th></tr>
        ${sint.map(r => `<tr><td>${escapeHtml(r.campo)}</td><td>${escapeHtml(r.inicial)}</td><td>${escapeHtml(r.atual)}</td><td>${r.periodo}</td><td style="text-align:center;">${r.n}</td></tr>`).join("")}
      </table><p>&nbsp;</p>`;
}


/* =====================================================================
   Anotações por dia (diário) nos campos de texto livre

   Cada campo de observação vira uma lista de anotações datadas.
   - paf.diario[campo] = [{ id, data, texto }]
   - O texto antigo do campo vira uma anotação "sem data" (migração).
   - paf[campo] continua existindo, como texto compilado
     ("dd/mm/aaaa — texto"), para o PDF, o Word e o restante do app
     continuarem funcionando sem mudanças.
   ===================================================================== */

const DIARIO_CAMPOS = ["habitacaoObs", "eduObs", "rendaObs", "saudeObs", "aspectosPsicossociaisObs", "barreirasDesafios", "observacoes"];

function diarioBr(str) {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

function diarioMigrar(paf) {
  if (!paf.diario || typeof paf.diario !== "object") paf.diario = {};
  DIARIO_CAMPOS.forEach(k => {
    if (!Array.isArray(paf.diario[k])) {
      paf.diario[k] = paf[k] ? [{ id: histId(), data: "", texto: paf[k] }] : [];
    }
  });
}

function diarioCompilar(paf) {
  if (!paf || !paf.diario) return;
  DIARIO_CAMPOS.forEach(k => {
    const lista = paf.diario[k];
    if (!Array.isArray(lista)) return;
    paf[k] = lista
      .filter(e => e && String(e.texto || "").trim())
      .slice()
      .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
      .map(e => (e.data ? `${fmtDateBR(e.data)} — ${String(e.texto).trim()}` : String(e.texto).trim()))
      .join("\n\n");
  });
}

function diarioCampoHTML(paf, key, label, opts) {
  opts = opts || {};
  if (!paf.diario || !Array.isArray(paf.diario[key])) diarioMigrar(paf);
  const lista = paf.diario[key];
  const ordenada = lista.map((e, i) => ({ e, i }))
    .sort((a, b) => (b.e.data || "").localeCompare(a.e.data || "") || b.i - a.i);
  const itens = ordenada.map(({ e, i }) => `
    <div class="diario-item${e.data ? "" : " sem-data"}">
      <div class="diario-data"><label>${e.data ? "Data" : "Registro anterior (sem data)"}</label><input type="date" data-field="diario.${key}.${i}.data" value="${escapeHtml(e.data)}"></div>
      <div class="diario-texto"><textarea rows="${opts.rows || 3}" data-field="diario.${key}.${i}.texto" placeholder="${escapeHtml(opts.placeholder || "Anotação deste dia...")}">${escapeHtml(e.texto)}</textarea></div>
      <button class="row-del" data-diario-del="${key}" data-idx="${i}" title="Remover esta anotação" aria-label="Remover esta anotação">${uiIconSvg("close", 12)}</button>
    </div>`).join("");
  return `
  <div class="f c12 diario-campo" ${opts.mt ? 'style="margin-top:12px"' : ""}>
    <label>${label}</label>
    <div class="diario-lista">${itens || `<p class="hint" style="margin:2px 0 6px">Nenhuma anotação ainda. Cada anotação fica registrada com a data, para acompanhar a evolução.</p>`}</div>
    <button class="add-row-btn" data-diario-add="${key}">+ Anotação de hoje</button>
  </div>`;
}

function attachDiarioHandlers(container) {
  container.querySelectorAll("[data-diario-add]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.diarioAdd;
    const paf = state.current;
    if (!paf.diario || !Array.isArray(paf.diario[k])) diarioMigrar(paf);
    paf.diario[k].push({ id: histId(), data: histHoje(), texto: "" });
    const idx = paf.diario[k].length - 1;
    savePAF(paf, { silent: true });
    renderApp();
    const ta = document.querySelector(`[data-field="diario.${k}.${idx}.texto"]`);
    if (ta) { ta.focus(); ta.scrollIntoView({ block: "center" }); }
  }));
  container.querySelectorAll("[data-diario-del]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.diarioDel, idx = parseInt(btn.dataset.idx, 10);
    confirmModal("Remover esta anotação?", "A anotação deste dia será apagada.", () => {
      state.current.diario[k].splice(idx, 1);
      savePAF(state.current, { silent: true });
      renderApp();
    });
  }));
}
