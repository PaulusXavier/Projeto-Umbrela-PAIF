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
  "anexos", "anexosCount", "anexosBytes", "historico", "historicoCount", "tipo", "situacaoData"
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

// Anotações abertas pelo usuário (sobrevivem ao redesenho da tela)
/* Sentido de um marco de evolução: permite separar avanços, retrocessos e simples observações. */
const HIST_SENTIDOS = {
  avanco: { label: "Avanço", icone: "▲" },
  retrocesso: { label: "Retrocesso", icone: "▼" },
  observacao: { label: "Observação", icone: "●" }
};
function histSentido(e) { return e && e.tipo === "manual" ? (HIST_SENTIDOS[e.sentido] ? e.sentido : "observacao") : ""; }
function histRotuloMarco(e) { return "Marco de evolução (" + HIST_SENTIDOS[histSentido(e)].label.toLowerCase() + ")"; }
function histDuracao(iso) {
  if (!iso) return "";
  const dias = Math.round((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);
  if (isNaN(dias) || dias < 1) return "hoje";
  if (dias < 60) return dias + (dias === 1 ? " dia" : " dias");
  if (dias < 730) return Math.round(dias / 30.4) + " meses";
  const anos = Math.floor(dias / 365), meses = Math.round((dias - anos * 365) / 30.4);
  return anos + (anos === 1 ? " ano" : " anos") + (meses ? " e " + meses + (meses === 1 ? " mês" : " meses") : "");
}

/* Só entram no histórico (tela e exportação) as mudanças nos DADOS da família e os marcos.
   Ações como imprimir/exportar/anexar e campos internos (ex.: tamanho dos anexos) ficam de fora. */
function histMudVisivel(m) { return !HIST_IGNORAR.has(String((m && m.k) || "").split("|")[0]); }
function histVisivel(e) {
  if (!e || e.tipo === "acao") return false;
  if (e.tipo === "manual") return true;
  return !!(e.nota || (e.mudancas || []).some(histMudVisivel));
}
function histH(paf) { return (paf.historico || []).filter(histVisivel); }

/* Junta as mudanças de uma mesma pessoa/situação numa só (ex.: um membro novo vira "Membro: NOME — incluído(a)"
   com seus dados, em vez de uma linha para cada campo). */
function histAgrupar(muds) {
  const itens = [], grupos = new Map();
  (muds || []).filter(histMudVisivel).forEach(m => {
    const partes = String(m.k || "").split("|");
    if (m.tipo === "valor" && partes.length >= 3 && partes[1] !== "+" && partes[1] !== "-") {
      const gk = partes.slice(0, -1).join("|");
      const cut = String(m.rotulo).lastIndexOf(" — ");
      const titulo = cut > -1 ? m.rotulo.slice(0, cut) : m.rotulo;
      let g = grupos.get(gk);
      if (!g) { g = { kind: "alterado", secao: m.secao, titulo, detalhes: [] }; grupos.set(gk, g); itens.push(g); }
      else if (!/ nº \d+$/.test(titulo)) g.titulo = titulo;
      g.detalhes.push({ campo: cut > -1 ? m.rotulo.slice(cut + 3) : m.rotulo, antes: m.antes, depois: m.depois });
      return;
    }
    itens.push({ kind: "campo", secao: m.secao, titulo: m.rotulo, m });
  });
  grupos.forEach(g => { if (g.detalhes.every(d => histVazio(d.antes))) g.kind = "incluido"; });
  return itens;
}

function histItemTexto(it) {
  if (it.kind === "campo") {
    const m = it.m;
    if (m.tipo === "valor") return { campo: m.rotulo, linhas: [`${histFmt(m.antes)} → ${histFmt(m.depois)}`] };
    if (m.tipo === "lista") { const d = histListaDelta(m); return { campo: m.rotulo, linhas: [...d.add.map(x => "+ " + x), ...d.rem.map(x => "− " + x)] }; }
    if (m.tipo === "linha+") return { campo: m.depois + " — incluído(a)", linhas: [] };
    return { campo: m.antes + " — removido(a)", linhas: [] };
  }
  if (it.kind === "incluido") return { campo: it.titulo + " — incluído(a)", linhas: it.detalhes.filter(d => !histVazio(d.depois) && d.campo !== "Nome").map(d => `${d.campo}: ${histFmt(d.depois)}`) };
  return { campo: it.titulo, linhas: it.detalhes.map(d => `${d.campo}: ${histFmt(d.antes)} → ${histFmt(d.depois)}`) };
}

function histItemHTML(it) {
  if (it.kind === "campo") return histMudancaHTML(it.m);
  const cab = `<span class="hist-campo">${escapeHtml(it.titulo)}</span>${it.kind === "incluido" ? '<span class="hist-chip add">incluído(a)</span>' : ""}`;
  const det = it.kind === "incluido"
    ? it.detalhes.filter(d => !histVazio(d.depois) && d.campo !== "Nome").map(d => `<span class="hist-det"><b>${escapeHtml(d.campo)}</b> ${escapeHtml(histFmt(d.depois))}</span>`).join("")
    : it.detalhes.map(d => `<span class="hist-det"><b>${escapeHtml(d.campo)}</b> <span class="hist-de-para"><span class="hist-antes">${escapeHtml(histFmt(d.antes))}</span><span class="hist-seta">→</span><span class="hist-depois">${escapeHtml(histFmt(d.depois))}</span></span></span>`).join("");
  return `<div class="hist-mud hist-mud-grupo">${cab}<div class="hist-dets">${det}</div></div>`;
}

const HIST_ABERTOS = new Map(); // id -> aberto (true/false); sem entrada = padrão
const HIST_UI = { view: "trajetoria", secao: "", periodo: "", tipo: "", busca: "", usuario: "", de: "", ate: "" };
try { Object.assign(HIST_UI, JSON.parse(sessionStorage.getItem("paif_hist_ui") || "{}")); } catch (e) { /* ignora */ }
function histSalvarUI() { try { sessionStorage.setItem("paif_hist_ui", JSON.stringify(HIST_UI)); } catch (e) { /* ignora */ } }

/* Texto do histórico (respeita seção, período, tipo e busca) para copiar ou baixar. */
function histTextoExportacao(paf) {
  const q = histNorm(HIST_UI.busca).trim();
  const blocos = [];
  histOrdenar(paf).forEach(({ e }) => {
    if (!histPeriodoOk(e.data)) return;
    const manual = e.tipo === "manual", acao = e.tipo === "acao";
    if (!histTipoUsuarioOk(e)) return;
    let muds = (e.mudancas || []).filter(histMudVisivel);
    if (HIST_UI.secao) { muds = muds.filter(m => m.secao === HIST_UI.secao); if (!muds.length) return; }
    const hora = histHora(e.atualizadoEm || e.criadoEm);
    const linhas = [(e.data ? fmtDateBR(e.data) : "sem data") + (hora ? " " + hora : "") + " — " + (manual ? histRotuloMarco(e) : histAgrupar(muds).length + (histAgrupar(muds).length === 1 ? " alteração" : " alterações")) + (e.usuario ? " (" + e.usuario + ")" : "")];
    histAgrupar(muds).forEach(it => { const t = histItemTexto(it); linhas.push("  • " + histSecaoLabel(it.secao) + " › " + t.campo + (t.linhas.length ? ": " + t.linhas.join("; ") : "")); });
    if (e.nota) linhas.push("  Anotação: " + e.nota);
    const txt = linhas.join("\n");
    if (q && !histNorm(txt).includes(q)) return;
    blocos.push(txt);
  });
  const cab = "Histórico de evolução — " + (paf.responsavel || "família sem nome") + "\nGerado em " + new Date().toLocaleDateString("pt-BR") + "\nDocumento com informação sigilosa (sigilo profissional / LGPD).\n";
  return cab + "\n" + (blocos.length ? blocos.join("\n\n") : "Nenhum registro para os filtros escolhidos.") + "\n";
}

/* Filtro de período (últimos N dias). Registros sem data ficam sempre visíveis. */
function histPeriodoOk(data) {
  const dias = Number(HIST_UI.periodo);
  if (!dias || !data) return true;
  const lim = new Date(); lim.setDate(lim.getDate() - dias);
  const p = n => String(n).padStart(2, "0");
  return data >= `${lim.getFullYear()}-${p(lim.getMonth() + 1)}-${p(lim.getDate())}`;
}
function histNomeUsuario(email) {
  const n = String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return n ? n.replace(/\b\p{L}/gu, c => c.toUpperCase()) : "Usuário não identificado";
}
// Um registro passa pelos filtros de tipo (alterações / marcos / ações) e de usuário?
function histTipoUsuarioOk(e) {
  if (HIST_UI.tipo) {
    const [t, sent] = HIST_UI.tipo.split(":");
    if (e.tipo !== t) return false;
    if (sent && histSentido(e) !== sent) return false;
  }
  if (HIST_UI.usuario && (e.usuario || "") !== HIST_UI.usuario) return false;
  return true;
}
function histNorm(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function histNomeMes(data) {
  const m = /^(\d{4})-(\d{2})/.exec(data || "");
  if (!m) return "Sem data";
  const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return nomes[Number(m[2]) - 1] + " de " + m[1];
}

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
  // Nuvem: cada registro é um documento próprio (sem o limite de 1 MB do PAF) — limite só por quantidade.
  if (typeof state !== "undefined" && state.mode === "cloud" && state.db) {
    if (h.length > 5000) h.splice(0, h.length - 5000);
    return;
  }
  if (h.length > 1000) h.splice(0, h.length - 1000);
  // O PAF inteiro vai num único documento do Firestore (limite de 1 MB):
  // se o histórico crescer demais, descarta os registros automáticos mais antigos.
  while (h.length > 20 && JSON.stringify(h).length > 600000) {
    let i = h.findIndex(e => e.tipo === "acao");
    if (i === -1) i = h.findIndex(e => e.tipo === "auto");
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

function histAdicionarMarco(paf, data, nota, sentido) {
  if (!Array.isArray(paf.historico)) paf.historico = [];
  const agora = new Date().toISOString();
  paf.historico.push({
    id: histId(), tipo: "manual", data: data || histHoje(), criadoEm: agora, atualizadoEm: agora,
    usuario: (state.currentUser && state.currentUser.email) || null, estrutural: true, nota, mudancas: [],
    sentido: HIST_SENTIDOS[sentido] ? sentido : "observacao"
  });
  histLimitar(paf);
}

/* Ações que não alteram campos do PAF (anexos, exportações, impressões, remoções no histórico).
   Ficam no mesmo histórico, com tipo "acao", para saber quem fez o quê e quando. */
function histAdicionarAcao(paf, acao, descricao) {
  return; // o histórico guarda só mudanças nos dados da família e marcos — ações (imprimir, exportar, anexar) não entram
  if (!paf) return;
  if (!Array.isArray(paf.historico)) paf.historico = [];
  const agora = new Date().toISOString();
  const usuario = (state.currentUser && state.currentUser.email) || null;
  const ult = paf.historico[paf.historico.length - 1];
  // evita duplicar o mesmo registro por clique duplo (menos de 1 min)
  if (ult && ult.tipo === "acao" && ult.acao === acao && ult.descricao === descricao && ult.usuario === usuario
      && Date.now() - new Date(ult.criadoEm).getTime() < 60000) return;
  paf.historico.push({ id: histId(), tipo: "acao", acao, descricao, data: histHoje(), criadoEm: agora, atualizadoEm: agora, usuario, estrutural: true, nota: "", mudancas: [] });
  histLimitar(paf);
}

// Registra a ação e grava o PAF sem mexer na data de "última atualização" (exportar não é editar).
function histRegistrarAcao(paf, acao, descricao) {
  // Imprimir/exportar não altera os dados da família: não entra no histórico e não precisa regravar o PAF.
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
    .filter(x => histVisivel(x.e))
    .sort((a, b) => (b.e.data || "").localeCompare(a.e.data || "") || (b.e.criadoEm || "").localeCompare(a.e.criadoEm || ""));
}

function histHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function histEstatisticas(paf) {
  const h = histH(paf);
  const datas = h.map(e => e.data).filter(Boolean).sort();
  const campos = new Set();
  h.forEach(e => (e.mudancas || []).filter(histMudVisivel).forEach(m => campos.add(m.k)));
  return {
    registros: h.length,
    campos: campos.size,
    primeira: datas[0] || "",
    ultima: datas[datas.length - 1] || "",
    marcos: h.filter(e => e.tipo === "manual").length,
    avancos: h.filter(e => histSentido(e) === "avanco").length,
    retrocessos: h.filter(e => histSentido(e) === "retrocesso").length,
    acoes: h.filter(e => e.tipo === "acao").length
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

// Visão geral do histórico: atividade por mês (alterações x marcos) e onde as alterações se concentram.
function histAtividadeMesesSVG(paf) {
  const h = histH(paf);
  const porMes = {};
  h.forEach(e => {
    const ym = (e.data || "").slice(0, 7);
    if (ym.length !== 7 || e.tipo === "acao") return;
    const o = porMes[ym] || (porMes[ym] = { alt: 0, marco: 0 });
    if (e.tipo === "manual") o.marco++; else o.alt += (e.mudancas || []).length || 1;
  });
  const chaves = Object.keys(porMes).sort();
  if (!chaves.length) return "";
  // preenche meses sem atividade entre o primeiro e o último, limitado aos 12 mais recentes
  const meses = [];
  let [y, m] = chaves[0].split("-").map(Number);
  const [yf, mf] = chaves[chaves.length - 1].split("-").map(Number);
  while ((y < yf || (y === yf && m <= mf)) && meses.length < 120) {
    meses.push(y + "-" + String(m).padStart(2, "0"));
    if (++m > 12) { m = 1; y++; }
  }
  const lista = meses.slice(-12).map(ym => ({ ym, ...(porMes[ym] || { alt: 0, marco: 0 }) }));
  if (lista.length < 2) return "";
  const eixo = eixoY(Math.max(...lista.map(v => v.alt + v.marco), 1));
  const colW = 44, barW = 22, padT = 20, chartH = 110, padB = 26, padL = margemEixoNum(eixo.topo), padR = 10;
  const width = padL + lista.length * colW + padR, height = chartH + padT + padB;
  const barras = lista.map((v, i) => {
    const xc = padL + i * colW + colW / 2, x = xc - barW / 2;
    const hAlt = Math.round(v.alt / eixo.topo * chartH), hMar = Math.round(v.marco / eixo.topo * chartH);
    const yAlt = padT + chartH - hAlt, yMar = yAlt - hMar;
    const mes = labelYmCurto(v.ym), tot = v.alt + v.marco;
    return `<g>
      ${hAlt ? `<rect x="${x}" y="${yAlt}" width="${barW}" height="${hAlt}" rx="${hMar ? 0 : 3}" fill="var(--accent, #2E7D6B)" class="evo-bar" tabindex="0"><title>${mes}: ${v.alt} alteraç${v.alt === 1 ? "ão" : "ões"}</title></rect>` : ""}
      ${hMar ? `<rect x="${x}" y="${yMar}" width="${barW}" height="${hMar}" rx="3" fill="var(--gold, #B98A34)" class="evo-bar" tabindex="0"><title>${mes}: ${v.marco} marco${v.marco === 1 ? "" : "s"} manua${v.marco === 1 ? "l" : "is"}</title></rect>` : ""}
      ${tot ? `<text x="${xc}" y="${padT + chartH - Math.round(tot / eixo.topo * chartH) - 4}" text-anchor="middle" class="chart-bar-num">${tot}</text>` : ""}
      <text x="${xc}" y="${padT + chartH + 16}" text-anchor="middle" class="chart-bar-mes">${mes}</text></g>`;
  }).join("");
  return `<div class="chart-legend-inline"><span><i style="background:var(--accent, #2E7D6B)"></i> Alterações</span><span><i style="background:var(--gold, #B98A34)"></i> Marcos manuais</span></div>`
    + svgGrafico(width, height, "hist-atividade-chart", "Atividade do histórico por mês", gradeEixoY(eixo, padL, width - padR, padT, chartH) + barras);
}

// Resumo da trajetória: há quanto tempo há registro, balanço dos marcos e o que mais mudou (inicial → atual).
function histTrajetoriaHTML(paf) {
  const h = histH(paf);
  if (!h.length) return "";
  const st = histEstatisticas(paf);
  const sint = histSinteseExportacao(paf).slice().sort((a, b) => b.n - a.n).slice(0, 4);
  const marcos = h.filter(e => e.tipo === "manual");
  if (!sint.length && !marcos.length) return "";
  const corta = (t, n) => { t = String(t == null ? "" : t); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  const ult = marcos.slice().sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.criadoEm || "").localeCompare(a.criadoEm || ""))[0];
  const balanco = marcos.length ? `<div class="hist-balanco" role="group" aria-label="Balanço dos marcos de evolução">
      <span class="hist-sent avanco">${HIST_SENTIDOS.avanco.icone} ${st.avancos} ${st.avancos === 1 ? "avanço" : "avanços"}</span>
      <span class="hist-sent retrocesso">${HIST_SENTIDOS.retrocesso.icone} ${st.retrocessos} ${st.retrocessos === 1 ? "retrocesso" : "retrocessos"}</span>
      <span class="hist-sent observacao">${HIST_SENTIDOS.observacao.icone} ${st.marcos - st.avancos - st.retrocessos} ${st.marcos - st.avancos - st.retrocessos === 1 ? "observação" : "observações"}</span>
    </div>` : "";
  const mudancas = sint.length ? `<ul class="hist-resumo-lista">${sint.map(r => `<li><span class="hist-campo">${escapeHtml(r.campo)}</span><span class="hist-de-para"><span class="hist-antes">${escapeHtml(corta(r.inicial, 60))}</span><span class="hist-seta">→</span><span class="hist-depois">${escapeHtml(corta(r.atual, 60))}</span></span><em>${r.n} ${r.n === 1 ? "alteração" : "alterações"}</em></li>`).join("")}</ul>` : "";
  const datasAtiv = h.filter(e => e.tipo !== "acao" && e.data).map(e => e.data).sort();
  const diasParado = datasAtiv.length ? Math.round((Date.now() - new Date(datasAtiv[datasAtiv.length - 1] + "T12:00:00").getTime()) / 86400000) : 0;
  const alerta = diasParado >= 90 ? `<p class="hist-alerta" role="status">Sem atualização do acompanhamento há ${diasParado >= 180 ? Math.round(diasParado / 30) + " meses" : diasParado + " dias"} (último registro em ${fmtDateBR(datasAtiv[datasAtiv.length - 1])}). Considere registrar um marco ou revisar o plano.</p>` : "";
  const ultimo = ult && ult.nota ? `<p class="hist-resumo-ult"><strong>Último marco</strong> (${ult.data ? fmtDateBR(ult.data) : "sem data"} · ${HIST_SENTIDOS[histSentido(ult)].label}): ${escapeHtml(corta(ult.nota, 220))}</p>` : "";
  return `<div class="hist-trajetoria">
    <strong class="hist-trajetoria-titulo">Resumo da trajetória</strong>
    <p class="hist-resumo-txt">${st.primeira ? `Histórico registrado desde <b>${fmtDateBR(st.primeira)}</b> (${escapeHtml(histDuracao(st.primeira))}), com ${st.registros} ${st.registros === 1 ? "registro" : "registros"}.` : `${st.registros} ${st.registros === 1 ? "registro" : "registros"} no histórico.`}</p>
    ${alerta}${balanco}${mudancas}${ultimo}
  </div>`;
}

// Valor de um campo numa data: último "depois" registrado até ela (ou o valor inicial, se nada mudou ainda).
// inclusivo=true  -> situação no fim do dia; false -> situação no início do dia.
function histValorEm(itens, data, inclusivo) {
  let v, achou = false;
  itens.forEach(it => { const d = it.data || ""; if (inclusivo ? d <= data : d < data) { v = it.m.depois; achou = true; } });
  return achou ? v : itens[0].m.antes;
}

// Compara a família entre duas datas: campos que mudaram e linhas incluídas/removidas no intervalo.
function histComparar(paf, de, ate, secaoFiltro) {
  const cron = (paf.historico || []).filter(e => e.tipo === "auto").slice()
    .sort((a, b) => (a.data || "").localeCompare(b.data || "") || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const grupos = new Map(), estrut = [];
  cron.forEach(e => (e.mudancas || []).filter(histMudVisivel).forEach(m => {
    if (secaoFiltro && m.secao !== secaoFiltro) return;
    if (m.tipo === "linha+" || m.tipo === "linha-") { if ((e.data || "") >= de && (e.data || "") <= ate) estrut.push({ data: e.data, m }); return; }
    if (!grupos.has(m.k)) grupos.set(m.k, { m, itens: [] });
    const g = grupos.get(m.k); g.m = m; g.itens.push({ data: e.data || "", m });
  }));
  const linhas = [];
  grupos.forEach(g => {
    const a = histValorEm(g.itens, de, false), b = histValorEm(g.itens, ate, true);
    const igual = g.m.tipo === "lista" ? histIgual([...(a || [])].sort(), [...(b || [])].sort()) : a === b;
    if (!igual) linhas.push({ m: g.m, a, b });
  });
  return { linhas, estrut };
}

function histCompararHTML(paf, secaoFiltro) {
  const st = histEstatisticas(paf);
  const de = HIST_UI.de || st.primeira || histHoje(), ate = HIST_UI.ate || histHoje();
  const [d1, d2] = de <= ate ? [de, ate] : [ate, de];
  const r = histComparar(paf, d1, d2, secaoFiltro);
  const itens = histAgrupar(r.linhas.map(x => ({ ...x.m, antes: x.a, depois: x.b }))), porSecao = {};
  itens.forEach(it => { (porSecao[it.secao] = porSecao[it.secao] || []).push(it); });
  const corpo = Object.keys(porSecao).map(sec => `<div class="hist-grupo"><div class="hist-grupo-titulo">${escapeHtml(histSecaoLabel(sec))}</div>${porSecao[sec].map(histItemHTML).join("")}</div>`).join("");
  const estrut = r.estrut.length ? `<div class="hist-grupo"><div class="hist-grupo-titulo">Itens incluídos ou removidos no período</div>${r.estrut.map(x => `<div class="hist-linha-tempo"><em>${x.data ? fmtDateBR(x.data) : "sem data"}</em>${histMudancaHTML(x.m)}</div>`).join("")}</div>` : "";
  return `<div class="hist-comparar">
    <div class="hist-comparar-barra">
      <div class="f"><label for="histCompDe">De</label><input type="date" id="histCompDe" value="${escapeHtml(d1)}"></div>
      <div class="f"><label for="histCompAte">Até</label><input type="date" id="histCompAte" value="${escapeHtml(d2)}"></div>
      <span class="hist-acoes">
        <button type="button" class="btn btn-ghost btn-sm" data-hist-comp="inicio">Desde o início</button>
        <button type="button" class="btn btn-ghost btn-sm" data-hist-comp="30">Últimos 30 dias</button>
        <button type="button" class="btn btn-ghost btn-sm" data-hist-comp="90">Últimos 90 dias</button>
      </span>
    </div>
    <p class="hint">Compara a situação da família no <b>início do dia ${fmtDateBR(d1)}</b> com a do <b>fim do dia ${fmtDateBR(d2)}</b>. Só aparecem os campos que mudaram.</p>
    ${corpo || estrut ? corpo + estrut : `<p class="hint">Nenhuma diferença registrada entre essas datas${secaoFiltro ? " nesta seção" : ""}.</p>`}
  </div>`;
}

function histVisaoGeralHTML(paf) {
  const h = histH(paf);
  if (h.length < 2) return "";
  const porSecao = {};
  h.forEach(e => (e.mudancas || []).filter(histMudVisivel).forEach(mu => { const l = histSecaoLabel(mu.secao); porSecao[l] = (porSecao[l] || 0) + 1; }));
  const atividade = histAtividadeMesesSVG(paf);
  const secoes = Object.keys(porSecao).length ? barrasHTML(porSecao, { top: 6 }) : "";
  if (!atividade && !secoes) return "";
  return `<div class="hist-visao">
    ${atividade ? `<div class="hist-visao-bloco"><strong>Atividade por mês</strong>${atividade}</div>` : ""}
    ${secoes ? `<div class="hist-visao-bloco"><strong>Onde a família mais mudou</strong>${secoes}</div>` : ""}
  </div>`;
}

function histPorCampoHTML(paf, secaoFiltro) {
  const cron = (paf.historico || [])
    .filter(e => e.tipo === "auto" && histPeriodoOk(e.data))
    .slice()
    .sort((a, b) => (a.data || "").localeCompare(b.data || "") || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const grupos = new Map();
  cron.forEach(e => (e.mudancas || []).filter(histMudVisivel).forEach(m => {
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
  let ultMes = null;
  const itens = ordenado.map(({ e, i }, pos) => {
    if (!histPeriodoOk(e.data)) return "";
    if (!histTipoUsuarioOk(e)) return "";
    let muds = (e.mudancas || []).filter(histMudVisivel);
    if (secaoFiltro) {
      muds = muds.filter(m => m.secao === secaoFiltro);
      if (!muds.length) return "";
    }
    const badge = dateBadgeParts(e.data);
    const manual = e.tipo === "manual", acao = e.tipo === "acao";
    const sent = histSentido(e);
    const itensAg = histAgrupar(muds), grupos = {};
    itensAg.forEach(it => { (grupos[it.secao] = grupos[it.secao] || []).push(it); });
    const corpo = Object.keys(grupos).map(s => `
      <div class="hist-grupo"><div class="hist-grupo-titulo">${escapeHtml(histSecaoLabel(s))}</div>${grupos[s].map(histItemHTML).join("")}</div>`).join("");
    const quem = [e.usuario ? `<span class="hist-usuario" title="${escapeHtml(e.usuario)}">${escapeHtml(histNomeUsuario(e.usuario))}</span>` : "", histHora(e.atualizadoEm || e.criadoEm) ? `<span>${escapeHtml(histHora(e.atualizadoEm || e.criadoEm))}</span>` : ""].filter(Boolean).join(" · ");
    const anterior = ordenado[pos + 1] && ordenado[pos + 1].e.data;
    const dias = anterior && e.data ? Math.round((new Date(e.data + "T12:00:00") - new Date(anterior + "T12:00:00")) / 86400000) : 0;
    const gap = dias > 0 ? `<span class="hist-gap" title="Tempo desde o registro anterior (${fmtDateBR(anterior)})">+${dias >= 60 ? Math.round(dias / 30) + " meses" : dias + (dias === 1 ? " dia" : " dias")}</span>` : "";
    const mesKey = (e.data || "").slice(0, 7);
    const cab = mesKey !== ultMes ? `<div class="hist-mes">${escapeHtml(histNomeMes(e.data))}</div>` : "";
    ultMes = mesKey;
    return cab + `
    <div class="timeline-item hist-item ${manual ? "manual" : acao ? "acao" : ""}" style="--tipo-cor:${manual ? (sent === "avanco" ? "var(--accent)" : sent === "retrocesso" ? "var(--danger)" : "var(--gold)") : acao ? "var(--slate, #52667C)" : "var(--accent)"}">
      <div class="timeline-date-badge"><span class="dia">${escapeHtml(badge.dia)}</span><span class="mes">${escapeHtml(badge.mes)}</span></div>
      <div class="timeline-card">
        <button class="row-del" data-hist-del="${escapeHtml(e.id)}" title="Remover este registro do histórico" aria-label="Remover este registro do histórico">${uiIconSvg("close", 12)}</button>
        <div class="hist-topo">
          <span class="hist-tipo ${manual ? "manual sentido-" + sent : acao ? "acao" : ""}">${manual ? HIST_SENTIDOS[sent].icone + " " + HIST_SENTIDOS[sent].label : acao ? "Ação" : (itensAg.length ? itensAg.length + (itensAg.length === 1 ? " alteração" : " alterações") : "Anotação")}</span>
          <span class="hist-quem">${quem}</span>${gap}
        </div>
        ${acao ? `<p class="hist-acao-desc">${escapeHtml(e.descricao || e.acao || "")}</p>` : corpo}
        ${acao ? "" : e.nota ? `<p class="hist-nota-previa">${escapeHtml(e.nota)}</p>` : ""}
        ${acao ? "" : `<details class="hist-editar" data-hist-det="${escapeHtml(e.id)}"${(HIST_ABERTOS.has(e.id) ? HIST_ABERTOS.get(e.id) : (manual && !e.nota)) ? " open" : ""}>
        <summary>${e.nota ? "Editar data e anotação" : "Adicionar anotação ou corrigir a data"}</summary>
        <div class="timeline-row hist-edit">
          <div class="f"><label>Data da evolução</label><input type="date" data-field="historico.${i}.data" value="${escapeHtml(e.data)}"></div>
          ${manual ? `<div class="f"><label>Sentido da evolução</label><select data-field="historico.${i}.sentido">${Object.keys(HIST_SENTIDOS).map(k => `<option value="${k}" ${sent === k ? "selected" : ""}>${HIST_SENTIDOS[k].label}</option>`).join("")}</select></div>` : ""}
          <div class="f" style="grid-column: span 2"><label>${manual ? "Anotação técnica" : "Anotação técnica sobre esta evolução (opcional)"}</label><textarea data-field="historico.${i}.nota" rows="${manual ? 3 : 2}" placeholder="${manual ? "Descreva a evolução observada na família..." : "Ex.: motivo da mudança, contexto, quem informou..."}">${escapeHtml(e.nota || "")}</textarea></div>
        </div>
        </details>`}
      </div>
    </div>`;
  }).join("");
  return itens.trim() ? `<div class="timeline">${itens}</div>` : `<p class="hint">Nenhum registro${secaoFiltro ? " nesta seção" : ""} ainda.</p>`;
}

function historicoSectionHTML(paf) {
  const st = histEstatisticas(paf);
  const secoes = [...new Set([
    ...histH(paf).flatMap(e => (e.mudancas || []).filter(histMudVisivel).map(m => m.secao)),
    ...DIARIO_CAMPOS.filter(k => ((paf.diario || {})[k] || []).some(e => e.texto)).map(k => histSecaoId(k))
  ])];
  if (HIST_UI.secao && !secoes.includes(HIST_UI.secao)) HIST_UI.secao = "";
  const usuarios = [...new Set(histH(paf).map(e => e.usuario).filter(Boolean))].sort();
  if (HIST_UI.usuario && !usuarios.includes(HIST_UI.usuario)) HIST_UI.usuario = "";
  const carregando = typeof histCarregado === "function" && !histCarregado(paf);
  const vazio = !st.registros && !carregando;
  return `
  <div class="section-card">
    ${sectionHeader("15", "Histórico de Evolução", "Cada alteração feita neste PAF fica registrada com data, para acompanhar a evolução da família ao longo do tempo.")}
    ${notaTecnica("O acompanhamento do PAIF é um processo continuado, e o registro técnico deve permitir compreender a trajetória da família (Trilha da Primeira Infância, MDS, 2026). Por isso, sempre que você altera uma informação — renda, moradia, situação de saúde, escolaridade, vulnerabilidades, metas, etc. — o app guarda o valor anterior e o novo, com a data. Se a mudança aconteceu em outra data, corrija a \"Data da evolução\" no registro. Use o marco manual para anotar avanços e retrocessos que não aparecem em nenhum campo.")}
    <div class="hist-stats">
      <div class="stat-box"><span class="stat-num">${st.registros}</span><span class="stat-label">Registros</span></div>
      <div class="stat-box"><span class="stat-num">${st.campos}</span><span class="stat-label">Campos alterados</span></div>
      <div class="stat-box"><span class="stat-num">${st.marcos}</span><span class="stat-label">Marcos manuais</span></div>
      <div class="stat-box"><span class="stat-num" style="font-size:14px">${st.primeira ? escapeHtml(histDuracao(st.primeira)) : "—"}</span><span class="stat-label">Tempo de histórico</span></div>
      <div class="stat-box"><span class="stat-num" style="font-size:14px">${st.ultima ? fmtDateBR(st.ultima) : "—"}</span><span class="stat-label">Última evolução</span></div>
    </div>
    ${histTrajetoriaHTML(paf)}
    ${histVisaoGeralHTML(paf)}
    <div class="hist-novo">
      <h3>Registrar marco de evolução</h3>
      <div class="timeline-row">
        <div class="f"><label>Data</label><input type="date" id="histNovaData" value="${histHoje()}"></div>
        <div class="f"><label for="histNovoSentido">Sentido</label><select id="histNovoSentido">${Object.keys(HIST_SENTIDOS).map(k => `<option value="${k}">${HIST_SENTIDOS[k].icone} ${HIST_SENTIDOS[k].label}</option>`).join("")}</select></div>
        <div class="f" style="grid-column: span 2"><label>O que mudou ou foi observado</label><textarea id="histNovaNota" rows="2" placeholder="Ex.: família passou a frequentar o SCFV; responsável conseguiu emprego formal; vínculo com a escola retomado..."></textarea></div>
      </div>
      <button class="btn btn-primary btn-sm" id="histAddBtn" style="margin-top:10px">${uiIconSvg("plus", 13)} Registrar marco</button>
    </div>
  </div>

  <div class="section-card">
    <div class="hist-barra">
      <div class="status-picker">
        <button class="status-opt ${HIST_UI.view === "trajetoria" ? "selected andamento" : ""}" data-hist-view="trajetoria">Trajetória completa</button>
        <button class="status-opt ${HIST_UI.view === "linha" ? "selected andamento" : ""}" data-hist-view="linha">Alterações de dados</button>
        <button class="status-opt ${HIST_UI.view === "campo" ? "selected andamento" : ""}" data-hist-view="campo">Por campo</button>
        <button class="status-opt ${HIST_UI.view === "comparar" ? "selected andamento" : ""}" data-hist-view="comparar">Comparar datas</button>
        <button class="status-opt ${HIST_UI.view === "diario" ? "selected andamento" : ""}" data-hist-view="diario">Anotações por dia</button>
      </div>
      <div class="f hist-filtro"><label for="histFiltroSecao">Seção</label>
        <select id="histFiltroSecao"><option value="">Todas</option>${secoes.map(s => `<option value="${s}" ${HIST_UI.secao === s ? "selected" : ""}>${escapeHtml(histSecaoLabel(s))}</option>`).join("")}</select>
      </div>
    </div>
    ${secoes.length > 1 ? `<div class="hist-chips" role="group" aria-label="Filtrar por seção">${secoes.map(sec => {
      const n = histH(paf).reduce((a, e) => a + histAgrupar((e.mudancas || []).filter(m => m.secao === sec)).length, 0);
      return `<button type="button" class="hist-chip-sec${HIST_UI.secao === sec ? " on" : ""}" data-hist-chip="${sec}" aria-pressed="${HIST_UI.secao === sec}">${escapeHtml(histSecaoLabel(sec))}${n ? ` <em>${n}</em>` : ""}</button>`;
    }).join("")}</div>` : ""}
    <div class="hist-filtros${HIST_UI.view === "comparar" ? " so-comparar" : ""}">
      <div class="f hist-busca"><label for="histBusca">Buscar no histórico</label><input type="search" id="histBusca" placeholder="Palavra, nome, valor…" value="${escapeHtml(HIST_UI.busca)}" autocomplete="off"></div>
      <div class="f"><label for="histPeriodo">Período</label>
        <select id="histPeriodo">${[["", "Todo o período"], ["7", "Últimos 7 dias"], ["30", "Últimos 30 dias"], ["90", "Últimos 90 dias"], ["365", "Último ano"]].map(([v, l]) => `<option value="${v}" ${HIST_UI.periodo === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      ${HIST_UI.view === "linha" ? `<div class="f"><label for="histTipo">Tipo de registro</label>
        <select id="histTipo">${[["", "Todos"], ["auto", "Só alterações"], ["manual", "Só marcos manuais"], ["manual:avanco", "Só avanços"], ["manual:retrocesso", "Só retrocessos"]].map(([v, l]) => `<option value="${v}" ${HIST_UI.tipo === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>` : ""}
      ${HIST_UI.view === "linha" && usuarios.length > 1 ? `<div class="f"><label for="histUsuario">Usuário</label>
        <select id="histUsuario"><option value="">Todos</option>${usuarios.map(u => `<option value="${escapeHtml(u)}" ${HIST_UI.usuario === u ? "selected" : ""}>${escapeHtml(histNomeUsuario(u))}</option>`).join("")}</select></div>` : ""}
      ${HIST_UI.view === "linha" ? `<span class="hist-acoes"><button type="button" class="btn btn-ghost btn-sm" data-hist-todos="abrir" title="Abrir todos os campos de anotação">Abrir anotações</button><button type="button" class="btn btn-ghost btn-sm" data-hist-todos="fechar">Recolher</button><button type="button" class="btn btn-ghost btn-sm" data-hist-exp="copiar">Copiar</button><button type="button" class="btn btn-ghost btn-sm" data-hist-exp="txt">Baixar (.txt)</button></span>` : ""}
      ${(HIST_UI.secao || HIST_UI.periodo || HIST_UI.tipo || HIST_UI.busca || HIST_UI.usuario) ? `<button type="button" class="btn btn-ghost btn-sm" id="histLimpar">Limpar filtros</button>` : ""}
      <span class="hist-contagem" id="histContagem" aria-live="polite"></span>
    </div>
    <div id="histConteudo">${carregando && !st.registros && HIST_UI.view !== "trajetoria" ? `<p class="hint" style="margin:10px 0 0">Carregando o histórico…</p>` : HIST_UI.view === "trajetoria" ? histTrajetoriaMesesHTML(paf, { secao: HIST_UI.secao, periodo: true }) : HIST_UI.view === "comparar" ? histCompararHTML(paf, HIST_UI.secao) : HIST_UI.view === "diario" ? histDiarioHTML(paf, HIST_UI.secao) : vazio ? `<p class="hint" style="margin:10px 0 0">O histórico começa a ser registrado a partir da próxima alteração feita neste PAF.</p>` : (HIST_UI.view === "campo" ? histPorCampoHTML(paf, HIST_UI.secao) : histLinhaTempoHTML(paf, HIST_UI.secao))}</div>
  </div>`;
}

function attachHistoricoHandlers(container) {
  container.querySelectorAll("[data-hist-view]").forEach(b => b.addEventListener("click", () => {
    HIST_UI.view = b.dataset.histView;
    histSalvarUI();
    renderApp();
  }));
  const filtro = container.querySelector("#histFiltroSecao");
  if (filtro) filtro.addEventListener("change", () => { HIST_UI.secao = filtro.value; histSalvarUI(); renderApp(); });

  const limpar = container.querySelector("#histLimpar");
  if (limpar) limpar.addEventListener("click", () => { HIST_UI.secao = ""; HIST_UI.periodo = ""; HIST_UI.tipo = ""; HIST_UI.busca = ""; HIST_UI.usuario = ""; histSalvarUI(); renderApp(); });
  container.querySelectorAll("[data-hist-exp]").forEach(b => b.addEventListener("click", () => {
    const txt = histTextoExportacao(state.current);
    if (b.dataset.histExp === "copiar") {
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
        () => toast("Histórico copiado."), () => toast("Não foi possível copiar — use Baixar (.txt)."));
    } else {
      const nome = String(state.current.responsavel || "familia").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_").slice(0, 40) || "familia";
      baixarArquivoTexto("historico_" + nome + ".txt", txt, "text/plain;charset=utf-8");
    }
  }));
  const cDe = container.querySelector("#histCompDe"), cAte = container.querySelector("#histCompAte");
  if (cDe) cDe.addEventListener("change", () => { HIST_UI.de = cDe.value; histSalvarUI(); renderApp(); });
  if (cAte) cAte.addEventListener("change", () => { HIST_UI.ate = cAte.value; histSalvarUI(); renderApp(); });
  container.querySelectorAll("[data-hist-comp]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.histComp;
    if (v === "inicio") { HIST_UI.de = ""; HIST_UI.ate = ""; }
    else { const d = new Date(); d.setDate(d.getDate() - Number(v)); const z = n => String(n).padStart(2, "0"); HIST_UI.de = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; HIST_UI.ate = ""; }
    histSalvarUI(); renderApp();
  }));
  const per = container.querySelector("#histPeriodo");
  if (per) per.addEventListener("change", () => { HIST_UI.periodo = per.value; histSalvarUI(); renderApp(); });
  const usu = container.querySelector("#histUsuario");
  if (usu) usu.addEventListener("change", () => { HIST_UI.usuario = usu.value; histSalvarUI(); renderApp(); });
  const tip = container.querySelector("#histTipo");
  if (tip) tip.addEventListener("change", () => { HIST_UI.tipo = tip.value; histSalvarUI(); renderApp(); });

  // Busca de texto: filtra na própria tela (sem redesenhar, para não perder o foco ao digitar)
  const busca = container.querySelector("#histBusca");
  const conteudo = container.querySelector("#histConteudo");
  const aplicarBusca = () => {
    if (!conteudo) return;
    const q = histNorm(HIST_UI.busca).trim();
    const cartoes = Array.from(conteudo.querySelectorAll(".hist-item, .hist-campo-card, .hist-diario-item"));
    let vis = 0;
    cartoes.forEach(c => {
      if (!c.dataset.histTxt) c.dataset.histTxt = histNorm(c.textContent + " " + Array.from(c.querySelectorAll("textarea, input")).map(x => x.value).join(" "));
      const ok = !q || c.dataset.histTxt.includes(q);
      c.hidden = !ok;
      if (ok) vis++;
    });
    conteudo.querySelectorAll(".hist-mes").forEach(h => {
      let n = h.nextElementSibling, algum = false;
      while (n && !n.classList.contains("hist-mes")) { if (n.classList.contains("hist-item") && !n.hidden) algum = true; n = n.nextElementSibling; }
      h.hidden = !algum;
    });
    const ct = container.querySelector("#histContagem");
    if (ct) ct.textContent = cartoes.length ? (q ? vis + " de " + cartoes.length + " registros" : cartoes.length + (cartoes.length === 1 ? " registro" : " registros")) : "";
    if (window.CSS && CSS.highlights && typeof Highlight !== "undefined") {
      CSS.highlights.delete("hist-busca");
      if (q) {
        const ranges = [];
        conteudo.querySelectorAll(".hist-item:not([hidden]), .hist-campo-card:not([hidden]), .hist-diario-item:not([hidden])").forEach(c => {
          const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            const t = histNorm(n.nodeValue);
            for (let i = t.indexOf(q); i !== -1 && ranges.length < 500; i = t.indexOf(q, i + q.length)) {
              const r = new Range(); r.setStart(n, i); r.setEnd(n, Math.min(i + q.length, n.nodeValue.length)); ranges.push(r);
            }
          }
        });
        if (ranges.length) CSS.highlights.set("hist-busca", new Highlight(...ranges));
      }
    }
    let vazio = conteudo.querySelector(".hist-busca-vazio");
    if (q && cartoes.length && !vis) {
      if (!vazio) { vazio = document.createElement("p"); vazio.className = "hint hist-busca-vazio"; conteudo.appendChild(vazio); }
      vazio.textContent = "Nada encontrado para essa busca.";
    } else if (vazio) vazio.remove();
  };
  if (busca) busca.addEventListener("input", () => { HIST_UI.busca = busca.value; histSalvarUI(); aplicarBusca(); });
  aplicarBusca();

  container.querySelectorAll("details[data-hist-det]").forEach(d => d.addEventListener("toggle", () => {
    HIST_ABERTOS.set(d.dataset.histDet, d.open);
  }));

  // Chips de seção (atalho para o filtro "Seção")
  container.querySelectorAll("[data-hist-chip]").forEach(b => b.addEventListener("click", () => {
    HIST_UI.secao = b.dataset.histChip === HIST_UI.secao ? "" : b.dataset.histChip;
    histSalvarUI(); renderApp();
  }));

  // Expandir/recolher todas as anotações
  container.querySelectorAll("[data-hist-todos]").forEach(b => b.addEventListener("click", () => {
    const abrir = b.dataset.histTodos === "abrir";
    container.querySelectorAll("details[data-hist-det]").forEach(d => { d.open = abrir; });
  }));

  const add = container.querySelector("#histAddBtn");
  if (add) add.addEventListener("click", () => {
    const nota = (container.querySelector("#histNovaNota").value || "").trim();
    const data = container.querySelector("#histNovaData").value || histHoje();
    if (!nota) { toast("Descreva o marco de evolução antes de registrar."); return; }
    const selSent = container.querySelector("#histNovoSentido");
    histAdicionarMarco(state.current, data, nota, selSent ? selSent.value : "observacao");
    savePAF(state.current, { silent: true });
    renderApp();
    toast("Marco de evolução registrado.");
  });

  container.querySelectorAll("[data-hist-del]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.histDel;
    confirmModal("Remover este registro do histórico?", "O registro de evolução será apagado definitivamente. O valor atual do campo no PAF não é alterado.", () => {
      const removido = (state.current.historico || []).find(e => e.id === id);
      state.current.historico = (state.current.historico || []).filter(e => e.id !== id);
      if (removido) {
        const resumo = removido.tipo === "manual" ? "marco de evolução" : removido.tipo === "acao" ? "ação (" + (removido.descricao || removido.acao) + ")" : (removido.mudancas || []).length + " alteração(ões)";
        histAdicionarAcao(state.current, "historico_removido", "Removeu do histórico um registro de " + (removido.data ? fmtDateBR(removido.data) : "data não informada") + ": " + resumo);
      }
      savePAF(state.current, { silent: true });
      renderApp();
    });
  }));
}

/* ---------------------------- Exportação (PDF / Word) ---------------------------- */

function histLinhasExportacao(paf, max) {
  const linhas = [];
  histOrdenar(paf).forEach(({ e }) => {
    if (e.tipo === "manual") linhas.push({ data: e.data, secao: "", campo: histRotuloMarco(e), linhas: e.nota ? [e.nota] : [] });
    histAgrupar(e.mudancas).forEach(it => { const t = histItemTexto(it); linhas.push({ data: e.data, secao: histSecaoLabel(it.secao), campo: t.campo, linhas: t.linhas }); });
    if (e.tipo === "auto" && e.nota) linhas.push({ data: e.data, secao: "", campo: "Anotação técnica", linhas: [e.nota] });
  });
  return linhas.slice(0, max || 300);
}

const histLinhasHTML = (arr) => arr.map(escapeHtml).join("<br>");

// Registro cronológico: a data aparece só na primeira linha de cada dia; o campo traz a seção em cinza.
function histLinhasTabelaHTML(paf, classeDetalhe) {
  let dataAnt = null;
  return histLinhasExportacao(paf).map(r => {
    const mostra = r.data !== dataAnt; dataAnt = r.data;
    return `<tr><td style="vertical-align:top;white-space:nowrap">${mostra ? fmtDateBR(r.data) : ""}</td><td style="vertical-align:top"><strong>${escapeHtml(r.campo)}</strong>${r.secao && r.secao !== r.campo ? `<br><span style="color:#667788;font-size:90%">${escapeHtml(r.secao)}</span>` : ""}</td><td${classeDetalhe ? ` class="${classeDetalhe}"` : ""} style="vertical-align:top">${histLinhasHTML(r.linhas)}</td></tr>`;
  }).join("");
}

// Síntese para impressão: situação inicial x atual, agrupada por seção. Pessoas/situações viram uma linha só.
function histSinteseExportacao(paf) {
  const cron = histH(paf).filter(e => e.tipo === "auto").slice()
    .sort((a, b) => (a.data || "").localeCompare(b.data || "") || (a.criadoEm || "").localeCompare(b.criadoEm || ""));
  const simples = new Map(), ents = new Map(), extras = [];
  const ord = a => (Array.isArray(a) ? [...a].sort() : a);
  cron.forEach(e => (e.mudancas || []).filter(m => histMudVisivel(m) && !HIST_EXCLUI_MUDANCA.test(String(m.k || ''))).forEach(m => {
    const partes = String(m.k || "").split("|");
    if (m.tipo === "valor" && partes.length >= 3 && partes[1] !== "+" && partes[1] !== "-") {
      const gk = partes.slice(0, -1).join("|"), f = partes[partes.length - 1];
      const cut = String(m.rotulo).lastIndexOf(" — ");
      const titulo = cut > -1 ? m.rotulo.slice(0, cut) : m.rotulo;
      if (!ents.has(gk)) ents.set(gk, { secao: m.secao, titulo, campos: new Map(), d1: e.data, d2: e.data, n: 0 });
      const g = ents.get(gk);
      if (!/ nº \d+$/.test(titulo)) g.titulo = titulo;
      if (!g.campos.has(f)) g.campos.set(f, { rotulo: cut > -1 ? m.rotulo.slice(cut + 3) : m.rotulo, ini: m.antes, fim: m.depois });
      g.campos.get(f).fim = m.depois;
      g.d2 = e.data; g.n++;
    } else if (m.tipo === "valor" || m.tipo === "lista") {
      if (!simples.has(m.k)) simples.set(m.k, { secao: m.secao, rotulo: m.rotulo, tipo: m.tipo, ini: m.antes, fim: m.depois, d1: e.data, d2: e.data, n: 0 });
      const g = simples.get(m.k); g.rotulo = m.rotulo; g.fim = m.depois; g.d2 = e.data; g.n++;
    } else {
      extras.push({ secao: m.secao, tipo: m.tipo, texto: m.tipo === "linha+" ? m.depois : m.antes, data: e.data });
    }
  }));
  const per = (a, b) => (a === b ? fmtDateBR(a) : `${fmtDateBR(a)} a ${fmtDateBR(b)}`);
  const rows = [];
  simples.forEach(g => {
    if (histIgual(ord(g.ini), ord(g.fim))) return;
    if (g.tipo === "lista") {
      const a = new Set(g.ini || []), b = new Set(g.fim || []);
      rows.push({ secao: g.secao, campo: g.rotulo, d1: g.d1,
        inicial: (g.ini || []).length ? g.ini.map(x => "• " + x) : ["(vazio)"],
        atual: [...(g.fim || []).map(x => a.has(x) ? "• " + x : "+ " + x + " (novo)"), ...(g.ini || []).filter(x => !b.has(x)).map(x => "− " + x + " (removido)")],
        periodo: per(g.d1, g.d2), n: g.n });
    } else {
      rows.push({ secao: g.secao, campo: g.rotulo, d1: g.d1, inicial: [histFmt(g.ini)], atual: [histFmt(g.fim)], periodo: per(g.d1, g.d2), n: g.n });
    }
  });
  const titulos = new Set();
  ents.forEach(g => {
    const mud = [...g.campos.values()].filter(c => !histIgual(c.ini, c.fim));
    if (!mud.length) return;
    titulos.add(g.titulo);
    const nova = mud.every(c => histVazio(c.ini));
    rows.push({ secao: g.secao, campo: g.titulo, d1: g.d1,
      inicial: nova ? ["Não constava"] : mud.map(c => `${c.rotulo}: ${histFmt(c.ini)}`),
      atual: nova ? mud.filter(c => !histVazio(c.fim) && c.rotulo !== "Nome").map(c => `${c.rotulo}: ${histFmt(c.fim)}`) : mud.map(c => `${c.rotulo}: ${histFmt(c.fim)}`),
      periodo: per(g.d1, g.d2), n: g.n });
  });
  extras.forEach(x => {
    if (x.tipo === "linha+" && titulos.has(x.texto)) return;
    rows.push({ secao: x.secao, campo: x.texto, d1: x.data, inicial: [x.tipo === "linha+" ? "Não constava" : "Constava no plano"], atual: [x.tipo === "linha+" ? "Incluído(a)" : "Removido(a)"], periodo: fmtDateBR(x.data), n: 1 });
  });
  return rows.sort((a, b) => histSecaoLabel(a.secao).localeCompare(histSecaoLabel(b.secao)) || (a.d1 || "").localeCompare(b.d1 || ""));
}

function histSinteseLinhasHTML(sint, estiloCelula) {
  let secAnt = null;
  return sint.map(r => {
    const nSec = sint.filter(x => x.secao === r.secao).length;
    const cab = r.secao !== secAnt ? `<tr><td colspan="5" style="background:#E8EDF3;font-weight:bold;color:#1F3A5F">${escapeHtml(histSecaoLabel(r.secao))} <span style="font-weight:normal;color:#52667C">· ${nSec} ${nSec === 1 ? "alteração" : "alterações"}</span></td></tr>` : "";
    secAnt = r.secao;
    return cab + `<tr><td style="vertical-align:top"><strong>${escapeHtml(r.campo)}</strong></td><td style="vertical-align:top">${histLinhasHTML(r.inicial)}</td><td style="vertical-align:top">${histLinhasHTML(r.atual)}</td><td style="vertical-align:top;white-space:nowrap">${r.periodo}</td><td style="text-align:center;vertical-align:top">${r.n}</td></tr>`;
  }).join("");
}

// Marcos do acompanhamento (impressão): os pontos de virada em ordem cronológica, com o tempo decorrido desde o início.
function histMarcosPdfHTML(paf) {
  const E = escapeHtml;
  const iso = d => (d && /^\d{4}-\d{2}-\d{2}/.test(String(d))) ? String(d).slice(0, 10) : "";
  const ms = [];
  const add = (data, rotulo, texto, cor, icone) => { const d = iso(data); if (d) ms.push({ data: d, rotulo, texto: texto || "", cor, icone: icone || "●" }); };
  const inicio = iso(paf.dataInicial) || iso(paf.createdAt);
  add(inicio, "Início do acompanhamento", paf.periodicidade ? "Periodicidade combinada: " + paf.periodicidade : "", "#1F3A5F", "◆");
  const ats = (paf.atendimentos || []).filter(a => iso(a.data)).sort((a, b) => a.data.localeCompare(b.data));
  if (ats.length) {
    add(ats[0].data, "Primeiro atendimento", ats[0].tipo || "", "#2E7D6B");
    if (ats.length > 1) add(ats[ats.length - 1].data, "Atendimento mais recente", ats[ats.length - 1].tipo || "", "#2E7D6B");
  }
  histH(paf).filter(e => e.tipo === "manual").forEach(e => {
    const s = histSentido(e);
    add(e.data, "Marco de evolução · " + HIST_SENTIDOS[s].label, (e.nota || "").trim().slice(0, 260), s === "avanco" ? "#2E7D6B" : s === "retrocesso" ? "#B5473F" : "#B98A34", HIST_SENTIDOS[s].icone);
  });
  const notasMeta = [];
  (paf.metas || []).forEach(m => (Array.isArray(m.anotacoes) ? m.anotacoes : []).forEach(n => { if ((n.texto || "").trim() && iso(n.data)) notasMeta.push({ data: iso(n.data), meta: m.meta || "" }); }));
  notasMeta.sort((a, b) => a.data.localeCompare(b.data));
  if (notasMeta.length) add(notasMeta[0].data, "Primeiro resultado de meta registrado", notasMeta[0].meta, "#B98A34");
  const encs = (paf.encaminhamentosForm || []).filter(e => iso(e.data)).sort((a, b) => a.data.localeCompare(b.data));
  if (encs.length) add(encs[0].data, "Primeiro encaminhamento à rede", [encs[0].area, encs[0].orgaoDestino].filter(Boolean).join(" · "), "#B5473F");
  const bens = (paf.beneficiosEventuaisForm || []).filter(b => iso(b.data)).sort((a, b) => a.data.localeCompare(b.data));
  if (bens.length) add(bens[0].data, "Primeiro benefício eventual", bens[0].tipo || "", "#6B5B95");
  if (iso(paf.encerramentoData)) add(paf.encerramentoData, "Encerramento do acompanhamento", (typeof ENCERRAMENTO_MOTIVOS !== "undefined" && (ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo) || {}).label) || "", "#52667C", "■");
  if (ms.length < 2) return `<p class="muted">Ainda não há marcos suficientes para montar a linha de evolução. Registre atendimentos e marcos de evolução para que apareçam aqui.</p>`;
  ms.sort((a, b) => a.data.localeCompare(b.data));
  const t0 = inicio ? new Date(inicio + "T12:00:00").getTime() : null;
  const apos = d => {
    if (t0 == null) return "";
    const n = Math.round((new Date(d + "T12:00:00").getTime() - t0) / 86400000);
    if (n <= 0) return "";
    return n < 60 ? n + (n === 1 ? " dia" : " dias") + " após o início" : Math.round(n / 30.4) + " meses após o início";
  };
  return `<div class="marcos-lista">${ms.map(m => `
    <div class="marco-item" style="--c:${m.cor}">
      <span class="marco-ponto">${m.icone}</span>
      <div class="marco-corpo">
        <div class="marco-topo"><b>${E(m.rotulo)}</b><span>${fmtDateBR(m.data)}${apos(m.data) ? ` · <em>${apos(m.data)}</em>` : ""}</span></div>
        ${m.texto ? `<p>${E(m.texto)}</p>` : ""}
      </div>
    </div>`).join("")}</div>`;
}

function historicoPdfTrajetoriaHTML(paf) {
  return `<h2>Marcos do acompanhamento <small>(os pontos de virada, em ordem)</small></h2>
      ${histMarcosPdfHTML(paf)}
      <h2>Trajetória do acompanhamento <small>(tudo o que foi registrado, mês a mês)</small></h2>
      ${histTrajetoriaMesesHTML(paf, { ordem: "asc", pdf: true })}`;
}

function historicoPdfHTML(paf) {
  const sint = histSinteseExportacao(paf);
  if (!sint.length) return `
      <h2>Situação inicial × situação atual</h2>
      <p class="muted">Nenhuma alteração nos dados da família foi registrada no histórico desde o início do acompanhamento.</p>`;
  const porSecao = {};
  sint.forEach(r => { const l = histSecaoLabel(r.secao); porSecao[l] = (porSecao[l] || 0) + 1; });
  const chips = Object.keys(porSecao).map(l => `<span class="tag">${escapeHtml(l)} · ${porSecao[l]}</span>`).join("");
  return `
      <h2>Situação inicial × situação atual</h2>
      <p class="hist-intro"><strong>Como ler:</strong> compara o que constava quando a ficha começou a ser registrada com o que consta hoje. Aparecem apenas os dados que mudaram durante o acompanhamento, agrupados por seção.</p>
      <p class="hist-intro"><strong>${sint.length}</strong> ${sint.length === 1 ? "dado mudou" : "dados mudaram"} em <strong>${Object.keys(porSecao).length}</strong> ${Object.keys(porSecao).length === 1 ? "seção" : "seções"}:</p>
      <div class="tags-wrap">${chips}</div>
      <table class="tab-sintese">
        <thead><tr><th style="width:22%">Dado</th><th style="width:28%">Situação inicial</th><th style="width:30%">→ Situação atual</th><th style="width:14%">Quando mudou</th><th style="width:6%">Vezes</th></tr></thead>
        <tbody>${histSinteseLinhasHTML(sint)}</tbody>
      </table>`;
}

function historicoWordLinhas(paf) {
  return histLinhasTabelaHTML(paf, "anotacao");
}

function historicoWordSintese(paf) {
  const sint = histSinteseExportacao(paf);
  if (!sint.length) return "";
  return `<table class="dados">
        <tr><th>Campo</th><th>Situação inicial</th><th>Situação atual</th><th>Período</th><th>Alterações</th></tr>
        ${histSinteseLinhasHTML(sint)}
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
    .sort((a, b) => (b.e.fixada ? 1 : 0) - (a.e.fixada ? 1 : 0) || (b.e.data || "").localeCompare(a.e.data || "") || b.i - a.i);
  const itens = ordenada.map(({ e, i }) => `
    <div class="diario-item${e.data ? "" : " sem-data"}${e.fixada ? " fixada" : ""}">
      <div class="diario-data"><label>${e.data ? "Data" : "Registro anterior (sem data)"}</label><input type="date" aria-label="Data da anotação" data-field="diario.${key}.${i}.data" value="${escapeHtml(e.data)}"></div>
      <div class="diario-texto"><textarea rows="${opts.rows || 3}" aria-label="Anotação de ${e.data ? fmtDateBR(e.data) : "data não informada"}" data-field="diario.${key}.${i}.texto" placeholder="${escapeHtml(opts.placeholder || "Anotação deste dia...")}">${escapeHtml(e.texto)}</textarea></div>
      <button type="button" class="diario-fixar${e.fixada ? " on" : ""}" data-diario-fixar="${key}" data-idx="${i}" aria-pressed="${e.fixada ? "true" : "false"}" title="${e.fixada ? "Desafixar" : "Fixar no topo (importante)"}" aria-label="${e.fixada ? "Desafixar esta anotação" : "Fixar esta anotação no topo"}">${e.fixada ? "★" : "☆"}</button>
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
  container.querySelectorAll("[data-diario-fixar]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.diarioFixar, idx = parseInt(btn.dataset.idx, 10);
    const item = state.current.diario[k][idx];
    if (!item) return;
    item.fixada = !item.fixada;
    savePAF(state.current, { silent: true });
    renderApp();
  }));
  container.querySelectorAll("[data-diario-del]").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.diarioDel, idx = parseInt(btn.dataset.idx, 10);
    const lista = state.current.diario[k];
    const item = lista[idx];
    if (!item) return;
    // Remove na hora e oferece "Desfazer" (mais rápido que confirmar, sem risco de perder o texto).
    lista.splice(idx, 1);
    savePAF(state.current, { silent: true });
    renderApp();
    const restaurar = () => {
      const atual = state.current && state.current.diario && state.current.diario[k];
      if (!atual) return;
      atual.splice(Math.min(idx, atual.length), 0, item);
      savePAF(state.current, { silent: true });
      renderApp();
    };
    if (typeof window.__desfazer === "function" && String(item.texto || "").trim()) window.__desfazer("Anotação removida.", restaurar);
  }));
}

// Visão unificada de todas as anotações por dia (de todos os campos), da mais recente para a mais antiga.
const DIARIO_ROTULOS = {
  habitacaoObs: "Habitação", eduObs: "Educação", rendaObs: "Trabalho e renda", saudeObs: "Saúde",
  aspectosPsicossociaisObs: "Aspectos relacionais", barreirasDesafios: "Barreiras e desafios", observacoes: "Observações gerais"
};

function histDiarioHTML(paf, secaoFiltro) {
  const todas = [];
  DIARIO_CAMPOS.forEach(k => {
    if (secaoFiltro && histSecaoId(k) !== secaoFiltro) return;
    ((paf.diario || {})[k] || []).forEach(e => {
      if (e && String(e.texto || "").trim() && histPeriodoOk(e.data)) todas.push({ k, data: e.data || "", texto: e.texto, fixada: !!e.fixada });
    });
  });
  if (!todas.length) return `<p class="hint">Nenhuma anotação por dia registrada${secaoFiltro ? " nesta seção" : ""}. Use "+ Anotação de hoje" nos campos de observação.</p>`;
  todas.sort((a, b) => (b.fixada ? 1 : 0) - (a.fixada ? 1 : 0) || (b.data || "").localeCompare(a.data || ""));
  return `<div class="hist-diario-acoes"><button type="button" class="btn btn-ghost btn-sm" data-exportar-notas="copiar">Copiar todas as anotações</button><button type="button" class="btn btn-ghost btn-sm" data-exportar-notas="txt">Baixar (.txt)</button></div>
  <div class="hist-diario">${todas.map(t => `
    <div class="hist-diario-item">
      <span class="hist-diario-data">${t.data ? fmtDateBR(t.data) : "sem data"}</span>
      ${t.fixada ? '<span class="hist-fixada" title="Anotação fixada">★</span>' : ""}<span class="hist-secao-tag">${escapeHtml(DIARIO_ROTULOS[t.k] || t.k)}</span>
      <p>${diarioBr(t.texto)}</p>
    </div>`).join("")}</div>
  <p class="hint">Para editar uma anotação, volte ao campo correspondente (o texto aqui é só leitura).</p>`;
}


/* =====================================================================
   Trajetória completa do acompanhamento
   Junta numa só linha do tempo, mês a mês: atendimentos, marcos de evolução, resultados de metas,
   anotações por dia, encaminhamentos, benefícios eventuais e atualizações nos dados da família.
   Serve para a tela (aba Histórico) e para o PDF da ficha.
   ===================================================================== */
const HIST_EXCLUI_MUDANCA = /^(atendimentos|metas\|.*\|(resultados|anotacoes))/;

function histTrajetoriaEventos(paf, opt) {
  opt = opt || {};
  const sec = opt.secao || "";
  const ev = [];
  const cores = (typeof TIPO_ATENDIMENTO_COR !== "undefined") ? TIPO_ATENDIMENTO_COR : {};
  const add = (e) => { if (e.data == null) e.data = ""; if (opt.periodo && !histPeriodoOk(e.data)) return; ev.push(e); };

  if (!sec || sec === "metas") {
    (paf.atendimentos || []).forEach(a => {
      if (!a || (!a.data && !a.evolucao && !a.encaminhamentos)) return;
      add({ data: a.data || "", kind: "atendimento", cor: cores[a.tipo] || "#8496A8", rotulo: a.tipo || "Atendimento",
        titulo: "", texto: a.evolucao || "", extra: a.encaminhamentos ? "Encaminhamentos: " + a.encaminhamentos : "", quem: a.tecnico || paf.tecnicoReferencia || "" });
    });
    (paf.metas || []).forEach(m => {
      const notas = Array.isArray(m.anotacoes) ? m.anotacoes : ((m.resultados || "").trim() ? [{ data: "", texto: m.resultados }] : []);
      notas.filter(n => (n.texto || "").trim()).forEach(n =>
        add({ data: n.data || "", kind: "meta", cor: "#B98A34", rotulo: "Resultado de meta", titulo: m.meta || "", texto: n.texto.trim(), extra: "", quem: "" }));
    });
  }
  const dia = paf.diario || {};
  DIARIO_CAMPOS.forEach(k => {
    if (sec && histSecaoId(k) !== sec) return;
    (dia[k] || []).forEach(n => {
      if (n && String(n.texto || "").trim())
        add({ data: n.data || "", kind: "diario", cor: "#3E6B8A", rotulo: "Anotação · " + (DIARIO_ROTULOS[k] || k), titulo: "", texto: String(n.texto).trim(), extra: "", quem: "" });
    });
  });
  if (!sec || sec === "encaminhamentos") (paf.encaminhamentosForm || []).forEach(e => {
    if (!e) return;
    add({ data: e.data || "", kind: "encam", cor: "#B5473F", rotulo: "Encaminhamento" + (e.area ? " · " + e.area : ""), titulo: e.orgaoDestino || "", texto: e.objetivo || "", extra: e.contraReferencia ? "Contra-referência: " + e.contraReferencia : "", quem: "" });
  });
  if (!sec || sec === "beneficioEventual") (paf.beneficiosEventuaisForm || []).forEach(b => {
    if (!b) return;
    add({ data: b.data || "", kind: "benef", cor: "#6B5B95", rotulo: "Benefício eventual" + (b.tipo ? " · " + b.tipo : ""), titulo: "", texto: [b.situacaoMotivadora, b.situacaoDetalhe].filter(Boolean).join(" — "), extra: "", quem: "" });
  });
  histOrdenar(paf).forEach(({ e }) => {
    const manual = e.tipo === "manual";
    if (manual) {
      if (sec) return;
      const s = histSentido(e);
      add({ data: e.data, kind: "marco-" + s, cor: s === "avanco" ? "#2E7D6B" : s === "retrocesso" ? "#B5473F" : "#B98A34",
        rotulo: HIST_SENTIDOS[s].icone + " Marco de evolução · " + HIST_SENTIDOS[s].label, titulo: "", texto: e.nota || "", extra: "", quem: "" });
      return;
    }
    const muds = (e.mudancas || []).filter(m => histMudVisivel(m) && !HIST_EXCLUI_MUDANCA.test(String(m.k || "")) && (!sec || m.secao === sec));
    const itens = histAgrupar(muds).map(it => ({ secao: it.secao, t: histItemTexto(it) }));
    if (!itens.length && (!e.nota || sec)) return;
    add({ data: e.data, kind: "dados", cor: "#52667C", rotulo: "Dados da família atualizados", titulo: "", texto: e.nota || "", extra: "",
      itens: itens.map(x => ({ secao: histSecaoLabel(x.secao), campo: x.t.campo, linhas: x.t.linhas })), quem: "" });
  });
  return ev;
}

function histTrajetoriaContagem(ev) {
  const c = { atendimento: 0, avanco: 0, retrocesso: 0, observacao: 0, meta: 0, dados: 0, outros: 0 };
  ev.forEach(e => {
    if (e.kind === "atendimento") c.atendimento++;
    else if (e.kind.startsWith("marco-")) c[e.kind.slice(6)]++;
    else if (e.kind === "meta") c.meta++;
    else if (e.kind === "dados") c.dados++;
    else c.outros++;
  });
  return c;
}

// opt: { secao, periodo (aplica filtro da tela), ordem: "desc" | "asc", pdf }
function histTrajetoriaMesesHTML(paf, opt) {
  opt = opt || {};
  const ev = histTrajetoriaEventos(paf, opt);
  if (!ev.length) return `<p class="hint">Nenhum registro${opt.secao ? " nesta seção" : ""} ainda. Atendimentos, marcos, anotações e resultados de metas aparecem aqui assim que forem registrados.</p>`;
  const asc = opt.ordem === "asc";
  ev.forEach((e, i) => { e._i = i; });
  ev.sort((a, b) => {
    if (!a.data !== !b.data) return a.data ? -1 : 1;           // sem data sempre no fim
    return (asc ? 1 : -1) * (a.data || "").localeCompare(b.data || "") || (asc ? a._i - b._i : b._i - a._i);
  });
  const c = histTrajetoriaContagem(ev);
  const pl = (n, s, p) => n + " " + (n === 1 ? s : p);
  const partes = [
    c.atendimento ? `<span class="traj-leg" style="--c:#2E7D6B">${pl(c.atendimento, "atendimento", "atendimentos")}</span>` : "",
    c.avanco ? `<span class="traj-leg" style="--c:#2E7D6B">▲ ${pl(c.avanco, "avanço", "avanços")}</span>` : "",
    c.retrocesso ? `<span class="traj-leg" style="--c:#B5473F">▼ ${pl(c.retrocesso, "retrocesso", "retrocessos")}</span>` : "",
    c.observacao ? `<span class="traj-leg" style="--c:#B98A34">● ${pl(c.observacao, "observação", "observações")}</span>` : "",
    c.meta ? `<span class="traj-leg" style="--c:#B98A34">${pl(c.meta, "resultado de meta", "resultados de metas")}</span>` : "",
    c.dados ? `<span class="traj-leg" style="--c:#52667C">${pl(c.dados, "atualização de dados", "atualizações de dados")}</span>` : "",
    c.outros ? `<span class="traj-leg" style="--c:#6B5B95">${pl(c.outros, "outro registro", "outros registros")}</span>` : ""
  ].join("");
  // Resumo de cada mês (só na impressão): quantos atendimentos, marcos e atualizações aconteceram.
  const resumoMes = {};
  if (opt.pdf) {
    const porMes = {};
    ev.forEach(e => { const k = (e.data || "").slice(0, 7); (porMes[k] = porMes[k] || []).push(e); });
    Object.keys(porMes).forEach(k => {
      const cm = histTrajetoriaContagem(porMes[k]);
      resumoMes[k] = [
        cm.atendimento ? pl(cm.atendimento, "atendimento", "atendimentos") : "",
        cm.avanco ? "▲ " + pl(cm.avanco, "avanço", "avanços") : "",
        cm.retrocesso ? "▼ " + pl(cm.retrocesso, "retrocesso", "retrocessos") : "",
        cm.observacao ? pl(cm.observacao, "observação", "observações") : "",
        cm.meta ? pl(cm.meta, "resultado de meta", "resultados de metas") : "",
        cm.dados ? pl(cm.dados, "atualização de dados", "atualizações de dados") : "",
        cm.outros ? pl(cm.outros, "outro registro", "outros registros") : ""
      ].filter(Boolean).join(" · ");
    });
  }
  let mesAnt = null, ultData = null;
  const itens = ev.map(e => {
    const mk = (e.data || "").slice(0, 7);
    const cab = mk !== mesAnt ? `<div class="hist-mes traj-mes"><span>${escapeHtml(e.data ? histNomeMes(e.data) : "Sem data informada")}</span>${opt.pdf && resumoMes[mk] ? `<span class="traj-mes-res">${resumoMes[mk]}</span>` : ""}</div>` : "";
    mesAnt = mk;
    const b = dateBadgeParts(e.data);
    let gap = "";
    if (!opt.pdf && ultData && e.data && ultData !== e.data) {
      const dd = Math.abs(Math.round((new Date(ultData + "T12:00:00") - new Date(e.data + "T12:00:00")) / 86400000));
      if (dd >= 45) gap = `<div class="traj-vazio">${dd >= 60 ? Math.round(dd / 30) + " meses" : dd + " dias"} sem registros</div>`;
    }
    if (opt.pdf && ultData && e.data && ultData !== e.data) {
      const dd = Math.abs(Math.round((new Date(ultData + "T12:00:00") - new Date(e.data + "T12:00:00")) / 86400000));
      if (dd >= 45) gap = `<div class="traj-vazio">${dd >= 60 ? Math.round(dd / 30) + " meses" : dd + " dias"} sem registros</div>`;
    }
    ultData = e.data || ultData;
    const texto = e.texto ? `<p class="traj-texto">${escapeHtml(e.texto).replace(/\n/g, "<br>")}</p>` : (e.kind === "atendimento" ? `<p class="traj-texto traj-sem">Sem observações registradas.</p>` : "");
    const lista = e.itens && e.itens.length ? `<ul class="traj-lista">${e.itens.map(it => `<li><b>${escapeHtml(it.campo)}</b>${it.linhas && it.linhas.length ? ` — ${it.linhas.map(escapeHtml).join("; ")}` : ""} <span class="traj-sec">${escapeHtml(it.secao)}</span></li>`).join("")}</ul>` : "";
    return gap + cab + `
    <div class="hist-item traj-item" style="--c:${e.cor}">
      <div class="traj-badge"><span class="dia">${escapeHtml(b.dia)}</span><span class="mes">${escapeHtml(b.mes)}</span></div>
      <div class="traj-corpo">
        <div class="traj-topo"><span class="traj-tipo">${escapeHtml(e.rotulo)}</span>${e.quem ? `<span class="traj-quem">${escapeHtml(e.quem)}</span>` : ""}</div>
        ${e.titulo ? `<p class="traj-titulo">${escapeHtml(e.titulo)}</p>` : ""}${texto}${lista}
        ${e.extra ? `<p class="traj-extra">${escapeHtml(e.extra)}</p>` : ""}
      </div>
    </div>`;
  }).join("");
  return `<div class="traj-legendas">${partes}</div><div class="traj-lista-meses">${itens}</div>`;
}
