/*
  Gera conhecimento-umbrella.json: tudo o que o PRÓPRIO app ensina sobre o PAIF, em verbetes que o Paulus
  consulta no aparelho (sem internet) e cita como fonte.

  Lê (somente texto fixo do código, NUNCA dado de família):
    - app.js    -> notas técnicas de cada seção, listas do formulário (objetivos, seguranças, serviços...),
                   cabeçalhos das seções e dicas do mascote
    - README.md -> seção 3 ("Como o app funciona")

  Uso (na pasta do projeto):   node scripts/gerar-conhecimento-umbrella.mjs
  Rode de novo sempre que mudar uma nota técnica, uma lista ou o README, e aumente o CACHE_NAME do sw.js.
*/
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8');
const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');

/* ------------------------------------------------------------ utilitários */

function limpar(s) {
  return String(s)
    .replace(/\\"/g, '"').replace(/\\n/g, ' ')
    .replace(/<a [^>]*>([^<]*)<\/a>/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

// Lê um literal "const NOME = <literal>;" por balanceamento de colchetes/chaves, respeitando aspas.
function literal(nome) {
  const m = new RegExp('(?:^|\\n)const ' + nome + ' = ').exec(app);
  if (!m) return null;
  let i = m.index + m[0].length;
  const ini = i, abre = app[i];
  if (abre !== '[' && abre !== '{') return null;
  let prof = 0, aspa = null;
  for (; i < app.length; i++) {
    const c = app[i];
    if (aspa) { if (c === '\\') i++; else if (c === aspa) aspa = null; continue; }
    if (c === '"' || c === "'" || c === '`') { aspa = c; continue; }
    if (c === '[' || c === '{') prof++;
    else if (c === ']' || c === '}') { prof--; if (prof === 0) { i++; break; } }
  }
  try { return vm.runInNewContext('(' + app.slice(ini, i) + ')'); } catch (e) { return null; }
}

function primeiraFrase(t, max = 110) {
  const m = /^(.{25,}?[.:;?])\s/.exec(t + ' ');
  const f = (m ? m[1] : t);
  return f.length > max ? f.slice(0, max).replace(/\s+\S*$/, '') + '…' : f;
}

// Divide texto longo em pedaços de até ~max caracteres, cortando no fim de frase.
function partir(t, max = 700) {
  if (t.length <= max * 1.25) return [t];
  const frases = t.split(/(?<=[.;?!])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ(“"])/);
  const partes = []; let atual = '';
  for (const f of frases) {
    if (atual && (atual + ' ' + f).length > max) { partes.push(atual); atual = f; }
    else atual = atual ? atual + ' ' + f : f;
  }
  if (atual) partes.push(atual);
  return partes;
}

/* ------------------------------------------------------------ seções do formulário */

const SECTIONS = literal('SECTIONS') || [];
const idPorRotulo = new Map(SECTIONS.map(s => [s.label, s.id]));
const dicasSecao = literal('MASCOTE_DICAS_SECAO') || {};
const perguntasSecao = literal('MASCOTE_PERGUNTAS_SECAO') || {};
const dicasGerais = literal('MASCOTE_DICAS') || [];

const verbetes = [];
const add = (doc, titulo, norma, referencia, texto, extra = {}) => {
  texto = limpar(texto);
  if (!texto || texto.length < 25) return;
  referencia = limpar(referencia);
  verbetes.push({ doc, titulo, norma, ano: 2026, referencia, rotulo: extra.rotulo || referencia, texto, tipo: extra.tipo || 'referencia', ...(extra.secao ? { secao: extra.secao } : {}) });
};

// Rótulo curto de cada nota técnica (aparece nos botões e na fonte). A chave é um trecho que só aparece nessa nota.
// Nota nova sem rótulo aqui ainda funciona: usa a primeira frase. Para dar rótulo, acrescente uma linha.
const ROTULOS = [
  ['Monitoramento do PAIF (Trilha', 'Monitoramento do PAIF no painel'],
  ['devolva sistematicamente os dados', 'Qualidade, indicadores e Vigilância'],
  ['priorizar a escuta aprofundada', 'Prioridade e busca ativa'],
  ['Escala auxiliar de organização da fila', 'Escala de prioridade: como funciona'],
  ['O PAIF acompanha famílias de forma contínua', 'Base legal e finalidade do PAF'],
  ['define cinco seguranças que o SUAS', 'Seguranças e princípios (NOB-SUAS)'],
  ['acompanhamento familiar particularizado, adotado', 'Quando usar o PAF e limite de famílias'],
  ['entende o Trabalho Social com Famílias e Territórios (TSFT)', 'TSFT e ciclo do PAIF em 5 passos'],
  ['termo guarda-chuva e chave de leitura', 'Dimensão coletiva e visão coletiva'],
  ['Primeira infância é o período', 'Primeira infância e SPSBD-GC'],
  ['códigos de ética', 'Ética da equipe e sigilo'],
  ['analisar a família em sua totalidade', 'Leitura da família e do cuidado'],
  ['campo "Parentesco"', 'Parentesco e arranjos familiares'],
  ['Boa Vista/RR é uma das principais portas', 'Migração venezuelana e acolhimento'],
  ['vulnerabilidade é uma leitura dinâmica', 'Vulnerabilidade sem culpabilizar'],
  ['Vivência de situações de discriminação', 'Discriminação e equidade'],
  ['classifica as vulnerabilidades pelo tipo de demanda', 'Tipos de vulnerabilidade e riscos'],
  ['desproteções ocorrem no plano material e no relacional', 'Desproteções materiais e relacionais'],
  ['Quadro 7 da Trilha', 'Quadro 7: desproteções por gravidade'],
  ['perspectiva interseccional da Trilha', 'Interseccionalidade e povos tradicionais'],
  ['Insegurança Alimentar (MDS/UNICEF) trata a fome', 'Insegurança alimentar e cesta básica'],
  ['Genograma e ecomapa', 'Genograma e ecomapa'],
  ['reconhecer, ao lado das desproteções', 'Potencialidades da família (Quadro 8)'],
  ['reconhecer os ativos do território', 'Ativos do território'],
  ['modelo de Plano de Acompanhamento Familiar da CIB/MG', 'Modelo CIB/MG e potencialidades'],
  ['O trabalho do PAIF é territorial e comunitário', 'Matricialidade e território'],
  ['entende o território como espaço vivo', 'Território vivo e referências comunitárias'],
  ['Em contextos de violência', 'Violência: acolher sem exigir prova'],
  ['preponderância das atividades coletivas', 'Modalidades coletivas e o brincar'],
  ['distingue "Oficina com Famílias"', 'Oficina (PAIF) x Grupo (SCFV)'],
  ['Registro das ações coletivas', 'Registro e indicadores das ações coletivas'],
  ['Fundamento do trabalho coletivo no Caderno', 'Construir com, e não para'],
  ['organiza as modalidades em pequenos grupos', 'Modalidades como percursos'],
  ['A Tipificação Nacional lista a rede de articulação', 'Rede de articulação do PAIF'],
  ['vários equipamentos costumam atuar', 'Articulação entre equipamentos da rede'],
  ['Marcar "SCFV" registra', 'SCFV não substitui o PAIF'],
  ['registre o retorno (contra-referência)', 'Contrarreferência do encaminhamento'],
  ['encaminhar não basta', 'Encaminhar não basta: chegou e ficou?'],
  ['Protocolo do PAIF distingue referência', 'Referência e contrarreferência'],
  ['partes indissociáveis do mesmo sistema', 'PAIF e PAEFI integrados'],
  ['Trilha sobre Condicionalidades do Bolsa Família', 'Condicionalidades do Bolsa Família'],
  ['Decreto nº 6.307/2007 e o Caderno de Benefícios Eventuais', 'Benefícios eventuais como direito'],
  ['O BPC (art. 20', 'BPC: regras gerais'],
  ['Carteira da Pessoa Idosa', 'Carteira da Pessoa Idosa'],
  ['Minha Casa Minha Vida', 'Minha Casa Minha Vida'],
  ['PMBV/SEMADS', 'Programas municipais de Boa Vista'],
  ['Benefícios eventuais são provisões suplementares', 'O que são benefícios eventuais'],
  ['concessão e o valor dos auxílios por natalidade', 'Regra municipal dos benefícios'],
  ['reforça o registro técnico', 'Registro técnico sem juízo de valor'],
  ['distinguem "atendimento"', 'Atendimento x acompanhamento'],
  ['descreve as vinculações possíveis', 'Vinculações possíveis'],
  ['fluxograma do PAIF', 'Fluxograma do PAIF'],
  ['Pactuação do Plano', 'Pactuação das metas (Quadro 9)'],
  ['objetivos do PAIF para gestantes', 'Objetivos para a primeira infância'],
  ['Marque os objetivos do PAIF', 'Objetivos do PAIF e caráter não tutelar'],
  ['não se institui automaticamente', 'Metas e processos coletivos'],
  ['organizam a proteção em torno de seguranças', 'Seguranças a afiançar'],
  ['O PAIF não tem caráter terapêutico', 'PAIF não é terapia; violação vai ao CREAS'],
  ['Avaliação de resultados com a família', 'Avaliação com a família (Quadro 14)'],
  ['impacto esperado do PAIF em quatro frentes', 'Impacto esperado do PAIF'],
  ['Avaliação com olhar coletivo', 'Avaliação com olhar coletivo'],
  ['detalha o desligamento', 'Desligamento: tipos de encerramento']
];
const rotuloDe = t => { const r = ROTULOS.find(([k]) => t.includes(k)); return r ? r[1] : null; };

/* ------------------------------------------------------------ 1. notas técnicas, por seção/subseção */

const linhas = app.split('\n');
let casoAtual = null, rotulo = null, secaoNav = null;
const reCase = /case "(\w+)": (?:return|\{)/;
const reHdr1 = /sectionHeader\("([^"]+)",\s*"([^"]+)"(?:,\s*"((?:[^"\\]|\\.)*)")?/;
const reHdr2 = /<h2><span class="num">([^<]+)<\/span>([^<]+)<\/h2>/;
const reNota = /^\s*\$\{notaTecnica\("((?:[^"\\]|\\.)*)"\)\}\s*$/;
const subHeaders = []; // para a seção guia
let funcao = '';

for (const l of linhas) {
  const f = /^(?:async )?function (\w+)/.exec(l); if (f) funcao = f[1];
  const c = reCase.exec(l); if (c) { casoAtual = c[1]; secaoNav = c[1]; }
  const h = reHdr1.exec(l) || reHdr2.exec(l);
  if (h) {
    rotulo = (h[1] + ' ' + h[2]).trim();
    subHeaders.push({ num: h[1], titulo: h[2].trim(), sub: h[3] ? limpar(h[3]) : '', secao: casoAtual });
  }
  const n = reNota.exec(l);
  if (!n) continue;
  let nome, id;
  if (funcao === 'renderDashboardHTML') { nome = 'Gráficos (painel geral)'; id = null; }
  else if (funcao === 'renderPrioridadesHTML') { nome = 'Prioridades de atendimento'; id = null; }
  else { nome = rotulo || (SECTIONS.find(s => s.id === casoAtual) || {}).label || 'Formulário'; id = casoAtual; }
  const texto = limpar(n[1]);
  const rot = rotuloDe(texto);
  if (!rot) console.warn('nota sem rótulo (usa a primeira frase):', texto.slice(0, 70));
  partir(texto).forEach((p, i, arr) => {
    const ref = (rot || primeiraFrase(p)) + (i > 0 ? ' (parte ' + (i + 1) + ')' : '');
    add('umbrella-notas-tecnicas',
      'Umbrella, ' + nome + ': nota técnica',
      'Nota técnica do app Umbrella (PAF/PAIF), com a fundamentação citada no próprio texto',
      ref, p, { secao: id });
  });
}

/* ------------------------------------------------------------ 2. listas do formulário (o que cada campo oferece) */

const LISTAS = [
  ['OBJETIVOS_PAIF', 'Objetivos do PAIF (checklist da seção Elaboração do Plano)', 'plano', 'Marque os objetivos do Serviço, conforme a Tipificação Nacional, que este Plano pretende trabalhar'],
  ['SEGURANCAS_SOCIOASSISTENCIAIS', 'Seguranças socioassistenciais afiançadas pelo Plano', 'plano', 'O Plano indica quais seguranças (PNAS e NOB-SUAS) pretende garantir'],
  ['ATIVIDADES_COLETIVAS_PAIF', 'Atividades do Trabalho Social Coletivo do PAIF (seção 04a)', 'grupo', 'Opções para registrar a participação da família em ações coletivas'],
  ['SERVICOS_BASICA', 'Serviços da Proteção Social Básica (seção 04b)', 'grupo', 'Serviços de Proteção Social Básica registráveis'],
  ['SERVICOS_MEDIA', 'Serviços de Média Complexidade (seção 04b)', 'grupo', 'Serviços de Proteção Social Especial de Média Complexidade registráveis'],
  ['SERVICOS_ALTA', 'Serviços de Alta Complexidade (seção 04b)', 'grupo', 'Serviços de Proteção Social Especial de Alta Complexidade registráveis'],
  ['TIPOS_ATENDIMENTO', 'Tipos de atendimento registráveis no PAF', 'metas', 'Tipos de atendimento do registro'],
  ['ESTRATEGIAS', 'Estratégias de acompanhamento do PAF', 'estrategias', 'Estratégias que o plano pode usar'],
  ['EIXOS', 'Eixos de trabalho do PAF', 'estrategias', 'Eixos em que o plano se organiza'],
  ['ENCERRAMENTO_MOTIVOS', 'Motivos de encerramento do acompanhamento', 'encerramento', 'Motivos possíveis para encerrar o PAF'],
  ['ENCAMINHAMENTO_AREAS', 'Áreas de encaminhamento', 'encaminhamentos', 'Áreas para as quais o CRAS encaminha'],
  ['INSTRUMENTAIS_TECNICOS', 'Instrumentais técnicos do PAIF', 'estrategias', 'Instrumentais que a equipe pode usar'],
  ['POTENCIALIDADES_FAMILIA', 'Potencialidades da família (diagnóstico)', 'diagnostico', 'Potencialidades registráveis'],
  ['VULNERABILIDADES_FAMILIA', 'Vulnerabilidades da família (diagnóstico)', 'diagnostico', 'Vulnerabilidades registráveis'],
  ['SITUACOES_SOCIAIS', 'Situações sociais acompanhadas (seção 04)', 'grupo', 'Situações sociais, com as marcadas como superadas ao longo do acompanhamento'],
  ['REDE_APOIO', 'Rede de apoio da família', 'rede', 'Tipos de apoio da rede'],
  ['METAS_FIXAS', 'Metas padrão do Plano (seção Metas e Evolução)', 'metas', 'Metas que o app já oferece para o Plano'],
  ['ESTADO_CIVIL_OPCOES', 'Estado civil do responsável (Cabeçalho)', 'cabecalho', 'Opções de estado civil'],
  ['MIGRACAO_DOCUMENTACAO', 'Situação documental migratória (Membros da Família)', 'familia', 'Documentos migratórios registráveis'],
  ['HABITACAO_TIPO', 'Tipo de residência (Diagnóstico 03a)', 'diagnostico', 'Opções de tipo de residência'],
  ['HABITACAO_PAREDES', 'Material das paredes (Diagnóstico 03a)', 'diagnostico', 'Opções de material das paredes'],
  ['HABITACAO_ENERGIA', 'Acesso a energia elétrica (Diagnóstico 03a)', 'diagnostico', 'Opções de energia elétrica'],
  ['HABITACAO_ESGOTO', 'Escoamento sanitário (Diagnóstico 03a)', 'diagnostico', 'Opções de esgoto'],
  ['HABITACAO_LIXO', 'Coleta de lixo (Diagnóstico 03a)', 'diagnostico', 'Opções de coleta de lixo'],
  ['PROGRAMAS_OUTROS_SUGESTOES', 'Sugestões de outros programas (seção Programas e Benefícios)', 'programas', 'Sugestões para o campo Outros programas'],
  ['BENEFICIOS_OUTROS_SUGESTOES', 'Sugestões de outros benefícios (seção Programas e Benefícios)', 'programas', 'Sugestões para o campo Outros benefícios'],
  ['BENEFICIO_EVENTUAL_TIPOS', 'Modalidades de benefício eventual (seção 07)', 'beneficioEventual', 'Modalidades de benefício eventual'],
  ['BENEFICIO_EVENTUAL_SITUACOES_VULNERAB', 'Situações que motivam o benefício eventual (seção 07)', 'beneficioEventual', 'Situações/motivos do benefício eventual'],
  ['BENEFICIO_EVENTUAL_FORMAS', 'Formas de concessão do benefício eventual (seção 07)', 'beneficioEventual', 'Formas de concessão'],
  ['ANEXO_CATEGORIAS', 'Tipos de documento dos anexos', 'anexos', 'Tipo de documento que cada anexo pode ter'],
  ['PROGRAMAS_QUAIS', 'Programas registráveis (seção Programas e Benefícios)', 'programas', 'Programas'],
  ['BENEFICIOS_QUAIS', 'Benefícios registráveis (seção Programas e Benefícios)', 'programas', 'Benefícios']
];
let nListas = 0;
for (const [nome, titulo, sec, ref] of LISTAS) {
  const v = literal(nome);
  if (!Array.isArray(v) || !v.length) continue;
  const itens = v.map(x => typeof x === 'string' ? x : (x && (x.situacao || x.nome || x.label || x.titulo || x.texto)) || '').filter(Boolean).map(limpar);
  if (!itens.length) continue;
  nListas++;
  const corpo = ref + ': ' + itens.join('; ') + '.';
  partir(corpo, 900).forEach((p, i, arr) =>
    add('umbrella-formulario', 'Umbrella, formulário: ' + titulo + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''),
      'Campos do formulário do app Umbrella (PAF/PAIF)', titulo, p, { secao: sec }));
}

/* ------------------------------------------------------------ 3. guia de cada seção do PAF */

for (const s of SECTIONS) {
  const hs = subHeaders.filter(h => h.secao === s.id);
  const subtitulos = hs.map(h => h.num + ' ' + h.titulo + (h.sub ? ' — ' + h.sub : '')).join(' | ');
  const partes = [
    'Seção “' + s.label + '” do PAF.',
    dicasSecao[s.id] || '',
    hs.length ? 'Blocos: ' + subtitulos + '.' : '',
    perguntasSecao[s.id] ? 'Pergunta frequente: ' + perguntasSecao[s.id] : ''
  ].filter(Boolean);
  add('umbrella-secoes', 'Umbrella, guia da seção: ' + s.label, 'Guia das seções do PAF no app Umbrella',
    'O que registrar na seção ' + s.label + ' do PAF', partes.join(' '), { secao: s.id });
}

/* ------------------------------------------------------------ 4. dicas gerais do mascote */

dicasGerais.forEach((d, i) =>
  add('umbrella-dicas', 'Umbrella, dica do PAIF nº ' + (i + 1), 'Dicas do mascote do app Umbrella (orientação geral do PAIF)',
    primeiraFrase(limpar(d)), d, { tipo: 'apoio' }));

/* ------------------------------------------------------------ 5. como usar o app (README, seção 3) */

const ini = readme.indexOf('## 3. Como o app funciona');
const fim = readme.indexOf('## 4.', ini);
if (ini >= 0 && fim > ini) {
  const corpo = readme.slice(ini, fim).replace(/^## 3\.[^\n]*\n/, '');
  corpo.split(/\n(?=- )/).forEach(b => {
    const t = limpar(b.replace(/^- /, '').replace(/\n\s+/g, ' ').replace(/^>\s*/gm, ''));
    const mb = /^- \*\*(.+?)\*\*/.exec(b);
    const nome = limpar(mb ? mb[1] : primeiraFrase(t, 70));
    partir(t, 800).forEach((p, i, arr) =>
      add('umbrella-uso-do-app', 'Umbrella, como usar: ' + nome + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''),
        'Documentação de uso do app Umbrella (README)', nome, p, { tipo: 'apoio' }));
  });
}

/* ------------------------------------------------------------ 6. campos de cada seção (rótulos, colunas, dicas) */

{
  const ini = linhas.findIndex(l => l.startsWith('function renderSection('));
  const fimF = linhas.findIndex((l, i) => i > ini && /^}/.test(l));
  const por = {};            // secao -> { blocos:[], campos:[], colunas:[], dicas:[], botoes:[] }
  const get = id => (por[id] = por[id] || { blocos: [], campos: [], colunas: [], dicas: [], botoes: [] });
  const poe = (arr, t) => { t = limpar(t); if (t && t.length >= 3 && !t.includes('${') && !arr.includes(t)) arr.push(t); };
  let cur = null;
  for (let i = ini; i <= fimF; i++) {
    const l = linhas[i];
    const c = /^    case "(\w+)":/.exec(l); if (c) cur = c[1];
    if (!cur || cur === 'graficos') continue;
    const g = get(cur);
    let m;
    const reH1 = /sectionHeader\("([^"]+)",\s*"([^"]+)"(?:,\s*"((?:[^"\\]|\\.)*)")?/g;
    while ((m = reH1.exec(l))) poe(g.blocos, m[1] + ' ' + m[2] + (m[3] ? ' — ' + m[3] : ''));
    const reH2 = /<h2><span class="num">([^<]+)<\/span>(?:<span class="section-icon-badge">.*?<\/span>)?([^<$]+)<\/h2>/g;
    while ((m = reH2.exec(l))) poe(g.blocos, m[1] + ' ' + m[2]);
    const reSub = /class="section-sub">([^<$]{15,})</g;
    while ((m = reSub.exec(l))) { const t = limpar(m[1]); if (g.blocos.length && !g.blocos[g.blocos.length - 1].includes(t)) g.blocos[g.blocos.length - 1] += ' — ' + t; }
    const reLab = /<label[^>]*>([^<$]{3,}?)<\/label>/g;
    while ((m = reLab.exec(l))) poe(g.campos, m[1]);
    const reDia = /diarioCampoHTML\(paf,\s*"[^"]+",\s*"([^"]+)"/g;
    while ((m = reDia.exec(l))) poe(g.campos, m[1] + ' (anotações por dia)');
    const reMapa = /^\s+\w+: "([^"]+\?)",?\s*$/;
    if ((m = reMapa.exec(l))) poe(g.campos, m[1]);
    const reTh = /<th[^>]*>([^<$]{2,})</g;
    while ((m = reTh.exec(l))) poe(g.colunas, m[1]);
    const reHint = /class="hint"[^>]*>([^<$]{20,})</g;
    while ((m = reHint.exec(l))) poe(g.dicas, m[1]);
    const reBtn = /class="(?:add-row-btn|btn[^"]*)"[^>]*data-action="(?:add|gerar|imprimir)[^"]*"[^>]*>([^<$]{3,})</g;
    while ((m = reBtn.exec(l))) poe(g.botoes, m[1]);
    const reBtn2 = /<button[^>]*add-row-btn[^>]*>([^<$]{3,})</g;
    while ((m = reBtn2.exec(l))) poe(g.botoes, m[1]);
  }
  for (const s of SECTIONS) {
    const g = por[s.id]; if (!g) continue;
    const idx = SECTIONS.indexOf(s) + 1;
    const partesTxt = [];
    if (g.blocos.length) partesTxt.push('Blocos: ' + g.blocos.map(b => b.replace(/[.\s]+$/, '')).join(' | ') + '.');
    if (g.campos.length) partesTxt.push('Campos: ' + g.campos.join('; ') + '.');
    if (g.colunas.length) partesTxt.push('Colunas das tabelas: ' + g.colunas.join('; ') + '.');
    if (g.botoes.length) partesTxt.push('Botões: ' + g.botoes.join('; ') + '.');
    if (g.dicas.length) partesTxt.push('Avisos na tela: ' + g.dicas.join(' '));
    if (!partesTxt.length) continue;
    const corpo = 'Campos da seção ' + String(idx).padStart(2, '0') + ' “' + s.label + '” do PAF. ' + partesTxt.join(' ');
    partir(corpo, 900).forEach((p, i, arr) =>
      add('umbrella-campos', 'Umbrella, campos da seção: ' + s.label + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''),
        'Campos do formulário do app Umbrella (PAF/PAIF)', 'Campos e colunas da seção ' + s.label, p, { secao: s.id }));
  }
}

/* ------------------------------------------------------------ 7. mais trechos do README (Histórico, Anotações, fundamentação) */

function blocosDoReadme(inicio, fimMarcador, doc, tituloBase, norma, extra = {}) {
  const a = readme.indexOf(inicio); if (a < 0) { console.warn('README: não achei', inicio); return 0; }
  let b = fimMarcador ? readme.indexOf(fimMarcador, a + inicio.length) : -1; if (b < 0) b = readme.length;
  let corpo = readme.slice(a, b).split('\n').slice(1).join('\n');
  corpo = corpo.split('\n').filter(l => !/Cache do service worker|Arquivo novo:|^---\s*$/.test(l)).join('\n');
  let n = 0; const usados = {};
  corpo.split(/\n(?=- )/).forEach(bl => {
    const t = limpar(bl.replace(/^- /, '').replace(/\n\s+/g, ' ').replace(/^#+ .*$/gm, ''));
    const mb = /^- \*\*(.+?)\*\*/.exec(bl);
    let nome = limpar(mb ? mb[1] : primeiraFrase(t, 70)).replace(/:$/, '');
    if (t.length < 40) return;
    const chaveNome = tituloBase + nome; usados[chaveNome] = (usados[chaveNome] || 0) + 1;
    if (usados[chaveNome] > 1) nome += ' (' + usados[chaveNome] + ')';
    partir(t, 800).forEach((p, i, arr) => { n++; add(doc, tituloBase + nome + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''), norma, nome, p, extra); });
  });
  return n;
}
const nHist = blocosDoReadme('## Histórico de Evolução da Família', '\n---\n\n## Anotações', 'umbrella-uso-do-app',
  'Umbrella, Histórico de Evolução: ', 'Documentação de uso do app Umbrella (README)', { tipo: 'apoio', secao: 'historico' });
const nNotas = blocosDoReadme('## Anotações e armazenamento (atualização)', null, 'umbrella-uso-do-app',
  'Umbrella, anotações e armazenamento: ', 'Documentação de uso do app Umbrella (README)', { tipo: 'apoio' });
const nFund = blocosDoReadme('## 5. Fundamentação técnica', '\n## 6.', 'umbrella-fundamentacao',
  'Umbrella, base normativa do app: ', 'Fundamentação técnica do app Umbrella (README)', { tipo: 'apoio' });

/* ------------------------------------------------------------ 8. manual do app (docs/manual-do-app.md) com valores lidos do código */

const manual = fs.readFileSync(path.join(raiz, 'docs', 'manual-do-app.md'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const falta = [];
const pegar = (re, nome) => { const m = re.exec(app); if (!m) { falta.push(nome); return null; } return m; };
const listaTxt = v => (Array.isArray(v) ? v : []).map(x => typeof x === 'string' ? x : (x && (x.label || x.nome || x.situacao || x.texto)) || '').filter(Boolean).map(limpar).join('; ');
const agruparPesos = (obj) => {
  const por = {};
  Object.entries(obj || {}).forEach(([k, v]) => { (por[v] = por[v] || []).push(limpar(k)); });
  return Object.keys(por).map(Number).sort((a, b) => b - a).map(p => p + ' pontos: ' + por[p].join('; ')).join('. ');
};
const bytesTxt = b => b >= 1024 * 1024 ? (b / 1024 / 1024).toString().replace('.', ',') + ' MB' : (b / 1024).toString().replace('.', ',') + ' KB';
const anexoBytes = {};
for (const m of app.matchAll(/const (ANEXO_\w+_(?:CLOUD|LOCAL)) = ([\d.]+) \* 1024( \* 1024)?;/g))
  anexoBytes[m[1]] = parseFloat(m[2]) * 1024 * (m[3] ? 1024 : 1);

const VAL = {};
{
  let m;
  if ((m = pegar(/INATIVIDADE_MAX_MS = (\d+) \* 60 \* 1000/, 'INATIVIDADE_MAX_MS'))) VAL.INATIV_MIN = m[1];
  if ((m = pegar(/state\.saveTimer = setTimeout\(\(\) => \{[\s\S]*?\}, (\d+)\);/, 'tempo do autosave'))) VAL.AUTOSAVE_MS = m[1];
  if ((m = pegar(/LINHA_EXTREMA_POBREZA = (\d+)/, 'LINHA_EXTREMA_POBREZA'))) VAL.LINHA_EXTREMA = m[1];
  if ((m = pegar(/score >= (\d+) \? "alta" : score >= (\d+) \? "media"/, 'limiares de prioridade'))) {
    VAL.LIMIAR_ALTA = m[1]; VAL.LIMIAR_MEDIA = m[2]; VAL.LIMIAR_ALTA_MENOS1 = String(Number(m[1]) - 1);
  }
  VAL.N_SECOES = String(SECTIONS.length);
  VAL.N_PROGRESSO = String(SECTIONS.filter(s => s.id !== 'graficos' && s.id !== 'historico').length);
  VAL.MAPA_SECOES = SECTIONS.map((s, i) => String(i + 1).padStart(2, '0') + ' ' + s.label).join('; ');
  VAL.PESOS_SITUACOES = agruparPesos(literal('SITUACOES_SOCIAIS_PESO'));
  VAL.PESOS_VULNERAB = agruparPesos(literal('VULNERABILIDADES_PESO'));
  // fatores fixos de computePrioridade(): "if (cond) add(N, "rótulo")"
  const ini = app.indexOf('function computePrioridade('), fim = app.indexOf('\n}\n', ini);
  const corpoPri = app.slice(ini, fim), fat = {};
  for (const m2 of corpoPri.matchAll(/if \(([^\n]*?)\) add\((\d+), "([^"]+)"\);/g))
    if (!/^Mais de|^Nenhum atendimento/.test(m2[3])) (fat[m2[2]] = fat[m2[2]] || []).push(m2[3]);
  VAL.FATORES_PRIORIDADE = Object.keys(fat).map(Number).sort((a, b) => b - a).map(p => p + ' pontos: ' + fat[p].join('; ')).join('. ');
  VAL.ANEXO_IMG_MAX = (pegar(/ANEXO_IMG_MAX_DIM = (\d+)/, 'ANEXO_IMG_MAX_DIM') || [0, '1600'])[1];
  const A = anexoBytes;
  if (A.ANEXO_MAX_BYTES_CLOUD && A.ANEXO_MAX_BYTES_LOCAL)
    VAL.ANEXO_LIMITES = 'Limites: com a nuvem ativa, cada arquivo pode ter até ' + bytesTxt(A.ANEXO_MAX_BYTES_CLOUD) + ' (aviso a partir de ' + bytesTxt(A.ANEXO_AVISO_BYTES_CLOUD) +
      ') e a soma por ficha até ' + bytesTxt(A.ANEXO_TOTAL_MAX_CLOUD) + ' (aviso a partir de ' + bytesTxt(A.ANEXO_TOTAL_AVISO_CLOUD) +
      '); no modo local, sem nuvem, até ' + bytesTxt(A.ANEXO_MAX_BYTES_LOCAL) + ' por arquivo (aviso a partir de ' + bytesTxt(A.ANEXO_AVISO_BYTES_LOCAL) +
      ') e ' + bytesTxt(A.ANEXO_TOTAL_MAX_LOCAL) + ' por ficha (aviso a partir de ' + bytesTxt(A.ANEXO_TOTAL_AVISO_LOCAL) + '). Arquivo acima do limite é recusado com aviso.';
  else falta.push('limites de anexos');
  const L = (nome, chave) => { const t = listaTxt(literal(nome)); if (!t) falta.push(nome); VAL[chave] = t; };
  L('ANEXO_CATEGORIAS', 'ANEXO_CATEGORIAS'); L('TIPOS_ATENDIMENTO', 'TIPOS_ATENDIMENTO'); L('METAS_FIXAS', 'METAS_FIXAS');
  L('ESTADO_CIVIL_OPCOES', 'ESTADO_CIVIL'); L('MIGRACAO_DOCUMENTACAO', 'MIGRACAO'); L('HABITACAO_TIPO', 'HAB_TIPO');
  L('BENEFICIO_EVENTUAL_TIPOS', 'BEN_TIPOS'); L('BENEFICIO_EVENTUAL_SITUACOES_VULNERAB', 'BEN_SITUACOES');
  L('BENEFICIO_EVENTUAL_FORMAS', 'BEN_FORMAS'); L('BENEFICIO_EVENTUAL_SITUACAO_REQ', 'BEN_SITUACAO_REQ');
  L('ENCAMINHAMENTO_AREAS', 'ENC_AREAS'); L('DASH_PERIODOS', 'PERIODOS'); L('DASH_SECOES_NAV', 'DASH_NAV');
  // Conferências de coisas que o manual afirma em texto: se o código mudar, o gerador avisa.
  [[/INATIVIDADE_AVISO_MS = 60 \* 1000/, 'aviso de 1 min antes da inatividade'],
   [/diasSemRegistro\(p\) \|\| 0\) >= 30/, 'destaque de 30+ dias sem registro'],
   [/diasSemAtendimento >= 90\) add\(4/, 'prioridade: 90 dias = 4 pontos'],
   [/diasSemAtendimento >= 60\) add\(3/, 'prioridade: 60 dias = 3 pontos'],
   [/diasSemAtendimento >= 30\) add\(1/, 'prioridade: 30 dias = 1 ponto'],
   [/Nenhum atendimento técnico registrado desde o início do PAF/, 'prioridade: sem atendimento desde o início'],
   [/Math\.min\(pcdCount, 3\)/, 'prioridade: PCD máx. 3'], [/Math\.min\(idosoCount, 2\)/, 'prioridade: idosos máx. 2'],
   [/>= 60\)\.length/, 'prioridade: idoso = 60 anos ou mais'],
   [/"Domicílio em área de risco"/, 'fator área de risco'],
   [/e\.altKey && \(e\.key === "ArrowRight"/, 'atalho Alt+setas'], [/e\.key === "\/"/, 'atalho /'],
   [/Máximo/, 'tamanho de texto Máximo'], [/paif_modo_foco/, 'modo foco'],
   [/state\.saveTimer = setTimeout/, 'autosave']
  ].forEach(([re, nome]) => { if (!re.test(app)) falta.push('conferência: ' + nome); });
}
if (falta.length) { console.error('ERRO: o manual depende de trechos do app.js que não foram encontrados:\n - ' + falta.join('\n - ')); process.exit(1); }

const SECAO_DO_MANUAL = [
  [/^Cabeçalho e Membros/, 'cabecalho'], [/^Diagnóstico/, 'diagnostico'], [/^Situações, Trabalho/, 'grupo'],
  [/^Encaminhamentos \(seção 05\)/, 'encaminhamentos'], [/^Programas e Benefícios/, 'programas'], [/^Benefício Eventual/, 'beneficioEventual'],
  [/^Registro de atendimentos/, 'metas'], [/^Estratégias, Plano/, 'plano'], [/^Anexos/, 'anexos'],
  [/^Anotações por dia/, 'observacoes'], [/^Histórico de Evolução/, 'historico']
];
let nManual = 0;
manual.split(/^## /m).slice(1).forEach(bloco => {
  const nl = bloco.indexOf('\n');
  const titulo = bloco.slice(0, nl).trim();
  const texto = bloco.slice(nl + 1).trim().replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in VAL)) { console.error('ERRO: marcador desconhecido no manual: {{' + k + '}}'); process.exit(1); }
    return VAL[k];
  });
  const sec = (SECAO_DO_MANUAL.find(([re]) => re.test(titulo)) || [])[1];
  partir(texto.replace(/\s+/g, ' '), 800).forEach((p, i, arr) => {
    nManual++;
    add('umbrella-manual', 'Umbrella, manual: ' + titulo + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''),
      'Manual do app Umbrella (como o app funciona e calcula)', titulo + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : ''), p,
      { tipo: 'apoio', ...(sec ? { secao: sec } : {}) });
  });
});
/* ------------------------------------------------------------ 9. PAF em perguntas e respostas (docs/paf-perguntas-e-respostas.md) */

const pafFaq = fs.readFileSync(path.join(raiz, 'docs', 'paf-perguntas-e-respostas.md'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
let nPafFaq = 0;
pafFaq.split(/^## /m).slice(1).forEach(bloco => {
  const nl = bloco.indexOf('\n');
  const pergunta = bloco.slice(0, nl).trim();
  const texto = bloco.slice(nl + 1).trim().replace(/\s+/g, ' ');
  partir(texto, 800).forEach((p, i, arr) => {
    nPafFaq++;
    const ref = pergunta + (arr.length > 1 ? ' (parte ' + (i + 1) + ')' : '');
    add('umbrella-paf-faq', 'PAF, pergunta frequente: ' + ref,
      'Perguntas e respostas sobre o PAF (resumo de apoio a partir das Orientações Técnicas do PAIF, das Referências do CFP/CREPOP e do guia do Umbrella; não é norma, e prazos e números que variam por município estão marcados como tais)',
      ref, p, { tipo: 'apoio' });
  });
});
console.log('PAF perguntas e respostas:', nPafFaq, 'trechos');

console.log('manual:', nManual, 'verbetes | histórico:', nHist, '| anotações:', nNotas, '| fundamentação:', nFund);


/* ------------------------------------------------------------ saída */

verbetes.forEach((v, i) => { v.id = v.doc + '#' + (i + 1); });
const saida = verbetes.map(({ id, doc, titulo, norma, ano, referencia, rotulo, texto, tipo, secao }) => ({ id, doc, titulo, norma, ano, referencia, rotulo, texto, tipo, ...(secao ? { secao } : {}) }));
fs.writeFileSync(path.join(raiz, 'conhecimento-umbrella.json'), JSON.stringify(saida));
/* ------------------------------------------------------------ resumo para o prompt do Worker (IA) */

// A IA do Paulus roda no Worker, que não enxerga este código. Este arquivo é o resumo do que o app ensina, para ser
// colado na descrição do Umbrella do Worker (worker/apps.mjs do repositório Paulus) ou lido junto com a base.
const corta = (t, n) => {
  if (t.length <= n) return t;
  const c = t.slice(0, n), fim = Math.max(c.lastIndexOf('. '), c.lastIndexOf('; '));
  return (fim > n * 0.5 ? c.slice(0, fim + 1) : c.replace(/\s+\S*$/, '')) + ' [...]';
};
const md = [];
md.push('# Umbrella (PAF/PAIF): resumo do app para o Paulus (IA)', '',
  'Gerado por scripts/gerar-conhecimento-umbrella.mjs. Texto fixo do app: nenhum dado de família.', '',
  '## O que é o app',
  'Aplicativo web (PWA) para preencher, guardar e exportar o Plano de Acompanhamento Familiar (PAF) do Serviço de Proteção e Atendimento Integral à Família (PAIF), usado por técnicos do CRAS (Boa Vista/RR). O PAIF acompanha famílias de modo continuado, preventivo e protetivo; o PAF registra o processo (passos 2 a 4 do ciclo do PAIF).', '',
  '## Como o Paulus deve responder sobre o app',
  '- Responder sobre PAIF/SUAS e sobre como usar o app; dizer em que seção do formulário o assunto aparece ("seção 03 Diagnóstico").',
  '- Distinguir norma (lei, resolução, NOB) de orientação técnica (cadernos, trilhas, protocolos): a segunda orienta, não obriga.',
  '- Não inventar artigo, número de norma, prazo ou valor. Se o app ou a base não trazem, dizer que não encontrou e indicar o documento a consultar.',
  '- Linguagem sem culpabilizar a família; não usar "carente" nem "família desestruturada". A participação no PAIF é voluntária.',
  '- Nunca pedir nem usar nome, documento, telefone ou endereço de família. O Paulus não tem acesso aos PAFs.', '',
  '## Seções do formulário');
for (const g of saida.filter(v => v.doc === 'umbrella-secoes')) md.push('- ' + g.texto);
md.push('', '## Listas do formulário (o que o técnico pode marcar)');
for (const v of saida.filter(v => v.doc === 'umbrella-formulario')) md.push('- **' + v.referencia + '**: ' + corta(v.texto.replace(/^[^:]*:\s*/, ''), 600));
md.push('', '## Pontos-chave do PAIF presentes nas notas técnicas do app');
let secAnterior = null;
for (const v of saida.filter(v => v.doc === 'umbrella-notas-tecnicas')) {
  const sec = v.titulo.replace(/^Umbrella, /, '').replace(/: nota técnica$/, '');
  if (sec !== secAnterior) { md.push('', '### ' + sec); secAnterior = sec; }
  md.push('- **' + v.rotulo + '**: ' + corta(v.texto, 260));
}
md.push('', '## Como usar o app (resumo)');
for (const v of saida.filter(v => v.doc === 'umbrella-uso-do-app')) md.push('- ' + corta(v.texto, 300));
md.push('', '## Manual do app: regras de cálculo, telas e comportamentos');
md.push('(Texto completo de cada item está na base; aqui só o resumo. Valores como pesos e limites vêm do código do app.)');
for (const v of saida.filter(v => v.doc === 'umbrella-manual' && !/\(parte [2-9]\)$/.test(v.rotulo))) md.push('- **' + v.rotulo.replace(/ \(parte 1\)$/, '') + '**: ' + corta(v.texto, 330));

fs.mkdirSync(path.join(raiz, 'docs'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'docs', 'umbrella-para-o-worker.md'), md.join('\n') + '\n');
console.log('docs/umbrella-para-o-worker.md:', md.join('\n').length, 'caracteres');

const porDoc = {}; saida.forEach(v => { porDoc[v.doc] = (porDoc[v.doc] || 0) + 1; });
console.log('verbetes:', saida.length, porDoc, '| listas lidas:', nListas, '| bytes:', JSON.stringify(saida).length);
