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
  "Dificuldade de acesso a serviços públicos/benefícios",
  "Em contextos de violência",
  "Ausência de qualificação profissional",
  "Criança/adolescente fora da escola",
  "Criança/adolescente com baixa frequência escolar",
  "Beneficiária do PBF, em não cumprimento de condicionalidades",
  "Beneficiária(s) do BPC",
  "Situação de Trabalho infantil",
  "Membro da família em privação de liberdade",
  "Egresso de sistema penitenciário",
  "Uso abusivo de álcool e outras drogas",
  "Vivência de situações de discriminação relacionada com a cor, origem, religião, local de moradia, sexo, orientação sexual",
  "Questões relacionadas a saúde mental",
  "Membro com problemas de saúde com doença limitadora de atividades cotidianas",
  "Pessoa(s) com deficiência(s)",
  "Maternidade/Paternidade na adolescência",
  "Família migrante/refugiada em situação de abrigamento (Operação Acolhida)",
  "Outras situações"
];

const SERVICOS_BASICA = ["PAIF", "SCFV", "Serviço de Proteção Social Básica no Domicílio para Pessoas com Deficiência e Idosas"];
const SERVICOS_MEDIA = ["PAEFI", "Serviço Especializado em Abordagem Social",
  "Serviço de Proteção Social a Adolescentes em Cumprimento de Medida Socioeducativa (Liberdade Assistida e PSC)",
  "Serviço de Proteção Social Especial para Pessoas com Deficiência, Idosas e suas Famílias",
  "Serviço Especializado para Pessoas em Situação de Rua"];
const SERVICOS_ALTA = ["Acolhimento Institucional", "Acolhimento em República", "Acolhimento em Família Acolhedora",
  "Proteção em Situações de Calamidades Públicas e de Emergências"];

const PROGRAMAS_QUAIS = ["Programa Família que Acolhe (FQA)",
  "Projeto ArtCanto", "Programa Dedo Verde", "Programa Rumo Certo", "Projeto Cabelos de Prata", "Conviver",
  "Colo de Mãe"];
const BENEFICIOS_QUAIS = ["Cesta Básica", "Auxílio Natalidade", "Auxílio Funeral", "Aluguel Social", "Auxílio transporte", "Em Pecúnia (dinheiro, cartão, cheque, depósito bancário)", "Programa Bolsa Família", "BPC - Benefício de Prestação Continuada", "Cesta da Família"];

// Sugestões extras para os campos de texto livre "Outros"/"Outro" (datalist).
// O que já aparece nos checkboxes acima é removido automaticamente na hora de montar a lista,
// então não é preciso manter isso sincronizado manualmente.
const PROGRAMAS_OUTROS_SUGESTOES = ["Pé-de-Meia", "Programa Criança Feliz", "Programa de Erradicação do Trabalho Infantil (PETI)",
  "Programa Cisternas", "Seguro Defeso", "Programa Mulher Segura e Protegida", "Qualifica RR",
  "Pronatec", "Programa Bolsa Verde"];
const BENEFICIOS_OUTROS_SUGESTOES = ["Programa Bolsa Família", "BPC - Benefício de Prestação Continuada", "Cesta da Família",
  "Cesta Básica", "Auxílio Natalidade", "Auxílio Funeral", "Aluguel Social", "Auxílio transporte",
  "Vale-gás", "Auxílio-doença", "Passe livre para pessoa com deficiência"];

// Remove da lista de sugestões qualquer item que já esteja nos checkboxes (evita repetir a mesma opção duas vezes).
function outrosSugestoes(sugestoes, jaListados) {
  const jaListadosLower = jaListados.map(o => o.toLowerCase().trim());
  return sugestoes.filter(s => !jaListadosLower.includes(s.toLowerCase().trim()));
}
const REDE_APOIO = [
  // Saúde
  "UBS - Unidade Básica de Saúde", "CAPS - Centro de Atenção Psicossocial", "Hospital/Maternidade",
  "NASF - Núcleo Ampliado de Saúde da Família", "Farmácia Popular", "Vigilância em Saúde/Epidemiológica",
  // Educação
  "Creches", "Escolas (ensino regular)", "Escolas em tempo integral", "EJA - Educação de Jovens e Adultos",
  "Projetos sociais em contraturno escolar", "Núcleo/Sala de Apoio Pedagógico",
  // Assistência Social
  "CRAS", "CREAS", "Centro POP", "Casa de Acolhimento/Abrigo Institucional", "Conselho Tutelar",
  "Restaurante Popular/Banco de Alimentos",
  // Justiça e Direitos
  "Defensoria Pública", "Ministério Público", "Vara da Infância e Juventude", "Delegacia (DEAM/Delegacia da Mulher)",
  "Poder Judiciário/Fórum",
  // Comunidade e sociedade civil
  "OSC's e/ou associação de bairro", "Igrejas e instituições religiosas", "Conselhos Municipais de Direitos",
  // Migração e Refúgio
  "Abrigo/Operação Acolhida", "ACNUR - Alto Comissariado das Nações Unidas para Refugiados",
  "OIM - Organização Internacional para as Migrações", "Pastoral do Migrante/Cáritas Arquidiocesana",
  "Polícia Federal (regularização migratória)",
  // Povos Indígenas
  "FUNAI - Fundação Nacional dos Povos Indígenas", "Conselho Indígena de Roraima (CIR)",
  "SESAI - Secretaria Especial de Saúde Indígena (Polo Base/DSEI)"
];

const TIPOS_ATENDIMENTO = ["Atendimento no CRAS", "Visita Domiciliar", "Contato Telefônico", "Encaminhamento", "Reunião de Rede", "Grupo/SCFV", "Outro"];

// Objetivos do PAIF conforme a Tipificação Nacional de Serviços Socioassistenciais —
// usados para que a equipe registre, no Plano, quais objetivos do Serviço estão
// sendo trabalhados com esta família específica (evita que o PAF vire só "resolução de caso").
const OBJETIVOS_PAIF = [
  "Fortalecer a função protetiva da família, contribuindo na melhoria da sua qualidade de vida",
  "Prevenir a ruptura dos vínculos familiares e comunitários, possibilitando a superação de situações de fragilidade social vivenciadas",
  "Promover aquisições sociais e materiais às famílias, potencializando o protagonismo e a autonomia das famílias e comunidades",
  "Promover acessos a benefícios, programas de transferência de renda e serviços socioassistenciais, contribuindo para a inserção das famílias na rede de proteção social de assistência social",
  "Promover acesso a serviços setoriais, contribuindo para o usufruto de direitos",
  "Apoiar famílias que possuem, dentre seus membros, indivíduos que necessitam de cuidados, por meio da promoção de espaços coletivos de escuta e troca de vivências familiares"
];

// Seguranças socioassistenciais afiançadas pela Política Nacional de Assistência Social
// (PNAS/2004) e pela NOB-SUAS/2012 — o Plano deve indicar qual(is) delas está(ão)
// sendo trabalhada(s)/afiançada(s) para esta família, e não apenas os objetivos do Serviço.
const SEGURANCAS_SOCIOASSISTENCIAIS = [
  "Segurança de acolhida",
  "Segurança de convívio ou vivência familiar, comunitária e social",
  "Segurança de desenvolvimento da autonomia individual, familiar e social"
];

// Trabalho social coletivo do PAIF (distinto dos encaminhamentos a outros serviços/órgãos):
// ações que a própria equipe do CRAS realiza com a família e no território.
const ATIVIDADES_COLETIVAS_PAIF = [
  "Acolhida (recepção e escuta inicial da família no CRAS)",
  "Grupos de acompanhamento familiar do PAIF",
  "Grupos de Convivência e Fortalecimento de Vínculos (SCFV) articulados ao PAIF",
  "Oficinas socioeducativas com famílias",
  "Ações comunitárias, campanhas ou mutirões no território",
  "Palestras informativas sobre direitos e serviços",
  "Mobilização e articulação da rede social de apoio no território"
];

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
const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

/* ---- Aproveitado do Prontuário SUAS (MDS): habitação, saúde e encaminhamentos ---- */

const HABITACAO_TIPO = ["Própria", "Alugada", "Cedida", "Ocupada", "Abrigo/Casa de Acolhimento (Operação Acolhida)"];

// Situação documental de famílias migrantes e refugiadas (ex.: venezuelanas atendidas
// no âmbito da Operação Acolhida em Boa Vista/RR) — usada para orientar encaminhamentos
// à rede de proteção ao migrante, sem condicionar o atendimento do PAIF à regularização.
const MIGRACAO_DOCUMENTACAO = [
  "RNM - Registro Nacional Migratório", "Protocolo de Solicitação de Refúgio",
  "CPF", "Passaporte", "Certidão de Nascimento/Casamento apostilada",
  "Sem documentação até o momento"
];
const HABITACAO_PAREDES = ["Alvenaria ou madeira aparelhada", "Madeira aproveitada, taipa ou outros materiais precários"];
const HABITACAO_ENERGIA = ["Com medidor próprio", "Com medidor compartilhado", "Sem medidor", "Não possui energia elétrica"];
const HABITACAO_ESGOTO = ["Rede coletora de esgoto ou pluvial", "Fossa séptica", "Fossa rudimentar", "Direto para vala, rio, lago ou mar", "Domicílio sem banheiro"];
const HABITACAO_LIXO = ["Coleta direta", "Coleta indireta", "Não possui coleta"];

// Instrumentais técnicos do trabalho social com famílias, reconhecidos tanto pelas
// Orientações Técnicas do PAIF (MDS) quanto pelas Referências Técnicas do CFP/CREPOP
// para a atuação de psicólogas(os) no CRAS/SUAS — usados para a leitura da dinâmica e
// dos vínculos familiares, sem função clínica ou de diagnóstico individual.
const INSTRUMENTAIS_TECNICOS = [
  "Entrevista individual/familiar",
  "Escuta qualificada",
  "Observação",
  "Visita domiciliar",
  "Genograma",
  "Ecomapa",
  "Dinâmica de grupo/oficina",
  "Estudo Social",
  "Registro fotográfico do território (com autorização)"
];

const ENCAMINHAMENTO_AREAS = [
  "Outra Unidade/Serviço da Assistência Social", "Saúde", "Educação", "INSS", "Habitação", "Defensoria Pública", "Outra"
];

const SECTIONS = [
  { id: "cabecalho", label: "Cabeçalho" },
  { id: "familia", label: "Membros da Família" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "grupo", label: "Situações, Trabalho Coletivo e Serviços" },
  { id: "encaminhamentos", label: "Encaminhamentos" },
  { id: "programas", label: "Programas e Benefícios" },
  { id: "rede", label: "Rede do Território" },
  { id: "metas", label: "Metas e Evolução" },
  { id: "estrategias", label: "Estratégias e Eixos" },
  { id: "plano", label: "Elaboração do Plano" },
  { id: "encerramento", label: "Encerramento" },
  { id: "anexos", label: "Anexos" },
  { id: "observacoes", label: "Observações" }
];

// Ícones de linha (mesmo vocabulário visual do brasão do cabeçalho: traço fino,
// currentColor, formas geométricas simples) — um por seção, para reforçar
// visualmente do que trata cada etapa do PAF, sem virar decoração gratuita.
const SECTION_ICONS = {
  cabecalho: `<circle cx="12" cy="8.5" r="3.1"/><path d="M5.5 19.5c1.2-3.4 3.7-5 6.5-5s5.3 1.6 6.5 5"/>`,
  familia: `<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="8" r="2.6"/><path d="M3.2 19c.9-2.8 2.6-4.2 4.8-4.2s3.9 1.4 4.8 4.2M10.2 19c.9-2.8 2.6-4.2 4.8-4.2s3.9 1.4 4.8 4.2"/>`,
  diagnostico: `<circle cx="10.5" cy="10.5" r="5.3"/><path d="M14.6 14.6 19 19"/><path d="M8 10.5h5M10.5 8v5"/>`,
  grupo: `<path d="M4 15c0-3 1.6-5 4-5s3.3 1.4 4 2.6c.7-1.2 1.6-2.6 4-2.6s4 2 4 5"/><path d="M4 15v2.2M20 15v2.2"/><path d="M9.5 9.5a3 2.2 0 1 0 5 0"/>`,
  encaminhamentos: `<path d="M4 12h11"/><path d="m11 7 5 5-5 5"/><path d="M19 5v14"/>`,
  programas: `<rect x="4" y="9.5" width="16" height="9.5" rx="1.4"/><path d="M4 13.5h16"/><path d="M12 9.5V19"/><path d="M9 9.5c0-2 1.3-4.5 3-4.5s3 2.5 3 4.5"/>`,
  rede: `<circle cx="12" cy="5.3" r="1.9"/><circle cx="5.3" cy="17.5" r="1.9"/><circle cx="18.7" cy="17.5" r="1.9"/><path d="M12 7.2v5M12 12.2 6.6 16M12 12.2l5.4 3.8"/>`,
  metas: `<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3.6"/><path d="m16.5 7.5 3-3"/>`,
  estrategias: `<circle cx="12" cy="12" r="7.4"/><path d="m14.8 9.2-1.6 4.4-4.4 1.6 1.6-4.4z"/>`,
  plano: `<path d="M6 3.8h9l3 3v13.4H6z"/><path d="M15 3.8v3h3"/><path d="M9 12h6M9 15.4h6M9 8.6h3"/>`,
  encerramento: `<path d="M5 5.5h14v13H5z"/><path d="m8.5 12 2.4 2.4L16 9"/>`,
  anexos: `<path d="M15.8 8.2 9.6 14.4a2.8 2.8 0 1 1-4-4l6.9-6.9a2 2 0 1 1 2.8 2.8l-6.6 6.6a1.2 1.2 0 1 1-1.7-1.7l5.7-5.7"/>`,
  observacoes: `<path d="M5 5h14v10.5H10L6 19v-3.5H5z"/><path d="M8.3 8.5h7.4M8.3 11.6h4.8"/>`
};

function sectionIconSvg(id, size) {
  const s = size || 15;
  return `<svg class="section-icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SECTION_ICONS[id] || ""}</svg>`;
}

// Ilustração-assinatura do app: um arco de proteção (SUAS) acolhendo três
// figuras entrelaçadas por um traço contínuo (o vínculo/a escuta, no
// vocabulário da psicologia) — usada na tela de login e no estado vazio.
function protecaoIllustration(size) {
  const s = size || 84;
  return `<svg class="protecao-ilustracao" width="${s}" height="${s}" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M10 58C10 30 26 10 48 10s38 20 38 48" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
    <path d="M18 62C18 38 31 22 48 22s30 16 30 40" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".3"/>
    <circle cx="33" cy="52" r="6.4" stroke="currentColor" stroke-width="2"/>
    <circle cx="63" cy="52" r="6.4" stroke="currentColor" stroke-width="2"/>
    <circle cx="48" cy="40" r="7.4" stroke="currentColor" stroke-width="2"/>
    <path d="M33 58.4C33 66 39 71 48 71s15-5 15-12.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M40.5 46c2.6 2.4 5 2.4 7.5 0M48 46.5c2.6 2.4 5 2.4 7.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}

// Ícones dos três pilares do PAIF (Tipificação Nacional de Serviços Socioassistenciais:
// seguranças de acolhida, convívio/vínculos e desenvolvimento da autonomia) — mesmo
// vocabulário de traço fino dos SECTION_ICONS, usados na faixa de identidade da tela
// inicial e reforçados na tela de login.
const PILAR_ICONS = {
  acolhida: `<path d="M6 20V11.5a2 2 0 0 1 .9-1.7l4.5-3a2 2 0 0 1 2.2 0l4.5 3a2 2 0 0 1 .9 1.7V20"/><path d="M9.5 20v-5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20"/><path d="M4 20h16"/>`,
  convivio: `<circle cx="7.2" cy="9" r="2.6"/><circle cx="16.8" cy="9" r="2.6"/><circle cx="12" cy="6.2" r="2.3"/><path d="M2.6 19.4c.8-2.9 2.5-4.3 4.6-4.3M21.4 19.4c-.8-2.9-2.5-4.3-4.6-4.3"/><path d="M8 19.4c.6-3 2-4.6 4-4.6s3.4 1.6 4 4.6"/>`,
  autonomia: `<path d="M4 20 10 12l3.2 3.8L20 6"/><path d="M14.8 5.6h5.4V11"/>`
};
function pilarIconSvg(id, size) {
  const s = size || 20;
  return `<svg class="pilar-icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PILAR_ICONS[id] || ""}</svg>`;
}

// Ícone dos Aspectos Psicossociais e Instrumentais Técnicos (genograma/ecomapa):
// três núcleos entrelaçados por linhas de geração, no mesmo vocabulário de traço
// fino dos demais ícones do app — referência visual à leitura sistêmica dos
// vínculos familiares, sem remeter a um símbolo clínico ou terapêutico.
function psicossocialIconSvg(size) {
  const s = size || 17;
  return `<svg class="section-icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="6.5" cy="6" r="2.1"/><circle cx="17.5" cy="6" r="2.1"/><circle cx="12" cy="13.2" r="2.4"/>
    <path d="M6.5 8.1V10.7M17.5 8.1V10.7M9.1 12.2 12 10.9M14.9 12.2 12 10.9"/>
    <path d="M12 15.6v3M8.7 21.5h6.6"/>
  </svg>`;
}

// Faixa de identidade visual: reforça, com traço e não com foto, os três eixos do
// PAIF conforme a Tipificação Nacional — usada logo abaixo do cabeçalho da tela
// inicial para ancorar visualmente do que trata o trabalho social com famílias.
function pilaresPaifStripHTML() {
  const itens = [
    { id: "acolhida", titulo: "Acolhida", texto: "Escuta qualificada, sem exigência de comprovação prévia" },
    { id: "convivio", titulo: "Convívio e vínculos", texto: "Fortalecimento dos laços familiares e comunitários" },
    { id: "autonomia", titulo: "Autonomia", texto: "Protagonismo da família na construção do próprio percurso" }
  ];
  return `
  <div class="home-pilares">
    ${itens.map(it => `
      <div class="pilar-item">
        <span class="pilar-icon-badge">${pilarIconSvg(it.id, 19)}</span>
        <div class="pilar-texto">
          <strong>${it.titulo}</strong>
          <span>${it.texto}</span>
        </div>
      </div>`).join("")}
  </div>`;
}

/* ---------------------------- Anexos (PDF/imagem) ---------------------------- */

// Limite de referência: um documento no Firestore não pode passar de ~1 MB no total.
// Por isso comprimimos imagens automaticamente e avisamos quando os anexos de um PAF
// estiverem ficando grandes demais para sincronizar com segurança na nuvem.
// Em modo local (sem Firebase configurado) o limite é bem mais folgado, já que o
// registro fica só no localStorage deste aparelho — não precisa caber em 1 MB.
const ANEXO_AVISO_BYTES_CLOUD = 650 * 1024;   // a partir daqui, mostramos aviso (nuvem)
const ANEXO_MAX_BYTES_CLOUD = 900 * 1024;     // acima disso, recusamos o anexo (nuvem)
const ANEXO_AVISO_BYTES_LOCAL = 3 * 1024 * 1024;  // aviso em modo local
const ANEXO_MAX_BYTES_LOCAL = 4 * 1024 * 1024;    // recusa em modo local
const ANEXO_IMG_MAX_DIM = 1600;         // redimensiona imagens maiores que isso
const ANEXO_IMG_QUALIDADE = 0.72;       // qualidade do JPEG comprimido

function anexoAvisoBytes() { return state.mode === "cloud" ? ANEXO_AVISO_BYTES_CLOUD : ANEXO_AVISO_BYTES_LOCAL; }
function anexoMaxBytes() { return state.mode === "cloud" ? ANEXO_MAX_BYTES_CLOUD : ANEXO_MAX_BYTES_LOCAL; }

function fmtBytes(n) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

function totalAnexosBytes(paf) {
  return (paf.anexos || []).reduce((sum, a) => sum + (a.tamanho || 0), 0);
}

function comprimirImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar a imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > ANEXO_IMG_MAX_DIM || height > ANEXO_IMG_MAX_DIM) {
          const escala = ANEXO_IMG_MAX_DIM / Math.max(width, height);
          width = Math.round(width * escala);
          height = Math.round(height * escala);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", ANEXO_IMG_QUALIDADE));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function lerArquivoComoDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function dataURLBytes(dataURL) {
  const base64 = (dataURL.split(",")[1] || "");
  return Math.round(base64.length * 0.75);
}

async function adicionarAnexos(fileList) {
  const arquivos = Array.from(fileList || []);
  if (!arquivos.length) return;

  for (const file of arquivos) {
    const ehImagem = file.type.startsWith("image/");
    const ehPdf = file.type === "application/pdf";
    if (!ehImagem && !ehPdf) {
      toast(`"${file.name}" não é imagem nem PDF — ignorado.`);
      continue;
    }
    try {
      const dataURL = ehImagem ? await comprimirImagem(file) : await lerArquivoComoDataURL(file);
      const tamanho = dataURLBytes(dataURL);

      if (tamanho > anexoMaxBytes()) {
        const dica = state.mode === "cloud" ? ' Se precisar anexar arquivos grandes, use o modo local (sem sincronização).' : '';
        toast(`"${file.name}" (${fmtBytes(tamanho)}) é grande demais para anexar com segurança.${dica}`);
        continue;
      }

      if (!state.current.anexos) state.current.anexos = [];
      state.current.anexos.push({
        id: uid(),
        nome: file.name,
        tipo: file.type,
        tamanho,
        dataURL,
        addedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      toast(`Não foi possível anexar "${file.name}".`);
    }
  }

  savePAF(state.current, { silent: true });
  renderApp();

  const totalDepois = totalAnexosBytes(state.current);
  if (totalDepois > anexoAvisoBytes()) {
    toast(state.mode === "cloud"
      ? `Atenção: os anexos deste PAF somam ${fmtBytes(totalDepois)}. Isso pode ultrapassar o limite de sincronização com a nuvem.`
      : `Atenção: os anexos deste PAF somam ${fmtBytes(totalDepois)}, um valor considerável para o armazenamento local do navegador.`);
  }
}

function removerAnexo(id) {
  confirmModal("Remover este anexo?", "O arquivo será apagado deste PAF.", () => {
    state.current.anexos = (state.current.anexos || []).filter(a => a.id !== id);
    savePAF(state.current, { silent: true });
    renderApp();
  });
}

function abrirAnexo(anexo) {
  const win = window.open("");
  if (!win) { toast("Bloqueador de pop-ups ativo. Permita pop-ups para visualizar."); return; }
  if (anexo.tipo === "application/pdf") {
    win.document.write(`<iframe src="${anexo.dataURL}" style="border:none;width:100%;height:100%;"></iframe>`);
  } else {
    win.document.write(`<img src="${anexo.dataURL}" style="max-width:100%;">`);
  }
}

function baixarAnexo(anexo) {
  const a = document.createElement("a");
  a.href = anexo.dataURL;
  a.download = anexo.nome || "anexo";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------------------------- Estado ---------------------------- */

const state = {
  view: "home",              // 'home' | 'editor'
  pafs: [],                  // todos os registros
  current: null,             // PAF em edição
  activeSection: "cabecalho",
  search: "",
  statusFilter: "ativos",
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
    responsavelSexo: "",
    responsavelNacionalidade: "",
    responsavelEtnia: "",
    responsavelNascimento: "",
    apelido: "",
    nomeMae: "",
    cpf: "",
    nis: "",
    rg: "", rgOrgao: "", rgUf: "", rgDataEmissao: "",
    endereco: "",
    enderecoRua: "", enderecoNumero: "", enderecoComplemento: "", enderecoBairro: "",
    enderecoMunicipio: "Boa Vista", enderecoUf: "RR", enderecoCep: "",
    pontoReferencia: "", telefones: "", localizacaoDomicilio: "",
    dataInicial: todayISO(),
    periodicidade: "",
    situacaoPAF: "andamento",
    situacaoData: "",
    membros: [{ nome: "", nascimento: "", parentesco: "", sexo: "", nacionalidade: "", etnia: "", pcd: false }],
    vulnerabilidades: [],
    vulnerabilidadesOutros: "",
    situacoesSociais: SITUACOES_SOCIAIS.map(s => ({ situacao: s, membros: "", superada: false })),
    servBasica: [], servMedia: [], servAlta: [],
    atividadesColetivas: [],
    atividadesColetivasOutras: "",
    // Diagnóstico socioeconômico (aproveitado do Prontuário SUAS)
    habitacaoTipo: "", habitacaoParedes: "", habitacaoEnergia: "", habitacaoAgua: "",
    habitacaoEsgoto: "", habitacaoLixo: "", habitacaoComodos: "", habitacaoDormitorios: "",
    habitacaoAreaRisco: "", habitacaoObs: "", habitacaoAbrigoNome: "",
    // Situação migratória (famílias migrantes/refugiadas, ex.: Operação Acolhida)
    migracaoDataChegadaBrasil: "", migracaoDocumentacao: [], migracaoDocumentacaoOutro: "",
    migracaoInteriorizacao: "",
    eduForaEscola06: "", eduForaEscola614: "", eduForaEscola1517: "",
    eduAnalfabetismo1017: "", eduAnalfabetismo1859: "", eduAnalfabetismo60mais: "", eduObs: "",
    rendaTotal: "", rendaPerCapita: "", rendaObs: "",
    saudeDoencaGrave: "", saudeDoencaGraveQuem: "",
    saudeMedicacaoControlada: "", saudeMedicacaoQuem: "",
    saudeAlcool: "", saudeAlcoolQuem: "", saudeDrogas: "", saudeDrogasQuem: "",
    saudeGestante: "", saudeGestanteQuem: "", saudeObs: "",
    instrumentaisTecnicos: [],
    aspectosPsicossociaisObs: "",
    encaminhamentosForm: [],
    participaProgramas: "",
    programasQuais: [],
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
    objetivosPaif: [],
    objetivosPaifOutros: "",
    segurancasSocioassistenciais: [],
    segurancasSocioassistenciaisOutras: "",
    prazoExecucaoPlano: "",
    prazoAvaliacaoPlano: "",
    tecnicoReferencia: "",
    dataElaboracao: todayISO(),
    encerramentoMotivo: "",
    encerramentoOutros: "",
    encerramentoTecnico: "",
    encerramentoData: "",
    observacoes: "",
    anexos: []
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
function enderecoCompleto(paf) {
  const partes = [];
  if (paf.enderecoRua) {
    let linha = paf.enderecoRua;
    if (paf.enderecoNumero) linha += ", " + paf.enderecoNumero;
    if (paf.enderecoComplemento) linha += " - " + paf.enderecoComplemento;
    partes.push(linha);
  }
  if (paf.enderecoBairro) partes.push(paf.enderecoBairro);
  const cidadeUf = [paf.enderecoMunicipio, paf.enderecoUf].filter(Boolean).join("/");
  if (cidadeUf) partes.push(cidadeUf);
  if (paf.enderecoCep) partes.push("CEP " + paf.enderecoCep);
  const montado = partes.join(" — ");
  return montado || paf.endereco || "";
}
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function protocoloNumero(pafOrId) {
  const id = typeof pafOrId === "string" ? pafOrId : (pafOrId && pafOrId.id);
  const ordenados = [...state.pafs].sort((a, b) => {
    const ca = a.createdAt || a.dataInicial || a.id || "";
    const cb = b.createdAt || b.dataInicial || b.id || "";
    return ca.localeCompare(cb);
  });
  const idx = ordenados.findIndex(p => p.id === id);
  return idx === -1 ? "—" : String(idx + 1);
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
function calcularIdade(iso) {
  if (!iso) return null;
  const nasc = new Date(iso + "T00:00:00");
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario = (hoje.getMonth() < nasc.getMonth()) ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade >= 0 ? idade : null;
}
function idadeTexto(iso) {
  const idade = calcularIdade(iso);
  if (idade == null) return "";
  return idade + (idade === 1 ? " ano" : " anos");
}
function faixaEtaria(idade) {
  if (idade == null) return "Não informada";
  if (idade < 18) return "0 a 17 anos";
  if (idade < 30) return "18 a 29 anos";
  if (idade < 45) return "30 a 44 anos";
  if (idade < 60) return "45 a 59 anos";
  return "60 anos ou mais";
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

/* ---------------------------- Config / Backup ---------------------------- */

function baixarBackupJSON() {
  const payload = {
    exportadoEm: new Date().toISOString(),
    totalRegistros: state.pafs.length,
    pafs: state.pafs
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_paf_paif_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Backup baixado.");
}

function openSettingsModal() {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  const modoLabel = state.mode === "cloud" ? "Sincronizado com a nuvem" : "Somente neste dispositivo";
  const emailLinha = state.currentUser ? `<div class="settings-field"><span class="k">Conta</span><span class="v">${escapeHtml(state.currentUser.email)}</span></div>` : "";

  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>Configurações</h3>
        <div class="settings-field"><span class="k">Armazenamento</span><span class="v">${modoLabel}</span></div>
        ${emailLinha}
        <div class="settings-field" style="margin-bottom:18px;"><span class="k">Registros salvos</span><span class="v">${state.pafs.length} PAF(s)</span></div>
        <p>Baixe uma cópia de segurança de todos os PAFs cadastrados em um único arquivo JSON.</p>
        <div class="modal-actions" style="justify-content:space-between;">
          <button class="btn btn-ghost" id="settingsCloseBtn">Fechar</button>
          <button class="btn btn-primary" id="settingsBackupBtn">Baixar backup (JSON)</button>
        </div>
      </div>
    </div>`;

  document.getElementById("settingsCloseBtn").onclick = () => root.innerHTML = "";
  document.getElementById("settingsBackupBtn").onclick = baixarBackupJSON;
}

/* ---------------------------- Resumo mensal (famílias em acompanhamento) ---------------------------- */

function computeResumoGeral() {
  const pafs = state.pafs;
  const total = pafs.length;
  const porStatus = { andamento: 0, encaminhado: 0, concluido: 0, cancelado: 0 };
  const porSexo = {}, porNacionalidade = {}, porFaixa = {}, porCras = {};
  const porVulnerabilidade = {}, porPrograma = {}, porBeneficio = {}, porEncArea = {}, porSituacaoSocial = {};
  const porHabitacao = {}, porEtnia = {}, porInteriorizacao = {};
  let totalMembros = 0, totalPCD = 0, totalEncaminhamentos = 0;
  let totalAbrigados = 0, totalIndigena = 0, totalMigracaoInformada = 0;
  const idades = [], meses = [];

  pafs.forEach(p => {
    porStatus[p.situacaoPAF] = (porStatus[p.situacaoPAF] || 0) + 1;

    const sexoLabel = p.responsavelSexo === "F" ? "Feminino" : p.responsavelSexo === "M" ? "Masculino" : "Não informado";
    porSexo[sexoLabel] = (porSexo[sexoLabel] || 0) + 1;

    const nac = (p.responsavelNacionalidade || "").trim() || "Não informada";
    porNacionalidade[nac] = (porNacionalidade[nac] || 0) + 1;

    const idade = calcularIdade(p.responsavelNascimento);
    if (idade != null) idades.push(idade);
    porFaixa[faixaEtaria(idade)] = (porFaixa[faixaEtaria(idade)] || 0) + 1;

    const cras = (p.crasNome || "").trim() || "Não informado";
    porCras[cras] = (porCras[cras] || 0) + 1;

    const membrosComNome = (p.membros || []).filter(m => m.nome);
    totalMembros += membrosComNome.length;
    totalPCD += membrosComNome.filter(m => m.pcd).length;

    (p.vulnerabilidades || []).forEach(v => { porVulnerabilidade[v] = (porVulnerabilidade[v] || 0) + 1; });

    (p.situacoesSociais || []).forEach(s => { if (s.membros) porSituacaoSocial[s.situacao] = (porSituacaoSocial[s.situacao] || 0) + 1; });

    if (p.participaProgramas === "Sim") {
      (p.programasQuais || []).forEach(pr => { porPrograma[pr] = (porPrograma[pr] || 0) + 1; });
    }
    if (p.recebeBeneficio === "Sim") {
      (p.beneficioQuais || []).forEach(b => { porBeneficio[b] = (porBeneficio[b] || 0) + 1; });
    }

    (p.encaminhamentosForm || []).forEach(e => {
      totalEncaminhamentos++;
      const area = (e.area || "").trim() || "Não informada";
      porEncArea[area] = (porEncArea[area] || 0) + 1;
    });

    const habitacao = (p.habitacaoTipo || "").trim() || "Não informado";
    porHabitacao[habitacao] = (porHabitacao[habitacao] || 0) + 1;
    const emAbrigo = habitacao.includes("Abrigo") || !!(p.habitacaoAbrigoNome || "").trim();
    if (emAbrigo) totalAbrigados++;

    const etniasDaFamilia = new Set();
    const etniaResp = (p.responsavelEtnia || "").trim();
    if (etniaResp) etniasDaFamilia.add(etniaResp);
    (p.membros || []).forEach(m => { const e = (m.etnia || "").trim(); if (e) etniasDaFamilia.add(e); });
    if (etniasDaFamilia.size) {
      totalIndigena++;
      etniasDaFamilia.forEach(e => { porEtnia[e] = (porEtnia[e] || 0) + 1; });
    }

    const temMigracao = p.migracaoDataChegadaBrasil || (p.migracaoDocumentacao || []).length || p.migracaoDocumentacaoOutro || (p.migracaoInteriorizacao && p.migracaoInteriorizacao !== "Não se aplica");
    if (temMigracao) {
      totalMigracaoInformada++;
      const interior = p.migracaoInteriorizacao || "Não informada";
      porInteriorizacao[interior] = (porInteriorizacao[interior] || 0) + 1;
    }

    const m = mesesEmAcompanhamento(p.dataInicial);
    if (m != null) meses.push(m);
  });

  const media = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const pct = n => total ? Math.round((n / total) * 100) : 0;

  return {
    total, porStatus, porSexo, porNacionalidade, porFaixa, porCras,
    porVulnerabilidade, porSituacaoSocial, porPrograma, porBeneficio, porEncArea,
    porHabitacao, porEtnia, porInteriorizacao,
    totalMembros, totalPCD, totalEncaminhamentos,
    totalAbrigados, totalIndigena, totalMigracaoInformada,
    pctAbrigados: pct(totalAbrigados), pctIndigena: pct(totalIndigena), pctMigracao: pct(totalMigracaoInformada),
    mediaMembros: total ? Math.round((totalMembros / total) * 10) / 10 : null,
    idadeMedia: media(idades), mesesMedia: media(meses)
  };
}

function computeResumoMensal() {
  const grupos = {};
  state.pafs.forEach(p => {
    const base = p.dataInicial || (p.createdAt || "").slice(0, 10);
    if (!base || base.length < 7) return;
    const ym = base.slice(0, 7);
    if (!grupos[ym]) grupos[ym] = { quantidade: 0, status: {} };
    grupos[ym].quantidade++;
    grupos[ym].status[p.situacaoPAF] = (grupos[ym].status[p.situacaoPAF] || 0) + 1;
  });

  const saidas = {};
  state.pafs.forEach(p => {
    const dataSaida = p.encerramentoData;
    if (!dataSaida || dataSaida.length < 7) return;
    const ym = dataSaida.slice(0, 7);
    if (!saidas[ym]) saidas[ym] = { quantidade: 0, motivos: {} };
    saidas[ym].quantidade++;
    const motivoLabel = ENCERRAMENTO_MOTIVOS.find(m => m.v === p.encerramentoMotivo)?.label || "Não informado";
    saidas[ym].motivos[motivoLabel] = (saidas[ym].motivos[motivoLabel] || 0) + 1;
  });

  return { grupos, saidas };
}

function labelYm(ym) {
  const [y, m] = ym.split("-");
  return `${MESES_NOMES[parseInt(m, 10) - 1] || m}/${y}`;
}
function labelYmCurto(ym) {
  const [y, m] = ym.split("-");
  const nome = MESES_NOMES[parseInt(m, 10) - 1] || m;
  return `${nome.slice(0, 3)}/${y.slice(2)}`;
}

function kpiCardHTML(valor, label) {
  return `<div class="kpi-card"><span class="kpi-valor">${valor}</span><span class="kpi-label">${escapeHtml(label)}</span></div>`;
}

function barrasHTML(obj, opts) {
  opts = opts || {};
  const entradas = Object.entries(obj).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0);
  const lista = opts.top ? entradas.slice(0, opts.top) : entradas;
  if (!lista.length) return `<p class="muted" style="font-size:12px;">Sem dados registrados.</p>`;
  const total = entradas.reduce((a, [, v]) => a + v, 0) || 1;
  const max = Math.max(...entradas.map(([, v]) => v), 1);
  return `<div class="stat-bars">` + lista.map(([k, v]) => `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${escapeHtml(k)}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(v / max * 100)}%"></div></div>
      <span class="stat-bar-value">${v} <em>(${Math.round(v / total * 100)}%)</em></span>
    </div>`).join("") + `</div>`;
}

const RESUMO_PALETA = ["#2E7D6B", "#1F5C4E", "#B98A34", "#A63D33", "#52667C", "#8B6BAE", "#3D8FA0", "#C97B4A"];

function donutChartSVG(obj, opts) {
  opts = opts || {};
  const entradasBrutas = Object.entries(obj).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!entradasBrutas.length) return `<p class="muted" style="font-size:12px;">Sem dados registrados.</p>`;

  const top = opts.top || 6;
  let entradas = entradasBrutas;
  if (entradasBrutas.length > top) {
    const principais = entradasBrutas.slice(0, top - 1);
    const outrosTotal = entradasBrutas.slice(top - 1).reduce((a, [, v]) => a + v, 0);
    entradas = [...principais, ["Outras", outrosTotal]];
  }

  const total = entradas.reduce((a, [, v]) => a + v, 0) || 1;
  const size = opts.size || 128;
  const stroke = opts.stroke || 20;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circunferencia = 2 * Math.PI * r;

  let acumulado = 0;
  const arcos = entradas.map(([k, v], i) => {
    const fracao = v / total;
    const traco = Math.max(fracao * circunferencia - 1.2, 0);
    const svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${RESUMO_PALETA[i % RESUMO_PALETA.length]}" stroke-width="${stroke}" stroke-dasharray="${traco} ${circunferencia - traco}" stroke-dashoffset="${-acumulado}" transform="rotate(-90 ${cx} ${cy})"/>`;
    acumulado += fracao * circunferencia;
    return svg;
  }).join("");

  const legenda = entradas.map(([k, v], i) => `
    <div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${RESUMO_PALETA[i % RESUMO_PALETA.length]}"></span>
      <span class="donut-legend-label">${escapeHtml(k)}</span>
      <span class="donut-legend-value">${v} <em>(${Math.round(v / total * 100)}%)</em></span>
    </div>`).join("");

  return `<div class="donut-wrap">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="donut-svg">
      ${arcos}
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" class="donut-total-num">${total}</text>
      <text x="${cx}" y="${cy + 13}" text-anchor="middle" class="donut-total-label">${escapeHtml(opts.centro || "total")}</text>
    </svg>
    <div class="donut-legend">${legenda}</div>
  </div>`;
}

function evolucaoBarChartSVG(linhasCrescentes, grupos, saidas, opts) {
  opts = opts || {};
  const limite = opts.limite || 12;
  const meses = linhasCrescentes.slice(-limite);
  if (!meses.length) return `<p class="muted" style="font-size:12px;">Sem dados suficientes para o gráfico.</p>`;

  const valores = meses.map(ym => ({
    ym,
    inc: grupos[ym]?.quantidade || 0,
    exc: saidas[ym]?.quantidade || 0
  }));
  const maxValor = Math.max(...valores.map(v => Math.max(v.inc, v.exc)), 1);

  const colW = 46;
  const chartH = 120;
  const padTop = 10, padBottom = 34, padSide = 6;
  const width = meses.length * colW + padSide * 2;
  const height = chartH + padTop + padBottom;
  const barW = 14;

  const barras = valores.map((v, i) => {
    const x0 = padSide + i * colW;
    const hInc = Math.round((v.inc / maxValor) * chartH);
    const hExc = Math.round((v.exc / maxValor) * chartH);
    const yInc = padTop + (chartH - hInc);
    const yExc = padTop + (chartH - hExc);
    return `
      <g>
        <rect x="${x0 + colW / 2 - barW - 2}" y="${yInc}" width="${barW}" height="${hInc}" fill="var(--accent, #2E7D6B)" rx="2"></rect>
        <rect x="${x0 + colW / 2 + 2}" y="${yExc}" width="${barW}" height="${hExc}" fill="var(--danger, #B5473F)" rx="2"></rect>
        ${v.inc ? `<text x="${x0 + colW / 2 - barW / 2 - 2}" y="${yInc - 3}" text-anchor="middle" class="chart-bar-num">${v.inc}</text>` : ""}
        ${v.exc ? `<text x="${x0 + colW / 2 + barW / 2 + 2}" y="${yExc - 3}" text-anchor="middle" class="chart-bar-num">${v.exc}</text>` : ""}
        <text x="${x0 + colW / 2}" y="${padTop + chartH + 16}" text-anchor="middle" class="chart-bar-mes">${labelYmCurto(v.ym)}</text>
      </g>`;
  }).join("");

  return `
    <div class="chart-legend-inline">
      <span><i style="background:var(--accent, #2E7D6B)"></i> Incluídas</span>
      <span><i style="background:var(--danger, #B5473F)"></i> Excluídas</span>
    </div>
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="xMinYMin meet" class="evolucao-chart">
      <line x1="${padSide}" y1="${padTop + chartH}" x2="${width - padSide}" y2="${padTop + chartH}" stroke="var(--line,#d7dee4)" stroke-width="1"></line>
      ${barras}
    </svg>`;
}

function assinaturaHTML() {
  return `
    <div class="assinatura-bloco">
      <div class="assinatura-linha"></div>
      <p class="assinatura-nome">Paulo Luã Oliveira Xavier</p>
      <p class="assinatura-cargo">Psicólogo — CRP-20/09816</p>
      <p class="assinatura-local">Boa Vista/RR, ${fmtDateBR(todayISO())}</p>
    </div>`;
}

function resumoGeralHTML(r) {
  return `
    <div class="kpi-grid">
      ${kpiCardHTML(r.total, "Total de PAFs")}
      ${kpiCardHTML(r.porStatus.andamento || 0, "Em andamento")}
      ${kpiCardHTML(r.porStatus.encaminhado || 0, "Encaminhados")}
      ${kpiCardHTML(r.porStatus.concluido || 0, "Concluídos")}
      ${kpiCardHTML(r.porStatus.cancelado || 0, "Cancelados")}
      ${kpiCardHTML(r.totalMembros, "Pessoas acompanhadas")}
      ${kpiCardHTML(r.mediaMembros ?? "—", "Média por família")}
      ${kpiCardHTML(r.totalPCD, "Pessoas com deficiência")}
      ${kpiCardHTML(r.idadeMedia != null ? r.idadeMedia + " anos" : "—", "Idade média (responsável)")}
      ${kpiCardHTML(r.mesesMedia != null ? r.mesesMedia : "—", "Meses médios de acompanhamento")}
      ${kpiCardHTML(r.totalEncaminhamentos, "Encaminhamentos registrados")}
      ${kpiCardHTML(r.totalAbrigados + " (" + r.pctAbrigados + "%)", "Famílias em abrigo/Op. Acolhida")}
    </div>

    <div class="resumo-secao">
      <h4>Situação dos PAFs e perfil do responsável familiar</h4>
      <div class="resumo-cols resumo-cols-donut">
        <div><strong>Situação do PAF</strong>${donutChartSVG({ "Em andamento": r.porStatus.andamento || 0, "Encaminhado": r.porStatus.encaminhado || 0, "Concluído": r.porStatus.concluido || 0, "Cancelado": r.porStatus.cancelado || 0 }, { centro: "PAFs" })}</div>
        <div><strong>Sexo do responsável</strong>${donutChartSVG(r.porSexo, { centro: "famílias" })}</div>
        <div><strong>Faixa etária</strong>${donutChartSVG(r.porFaixa, { centro: "famílias" })}</div>
      </div>
    </div>

    <div class="resumo-secao">
      <div class="resumo-cols">
        <div><strong>Nacionalidade do responsável</strong>${barrasHTML(r.porNacionalidade)}</div>
        <div><strong>Distribuição por CRAS</strong>${barrasHTML(r.porCras)}</div>
      </div>
    </div>

    <div class="resumo-secao">
      <h4>Território, migração e povos indígenas</h4>
      <div class="kpi-grid kpi-grid-sec">
        ${kpiCardHTML(r.totalAbrigados + " (" + r.pctAbrigados + "%)", "Em abrigo / Operação Acolhida")}
        ${kpiCardHTML(r.totalMigracaoInformada + " (" + r.pctMigracao + "%)", "Com situação migratória registrada")}
        ${kpiCardHTML(r.totalIndigena + " (" + r.pctIndigena + "%)", "Com etnia indígena identificada")}
      </div>
      <div class="resumo-cols">
        <div><strong>Tipo de habitação</strong>${barrasHTML(r.porHabitacao)}</div>
        <div><strong>Interiorização (Op. Acolhida)</strong>${barrasHTML(r.porInteriorizacao)}</div>
        <div><strong>Etnias indígenas identificadas</strong>${barrasHTML(r.porEtnia, { top: 8 })}</div>
      </div>
    </div>

    <div class="resumo-secao">
      <div class="resumo-cols">
        <div><strong>Vulnerabilidades mais frequentes</strong>${barrasHTML(r.porVulnerabilidade, { top: 8 })}</div>
        <div><strong>Situações sociais mais frequentes</strong>${barrasHTML(r.porSituacaoSocial, { top: 8 })}</div>
      </div>
    </div>

    <div class="resumo-secao">
      <div class="resumo-cols">
        <div><strong>Programas/projetos mais frequentes</strong>${barrasHTML(r.porPrograma, { top: 8 })}</div>
        <div><strong>Benefícios mais frequentes</strong>${barrasHTML(r.porBeneficio, { top: 8 })}</div>
        <div><strong>Encaminhamentos por área</strong>${barrasHTML(r.porEncArea, { top: 8 })}</div>
      </div>
    </div>`;
}

function resumoMensalTabelaHTML(dados) {
  const { grupos, saidas } = dados;
  const meses = Array.from(new Set([...Object.keys(grupos), ...Object.keys(saidas)])).sort().reverse();
  if (!meses.length) return `<p class="muted">Nenhum PAF com data inicial ou de encerramento preenchida ainda.</p>`;

  const linhasCrescentes = [...meses].reverse();
  const totalIncluidas = linhasCrescentes.reduce((a, ym) => a + (grupos[ym]?.quantidade || 0), 0);
  const totalExcluidas = linhasCrescentes.reduce((a, ym) => a + (saidas[ym]?.quantidade || 0), 0);

  let acumulado = 0;
  const acumulados = {};
  linhasCrescentes.forEach(ym => {
    acumulado += (grupos[ym]?.quantidade || 0) - (saidas[ym]?.quantidade || 0);
    acumulados[ym] = acumulado;
  });

  return `
    <div class="chart-box">
      ${evolucaoBarChartSVG(linhasCrescentes, grupos, saidas, { limite: 12 })}
      ${linhasCrescentes.length > 12 ? `<p class="hint" style="margin-top:4px;">Gráfico com os últimos 12 meses. A tabela abaixo traz o histórico completo.</p>` : ""}
    </div>
    <table class="resumo-tabela">
      <thead><tr><th>Mês</th><th>Incluídas</th><th>Excluídas</th><th>Saldo</th><th>Acumulado</th></tr></thead>
      <tbody>
        ${meses.map(ym => {
          const inc = grupos[ym]?.quantidade || 0;
          const exc = saidas[ym]?.quantidade || 0;
          const saldo = inc - exc;
          const motivosTitle = saidas[ym] ? Object.entries(saidas[ym].motivos).map(([k, v]) => `${k}: ${v}`).join(" · ") : "";
          return `<tr>
            <td>${labelYm(ym)}</td>
            <td>${inc}</td>
            <td${motivosTitle ? ` title="${escapeHtml(motivosTitle)}"` : ""}>${exc}</td>
            <td style="color:${saldo > 0 ? "var(--accent-dark)" : saldo < 0 ? "var(--danger)" : "inherit"};font-weight:600;">${saldo > 0 ? "+" : ""}${saldo}</td>
            <td>${acumulados[ym]}</td>
          </tr>`;
        }).join("")}
      </tbody>
      <tfoot><tr><th>Total</th><th>${totalIncluidas}</th><th>${totalExcluidas}</th><th>${totalIncluidas - totalExcluidas > 0 ? "+" : ""}${totalIncluidas - totalExcluidas}</th><th></th></tr></tfoot>
    </table>
    <p class="hint" style="margin-top:6px;">Incluídas: famílias com data de início nesse mês. Excluídas: famílias com data de encerramento nesse mês (passe o mouse sobre o número para ver os motivos). Acumulado: saldo líquido de famílias em acompanhamento.</p>`;
}

function openResumoModal() {
  const root = document.getElementById("modalRoot");
  if (!root) return;
  const geral = computeResumoGeral();
  const grupos = computeResumoMensal();
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal modal-lg">
        <h3>Resumo estatístico do acompanhamento</h3>
        <p class="muted" style="margin-top:-8px;">Visão geral de todas as famílias cadastradas, com perfil dos responsáveis, vulnerabilidades, programas e evolução mensal.</p>
        <div class="resumo-scroll">
          ${resumoGeralHTML(geral)}
          <div class="resumo-secao">
            <h4>Evolução mensal (famílias incluídas e excluídas)</h4>
            ${resumoMensalTabelaHTML(grupos)}
          </div>
        </div>
        <div class="modal-actions" style="justify-content:space-between;">
          <button class="btn btn-ghost" id="resumoCloseBtn">Fechar</button>
          <button class="btn btn-primary" id="resumoImprimirBtn">Imprimir / Baixar PDF</button>
        </div>
      </div>
    </div>`;
  document.getElementById("resumoCloseBtn").onclick = () => root.innerHTML = "";
  document.getElementById("resumoImprimirBtn").onclick = () => imprimirResumoMensal(geral, grupos);
}

function imprimirResumoMensal(geral, grupos) {
  const printWin = window.open("", "_blank");
  if (!printWin) {
    toast("Bloqueador de pop-ups ativo. Permita pop-ups para exportar.");
    return;
  }
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Resumo estatístico - PAF/PAIF</title>
      <style>
        @page { margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1F3A5F; margin: 0; }
        h1 { font-size: 16px; margin: 0 0 2px; }
        h4 { font-size: 12.5px; margin: 0 0 8px; color: #1F3A5F; border-bottom: 1px solid #d7dee4; padding-bottom: 4px; }
        .sub { color: #5b7186; font-size: 11px; margin: 0 0 16px; }

        .print-masthead { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1F3A5F; padding-bottom: 10px; margin-bottom: 14px; }
        .print-masthead .brasao { width: 34px; height: 34px; border: 1.4px solid #1F3A5F; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .print-masthead .brasao span { font-family: Georgia, serif; font-weight: 700; font-size: 15px; color: #1F3A5F; }
        .print-masthead .txt strong { display: block; font-size: 12.5px; }
        .print-masthead .txt span { display: block; font-size: 10px; color: #5b7186; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
        .kpi-grid-sec { grid-template-columns: repeat(3, 1fr); margin-bottom: 12px; }
        .kpi-card { border: 1px solid #d7dee4; border-radius: 6px; padding: 8px 10px; text-align: center; page-break-inside: avoid; }
        .kpi-valor { display: block; font-size: 17px; font-weight: 700; }
        .kpi-label { display: block; font-size: 9.5px; color: #5b7186; text-transform: uppercase; letter-spacing: .02em; margin-top: 2px; }
        .resumo-secao { margin-bottom: 16px; page-break-inside: avoid; }
        .resumo-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .resumo-cols strong { display: block; font-size: 11px; margin-bottom: 6px; }
        .stat-bar-row { display: grid; grid-template-columns: 1fr 60px 60px; align-items: center; gap: 6px; font-size: 10.5px; padding: 2px 0; }
        .stat-bar-track { height: 6px; background: #eef2f5; border-radius: 3px; overflow: hidden; }
        .stat-bar-fill { height: 100%; background: #2E7D6B; }
        .stat-bar-value em { color: #5b7186; font-style: normal; }
        .resumo-tabela { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        .resumo-tabela th, .resumo-tabela td { border: 1px solid #d7dee4; padding: 4px 6px; text-align: center; }
        .resumo-tabela thead th { background: #f2f5f7; }
        .resumo-tabela tfoot th { background: #f2f5f7; }

        .donut-wrap { display: flex; align-items: center; gap: 10px; }
        .donut-svg { flex-shrink: 0; }
        .donut-total-num { font-size: 17px; font-weight: 700; fill: #1F3A5F; font-family: Georgia, serif; }
        .donut-total-label { font-size: 7px; fill: #5b7186; text-transform: uppercase; letter-spacing: .03em; }
        .donut-legend { display: flex; flex-direction: column; gap: 3px; font-size: 9.5px; }
        .donut-legend-item { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .donut-legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .donut-legend-value em { color: #5b7186; font-style: normal; }

        .chart-box { page-break-inside: avoid; margin-bottom: 8px; }
        .chart-legend-inline { display: flex; gap: 14px; font-size: 10px; margin-bottom: 4px; }
        .chart-legend-inline span { display: flex; align-items: center; gap: 4px; }
        .chart-legend-inline i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
        .evolucao-chart { display: block; }
        .chart-bar-num { font-size: 8px; fill: #1F3A5F; }
        .chart-bar-mes { font-size: 8px; fill: #5b7186; }

        .assinatura-bloco { margin-top: 34px; page-break-inside: avoid; text-align: center; }
        .assinatura-linha { width: 260px; border-top: 1px solid #1F3A5F; margin: 0 auto 6px; }
        .assinatura-nome { font-size: 12px; font-weight: 700; margin: 0; }
        .assinatura-cargo { font-size: 10.5px; color: #5b7186; margin: 1px 0 0; }
        .assinatura-local { font-size: 10px; color: #5b7186; margin: 10px 0 0; }
      </style>
    </head>
    <body>
      <div class="print-masthead">
        <div class="brasao"><span>P</span></div>
        <div class="txt">
          <strong>Prefeitura Municipal de Boa Vista — SEMADS</strong>
          <span>CRAS Cristiana Vicente Nunes — Centenário, Boa Vista/RR</span>
        </div>
      </div>
      <h1>Resumo estatístico do acompanhamento — PAF/PAIF</h1>
      <p class="sub">Todas as famílias cadastradas · Emitido em ${fmtDateBR(todayISO())}</p>
      ${resumoGeralHTML(geral)}
      <div class="resumo-secao">
        <h4>Evolução mensal (famílias incluídas e excluídas)</h4>
        ${resumoMensalTabelaHTML(grupos)}
      </div>
      ${assinaturaHTML()}
      <script>window.onload = () => setTimeout(() => window.print(), 200);<\/script>
    </body>
    </html>`;
  printWin.document.write(html);
  printWin.document.close();
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
      try { localStorage.setItem("paf_cache", JSON.stringify(state.pafs)); } catch (err) { console.error(err); }
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

function safeParseArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Dados locais corrompidos, ignorando:", err);
    return [];
  }
}

function loadLocalCacheOnly() {
  state.pafs = safeParseArray(localStorage.getItem("paf_cache"));
  if (state.view === "home") renderApp();
}

function loadLocal() {
  state.pafs = safeParseArray(localStorage.getItem("paf_records"));
  renderApp();
}

function persistLocalArray() {
  try {
    localStorage.setItem("paf_records", JSON.stringify(state.pafs));
    return true;
  } catch (err) {
    console.error(err);
    toast("Não foi possível salvar neste dispositivo — armazenamento cheio ou indisponível.");
    return false;
  }
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
    const ok = persistLocalArray();
    if (ok && !opts.silent) toast("Salvo neste dispositivo.");
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

  // Migração: se novas situações sociais ou metas fixas foram adicionadas ao app
  // depois que este PAF foi criado, inclui as que estiverem faltando (sem remover
  // nem apagar o que já foi preenchido para as existentes).
  const situacoesExistentes = new Set(state.current.situacoesSociais.map(s => s.situacao));
  SITUACOES_SOCIAIS.forEach(s => {
    if (!situacoesExistentes.has(s)) state.current.situacoesSociais.push({ situacao: s, membros: "", superada: false });
  });
  const metasExistentes = new Set(state.current.metas.map(m => m.meta));
  METAS_FIXAS.forEach(m => {
    if (!metasExistentes.has(m)) state.current.metas.push({ meta: m, prazo: "", resultados: "" });
  });

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
    const matchesQ = !q || (p.responsavel || "").toLowerCase().includes(q) || (p.cpf || "").includes(q) || (p.nis || "").includes(q) || (p.apelido || "").toLowerCase().includes(q) || (p.crasNome || "").toLowerCase().includes(q);
    const matchesStatus = state.statusFilter === "ativos" ? p.situacaoPAF === "andamento"
      : state.statusFilter === "arquivados" ? (p.situacaoPAF === "encaminhado" || p.situacaoPAF === "concluido")
      : p.situacaoPAF === state.statusFilter;
    return matchesQ && matchesStatus;
  }).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const chips = ["ativos", "arquivados"].map(s => {
    const label = s === "ativos" ? "Ativos" : "Arquivados (Encaminhados/Concluídos)";
    return `<button class="filter-chip ${state.statusFilter === s ? "active" : ""}" data-status="${s}">${label}</button>`;
  }).join("");

  const rows = list.map(p => {
    const membrosCount = (p.membros || []).filter(m => m.nome).length;
    const protocolo = protocoloNumero(p);
    const inicial = escapeHtml((p.responsavel || "?").trim().charAt(0).toUpperCase() || "?");
    return `
    <div class="record-row status-${p.situacaoPAF}" data-open="${p.id}">
      <div class="record-index">${inicial}</div>
      <div class="record-main">
        <div class="record-name">${escapeHtml(p.responsavel) || "Sem nome do responsável"}</div>
        <div class="record-protocolo">Prontuário Nº ${protocolo}</div>
      </div>
      <div class="record-cras">${escapeHtml(p.crasNome) || "—"}</div>
      <div class="record-col record-membros">${membrosCount} memb.</div>
      <div class="record-col record-data">${fmtDateBR(p.dataInicial) || "—"}</div>
      <div class="record-status">
        <span class="folder-tab ${p.situacaoPAF}">${STATUS_LABELS[p.situacaoPAF] || "Em andamento"}</span>
      </div>
      <div class="record-actions">
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

  const recordsHead = `
    <div class="records-list-head">
      <span></span>
      <span>Responsável</span>
      <span>CRAS</span>
      <span>Membros</span>
      <span>Início</span>
      <span>Situação</span>
      <span></span>
    </div>`;

  const empty = `
    <div class="empty-state">
      <div class="empty-illustration">${protecaoIllustration(52)}</div>
      <p>${state.pafs.length === 0 ? "Nenhum Plano de Acompanhamento Familiar cadastrado ainda." : "Nenhum registro corresponde à busca/filtro."}</p>
      ${state.pafs.length === 0 ? '<button class="btn btn-primary" id="emptyNewBtn">+ Novo PAF</button>' : ""}
    </div>`;

  return `
  <div class="home-wrap">
    <div class="home-head">
      <div class="home-head-text">
        <p class="home-eyebrow">Sistema de Prontuários · CRAS</p>
        <h1>Planos de Acompanhamento Familiar</h1>
        <p>PAF · Serviço de Proteção e Atendimento Integral à Família (PAIF)</p>
      </div>
      <div class="home-head-illustration" aria-hidden="true">${protecaoIllustration(128)}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" id="resumoMensalBtn">Resumo mensal</button>
        <button class="btn btn-primary" id="newPafBtn">+ Novo PAF</button>
      </div>
    </div>
    ${pilaresPaifStripHTML()}
    <div class="search-row">
      <input type="search" id="searchInput" placeholder="Buscar por responsável, CPF ou CRAS…" value="${escapeHtml(state.search)}">
      <div class="filter-tabs">${chips}</div>
    </div>
    ${list.length ? `<div class="records-list">${recordsHead}${rows}</div>` : empty}
  </div>`;
}

function attachHomeHandlers() {
  document.getElementById("newPafBtn")?.addEventListener("click", newPAF);
  document.getElementById("emptyNewBtn")?.addEventListener("click", newPAF);
  document.getElementById("resumoMensalBtn")?.addEventListener("click", openResumoModal);
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
    grupo: paf.situacoesSociais.some(s => s.membros) || (paf.atividadesColetivas || []).length || paf.servBasica.length || paf.servMedia.length || paf.servAlta.length,
    encaminhamentos: (paf.encaminhamentosForm || []).length > 0,
    programas: !!paf.participaProgramas,
    rede: paf.redeApoio.length > 0,
    metas: paf.metas.some(m => m.prazo || m.resultados) || (paf.atendimentos || []).length > 0,
    estrategias: paf.estrategias.length > 0,
    plano: !!(paf.tecnicoReferencia && paf.prazoExecucaoPlano) || (paf.objetivosPaif || []).length > 0,
    encerramento: !!paf.encerramentoMotivo,
    anexos: (paf.anexos || []).length > 0,
    observacoes: !!paf.observacoes
  };
}

function renderEditorHTML() {
  const paf = state.current;
  const complete = tabCompleteness(paf);
  const totalSecoes = SECTIONS.length;
  const secoesCompletas = SECTIONS.filter(s => complete[s.id]).length;
  const progresso = Math.round((secoesCompletas / totalSecoes) * 100);
  const rail = SECTIONS.map(s => `
    <div class="tab-item ${state.activeSection === s.id ? "active" : ""} ${complete[s.id] ? "complete" : ""}" data-section="${s.id}">
      <span class="rivet"></span>${sectionIconSvg(s.id)}<span class="tab-item-label">${s.label}</span>
    </div>`).join("");

  const activeIdx = SECTIONS.findIndex(s => s.id === state.activeSection);
  const prevSection = activeIdx > 0 ? SECTIONS[activeIdx - 1] : null;
  const nextSection = activeIdx < SECTIONS.length - 1 ? SECTIONS[activeIdx + 1] : null;

  return `
  <div class="editor-wrap">
    <nav class="tab-rail ${state.railOpen ? "open" : ""}" id="tabRail">
      <div class="rail-label">Seções do PAF</div>
      <div class="rail-progress" title="${secoesCompletas} de ${totalSecoes} seções com informações preenchidas">
        <div class="rail-progress-track"><div class="rail-progress-fill" style="width:${progresso}%"></div></div>
        <span class="rail-progress-label">${progresso}% preenchido</span>
      </div>
      ${rail}
    </nav>
    <div class="form-scroll" id="formScroll">
      <div class="form-inner">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <button class="btn btn-ghost btn-sm" id="backHomeBtn">← Voltar à lista</button>
          <span class="protocolo-tag">Protocolo Nº ${protocoloNumero(paf)}</span>
          <span class="section-pos-tag">Seção ${activeIdx + 1} de ${totalSecoes}</span>
          <div class="status-picker" style="margin-left:auto">
            ${["andamento", "encaminhado", "concluido", "cancelado"].map(s => `
              <button class="status-opt ${paf.situacaoPAF === s ? "selected " + s : ""}" data-set-status="${s}">${STATUS_LABELS[s]}</button>
            `).join("")}
          </div>
        </div>
        <div class="section-content" data-section-cat="${state.activeSection}">
          ${renderSection(state.activeSection, paf)}
        </div>
        <div class="section-nav">
          ${prevSection
            ? `<button class="btn btn-ghost section-nav-btn prev" data-section="${prevSection.id}"><span class="section-nav-arrow">←</span><span class="section-nav-text"><em>Seção anterior</em><span class="section-nav-label">${prevSection.label}</span></span></button>`
            : `<span class="section-nav-spacer"></span>`}
          ${nextSection
            ? `<button class="btn btn-primary section-nav-btn next" data-section="${nextSection.id}"><span class="section-nav-text"><em>Próxima seção</em><span class="section-nav-label">${nextSection.label}</span></span><span class="section-nav-arrow">→</span></button>`
            : `<span class="section-nav-spacer"></span>`}
        </div>
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
  const secao = SECTIONS[parseInt(num, 10) - 1];
  const icon = secao ? `<span class="section-icon-badge">${sectionIconSvg(secao.id, 17)}</span>` : "";
  return `<h2><span class="num">${num}</span>${icon}${title}</h2>${sub ? `<p class="section-sub">${sub}</p>` : ""}`;
}

function notaTecnica(html) {
  return `<div class="nota-tecnica"><span class="marca"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10.5H10L6 19.5v-3.5H4z"/><path d="M8 9.3h8M8 12.4h5"/></svg>Nota técnica</span><p>${html}</p></div>`;
}

function chkList(groupName, options, selectedArr, cols) {
  return `<div class="check-list ${cols ? "grid2" : ""}">` + options.map(opt => `
    <label class="chk">
      <input type="checkbox" data-check-group="${groupName}" data-check-value="${escapeHtml(opt)}" ${selectedArr.includes(opt) ? "checked" : ""}>
      <span>${escapeHtml(opt)}</span>
    </label>`).join("") + `</div>`;
}

// Mesma lista de SEGURANCAS_SOCIOASSISTENCIAIS, mas exibida com o ícone do pilar
// correspondente (acolhida/convívio/autonomia) — reforça visualmente que estas três
// seguranças são os mesmos três pilares do PAIF já apresentados na tela inicial.
function segurancasChkList(selectedArr) {
  const pilarPorOpcao = (opt) => opt.includes("acolhida") ? "acolhida" : opt.includes("convívio") ? "convivio" : "autonomia";
  return `<div class="check-list">` + SEGURANCAS_SOCIOASSISTENCIAIS.map(opt => `
    <label class="chk chk-pilar">
      <input type="checkbox" data-check-group="segurancasSocioassistenciais" data-check-value="${escapeHtml(opt)}" ${selectedArr.includes(opt) ? "checked" : ""}>
      <span class="chk-pilar-icon">${pilarIconSvg(pilarPorOpcao(opt), 16)}</span>
      <span>${escapeHtml(opt)}</span>
    </label>`).join("") + `</div>`;
}

function situacaoMembrosField(paf, i, row) {
  const nomes = [...new Set((paf.membros || []).map(m => (m.nome || "").trim()).filter(Boolean))];
  if (!nomes.length) {
    return `<input type="text" placeholder="Cadastre os membros na seção 02 para selecioná-los aqui" data-field="situacoesSociais.${i}.membros" value="${escapeHtml(row.membros)}">`;
  }
  const selecionados = (row.membros || "").split(",").map(s => s.trim()).filter(Boolean);
  const resumo = selecionados.length ? selecionados.join(", ") : "Selecionar membros";
  return `<details class="situ-membros-dropdown">
    <summary class="situ-membros-summary" title="Clique para selecionar os membros">
      <span class="situ-membros-resumo">${escapeHtml(resumo)}</span>
      <span class="situ-membros-count">${selecionados.length ? selecionados.length : ""}</span>
    </summary>
    <div class="situ-membros-picker">
      ${nomes.map(n => `
        <label class="chk chk-mini">
          <input type="checkbox" data-situ-idx="${i}" data-situ-nome="${escapeHtml(n)}" ${selecionados.includes(n) ? "checked" : ""}>
          <span>${escapeHtml(n)}</span>
        </label>`).join("")}
    </div>
  </details>`;
}

function renderSection(id, paf) {
  switch (id) {
    case "cabecalho": return `
      <div class="section-card">
        ${sectionHeader("01", "Cabeçalho", "Identificação do CRAS, do responsável familiar e do plano.")}
        ${notaTecnica("O PAIF acompanha famílias de forma contínua, com caráter preventivo, protetivo e proativo — não se limita a resolver um \"caso\" pontual. Este PAF é o registro desse processo, com base na Lei Orgânica da Assistência Social (Lei nº 8.742/1993, alterada pela Lei nº 12.435/2011, que torna obrigatória a oferta do PAIF no CRAS), na Política Nacional de Assistência Social (PNAS/2004), nas Orientações Técnicas do PAIF (MDS) e na Tipificação Nacional de Serviços Socioassistenciais.")}
        <div class="field-grid">
          <div class="f c6"><label>Nome do CRAS</label><input type="text" data-field="crasNome" value="${escapeHtml(paf.crasNome)}"></div>
          <div class="f c6"><label>Responsável Familiar</label><input type="text" data-field="responsavel" value="${escapeHtml(paf.responsavel)}"></div>
          <div class="f c3">
            <label>Sexo (Responsável)</label>
            <select data-field="responsavelSexo">
              <option value="" ${!paf.responsavelSexo ? "selected" : ""}>—</option>
              <option value="F" ${paf.responsavelSexo === "F" ? "selected" : ""}>F</option>
              <option value="M" ${paf.responsavelSexo === "M" ? "selected" : ""}>M</option>
            </select>
          </div>
          <div class="f c3">
            <label>Data de nascimento (Responsável)</label>
            <div class="date-idade-row">
              <input type="date" data-field="responsavelNascimento" data-idade-of="idadeResponsavel" value="${escapeHtml(paf.responsavelNascimento)}">
              <span class="idade-badge" id="idadeResponsavel">${idadeTexto(paf.responsavelNascimento)}</span>
            </div>
          </div>
          <div class="f c4">
            <label>Nacionalidade (Responsável)</label>
            <input type="text" list="nacionalidadesList" data-field="responsavelNacionalidade" value="${escapeHtml(paf.responsavelNacionalidade)}">
          </div>
          <div class="f c4">
            <label>Etnia/Povo indígena (se houver)</label>
            <input type="text" list="etniasIndigenasList" placeholder="Ex.: Warao, Macuxi, Wapichana…" data-field="responsavelEtnia" value="${escapeHtml(paf.responsavelEtnia)}">
          </div>
          <div class="f c4"><label>Apelido (se relevante)</label><input type="text" data-field="apelido" value="${escapeHtml(paf.apelido)}"></div>
          <div class="f c4"><label>Nome da mãe</label><input type="text" data-field="nomeMae" value="${escapeHtml(paf.nomeMae)}"></div>
          <div class="f c4"><label>CPF</label><input type="text" data-field="cpf" placeholder="000.000.000-00" value="${escapeHtml(paf.cpf)}"></div>
          <div class="f c3"><label>NIS</label><input type="text" data-field="nis" value="${escapeHtml(paf.nis)}"></div>
          <div class="f c3"><label>Data inicial do PAF</label><input type="date" data-field="dataInicial" value="${escapeHtml(paf.dataInicial)}"></div>
          <div class="f c3"><label>Data de inclusão no sistema</label><input type="date" data-field="createdAt" value="${escapeHtml((paf.createdAt || "").slice(0, 10))}"></div>
          <div class="f c4"><label>Periodicidade de acompanhamento</label><input type="text" data-field="periodicidade" placeholder="Ex.: mensal, quinzenal…" value="${escapeHtml(paf.periodicidade)}"></div>
          <div class="f c2"><label>RG</label><input type="text" data-field="rg" value="${escapeHtml(paf.rg)}"></div>
          <div class="f c2"><label>Órgão</label><input type="text" data-field="rgOrgao" value="${escapeHtml(paf.rgOrgao)}"></div>
          <div class="f c2"><label>UF (RG)</label><input type="text" data-field="rgUf" maxlength="2" value="${escapeHtml(paf.rgUf)}"></div>
          <div class="f c3"><label>Data de emissão</label><input type="date" data-field="rgDataEmissao" value="${escapeHtml(paf.rgDataEmissao)}"></div>
          <div class="f c3"><label>Data da situação atual</label><input type="date" data-field="situacaoData" value="${escapeHtml(paf.situacaoData)}"></div>
        </div>
        <p class="hint" style="margin-top:6px;">"Data de inclusão no sistema" define a posição deste PAF no número de protocolo e serve para lançar registros antigos, de antes da criação do aplicativo, com uma data anterior à de hoje. Ela não altera a "Data inicial do PAF" (data em que o acompanhamento com a família começou de fato), usada no Resumo mensal.</p>
      </div>
      <div class="section-card">
        <h2><span class="num">01a</span>Endereço</h2>
        <div class="field-grid">
          <div class="f c8"><label>Rua/Avenida</label><input type="text" data-field="enderecoRua" value="${escapeHtml(paf.enderecoRua)}"></div>
          <div class="f c4"><label>Número</label><input type="text" data-field="enderecoNumero" value="${escapeHtml(paf.enderecoNumero)}"></div>
          <div class="f c4"><label>Complemento</label><input type="text" data-field="enderecoComplemento" value="${escapeHtml(paf.enderecoComplemento)}"></div>
          <div class="f c4"><label>Bairro</label><input type="text" data-field="enderecoBairro" value="${escapeHtml(paf.enderecoBairro)}"></div>
          <div class="f c4"><label>CEP</label><input type="text" data-field="enderecoCep" placeholder="00000-000" value="${escapeHtml(paf.enderecoCep)}"></div>
          <div class="f c4"><label>Município</label><input type="text" data-field="enderecoMunicipio" value="${escapeHtml(paf.enderecoMunicipio)}"></div>
          <div class="f c2"><label>UF</label><input type="text" data-field="enderecoUf" maxlength="2" value="${escapeHtml(paf.enderecoUf)}"></div>
          <div class="f c6"><label>Ponto de referência</label><input type="text" data-field="pontoReferencia" value="${escapeHtml(paf.pontoReferencia)}"></div>
          <div class="f c6"><label>Telefones de contato</label><input type="text" data-field="telefones" value="${escapeHtml(paf.telefones)}"></div>
          <div class="f c12">
            <label>Localização do domicílio</label>
            <div class="radio-row">
              ${["Urbano", "Rural"].map(v => `<label><input type="radio" name="localizacaoDomicilio" data-field="localizacaoDomicilio" value="${v}" ${paf.localizacaoDomicilio === v ? "checked" : ""}> ${v}</label>`).join("")}
            </div>
          </div>
          <div class="f c12"><label>Endereço resumido (usado na listagem e nos documentos, caso o detalhamento acima não seja preenchido)</label><input type="text" data-field="endereco" value="${escapeHtml(paf.endereco)}"></div>
        </div>
      </div>`;

    case "familia": return `
      <div class="section-card">
        ${sectionHeader("02", "Membros da Família em Acompanhamento", "")}
        ${notaTecnica("O campo \"Parentesco\" deve refletir o arranjo familiar real da família atendida, sem pressupor o modelo nuclear tradicional (pai, mãe e filhos). As Referências Técnicas do CFP/CREPOP para atuação no CRAS/SUAS chamam atenção para a diversidade de configurações familiares — famílias monoparentais, homoafetivas, chefiadas por mulheres, ou pessoas sem núcleo familiar de referência — como parte legítima do público do PAIF.")}
        <table class="dyn-table">
          <thead><tr><th style="width:15%">Nome</th><th style="width:11%">Nascimento</th><th style="width:6%">Sexo</th><th style="width:12%">Parentesco</th><th style="width:14%">Nacionalidade</th><th style="width:14%">Etnia indígena</th><th style="width:6%">PCD</th><th></th></tr></thead>
          <tbody>
            ${paf.membros.map((m, i) => `
              <tr>
                <td><input type="text" data-field="membros.${i}.nome" value="${escapeHtml(m.nome)}"></td>
                <td>
                  <input type="date" data-field="membros.${i}.nascimento" data-idade-of="idadeMembro${i}" value="${escapeHtml(m.nascimento)}">
                  <span class="idade-badge idade-badge-sm" id="idadeMembro${i}">${idadeTexto(m.nascimento)}</span>
                </td>
                <td>
                  <select data-field="membros.${i}.sexo">
                    <option value="" ${!m.sexo ? "selected" : ""}>—</option>
                    <option value="F" ${m.sexo === "F" ? "selected" : ""}>F</option>
                    <option value="M" ${m.sexo === "M" ? "selected" : ""}>M</option>
                  </select>
                </td>
                <td><input type="text" data-field="membros.${i}.parentesco" value="${escapeHtml(m.parentesco)}"></td>
                <td><input type="text" list="nacionalidadesList" data-field="membros.${i}.nacionalidade" value="${escapeHtml(m.nacionalidade)}"></td>
                <td><input type="text" list="etniasIndigenasList" data-field="membros.${i}.etnia" value="${escapeHtml(m.etnia)}"></td>
                <td style="text-align:center;"><input type="checkbox" data-field-check="membros.${i}.pcd" ${m.pcd ? "checked" : ""} title="Pessoa com deficiência"></td>
                <td><button class="row-del" data-action="remove-membro" data-idx="${i}" title="Remover" aria-label="Remover membro">✕</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
        <button class="add-row-btn" data-action="add-membro">+ Adicionar membro</button>
      </div>

      <div class="section-card">
        <h2><span class="num">02a</span>Situação Migratória e de Abrigamento</h2>
        ${notaTecnica("Boa Vista/RR é uma das principais portas de entrada da migração venezuelana no Brasil, e muitas famílias atendidas pelo CRAS vivem em abrigos federais da Operação Acolhida enquanto aguardam regularização documental ou interiorização para outros estados. O PAIF deve acolher essas famílias sem exigir comprovação migratória prévia como condição de atendimento — a situação documental orienta os encaminhamentos à rede de proteção ao migrante e ao refugiado, mas não restringe o acesso ao Serviço. Preencher esta seção apenas quando aplicável.")}
        <div class="field-grid">
          <div class="f c4">
            <label>Data de chegada ao Brasil</label>
            <input type="date" data-field="migracaoDataChegadaBrasil" value="${escapeHtml(paf.migracaoDataChegadaBrasil)}">
          </div>
          <div class="f c8">
            <label>Aguarda ou já passou por interiorização (Operação Acolhida)?</label>
            <div class="radio-row">
              ${["Aguardando interiorização", "Já interiorizada(o)", "Não se aplica"].map(v => `<label><input type="radio" name="migracaoInteriorizacao" data-field="migracaoInteriorizacao" value="${v}" ${paf.migracaoInteriorizacao === v ? "checked" : ""}> ${v}</label>`).join("")}
            </div>
          </div>
          <div class="f c12">
            <label>Situação documental migratória</label>
            ${chkList("migracaoDocumentacao", MIGRACAO_DOCUMENTACAO, paf.migracaoDocumentacao || [], true)}
          </div>
          <div class="f c12"><label>Outro documento</label><input type="text" data-field="migracaoDocumentacaoOutro" value="${escapeHtml(paf.migracaoDocumentacaoOutro)}"></div>
        </div>
      </div>`;

    case "diagnostico": {
      const simNao = (field, val, quemField, quemVal) => `
        <div class="f c6">
          <label>${{
            habitacaoAreaRisco: "Domicílio em área de risco (desabamento/alagamento)?",
            saudeDoencaGrave: "Algum membro é portador de doença grave?",
            saudeMedicacaoControlada: "Uso de remédios controlados (tarja preta)?",
            saudeAlcool: "Uso abusivo de álcool?",
            saudeDrogas: "Uso abusivo de outras drogas (crack, cocaína, maconha etc)?",
            saudeGestante: "Há gestante(s) na família?"
          }[field] || ""}</label>
          <div class="radio-row">
            ${["Sim", "Não"].map(v => `<label><input type="radio" name="${field}" data-field="${field}" value="${v}" ${val === v ? "checked" : ""}> ${v}</label>`).join("")}
          </div>
        </div>
        ${quemField ? `<div class="f c6"><label>Se sim, nome(s) do(s) membro(s)</label><input type="text" data-field="${quemField}" value="${escapeHtml(quemVal)}"></div>` : ""}`;

      return `
      <div class="section-card">
        ${sectionHeader("03", "Diagnóstico", "Família inserida em acompanhamento familiar no PAIF para superação da(s) seguinte(s) vulnerabilidade(s):")}
        ${notaTecnica("Vulnerabilidade, para a PNAS, vai além da renda: é uma leitura dinâmica das situações de desproteção social vividas pela família, moldadas por seus recursos e pelo território — e não um traço fixo ou definitivo de quem é atendido. As Referências Técnicas do CFP/CREPOP para o CRAS/SUAS reforçam que a vulnerabilidade não deve ser tratada como atributo individual da família nem usada para culpabilizá-la por sua condição de pobreza, mas compreendida à luz de condições sociais, econômicas e históricas mais amplas — sem prejuízo do reconhecimento das potencialidades e da capacidade de protagonismo de cada família no seu próprio processo. Vale cuidado também com o vocabulário usado no registro: termos como \"carente\" reduzem a família a uma simples falta e escondem o caráter relacional da pobreza; \"família desestruturada\" supõe um modelo único e ideal de família e tende a culpabilizá-la por dificuldades que têm origem em condições sociais, econômicas e históricas mais amplas. Prefira descrever a situação concreta vivida pela família (renda, moradia, acesso a serviços, vínculos) a rotulá-la com esses termos.")}
        ${chkList("vulnerabilidades", VULNERABILIDADES_FAMILIA, paf.vulnerabilidades)}
        <div class="f" style="margin-top:12px"><label>Outros</label><input type="text" data-field="vulnerabilidadesOutros" value="${escapeHtml(paf.vulnerabilidadesOutros)}"></div>
      </div>

      <div class="section-card">
        <h2><span class="num">03a</span>Condições Habitacionais</h2>
        <div class="field-grid">
          <div class="f c3"><label>Tipo de residência</label><select data-field="habitacaoTipo"><option value="">—</option>${HABITACAO_TIPO.map(v => `<option value="${v}" ${paf.habitacaoTipo === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f c3"><label>Nome do abrigo (se aplicável)</label><input type="text" data-field="habitacaoAbrigoNome" placeholder="Preencher se a família mora em abrigo" value="${escapeHtml(paf.habitacaoAbrigoNome)}"></div>
          <div class="f c5"><label>Material das paredes externas</label><select data-field="habitacaoParedes"><option value="">—</option>${HABITACAO_PAREDES.map(v => `<option value="${v}" ${paf.habitacaoParedes === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f c4"><label>Acesso a energia elétrica</label><select data-field="habitacaoEnergia"><option value="">—</option>${HABITACAO_ENERGIA.map(v => `<option value="${v}" ${paf.habitacaoEnergia === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f c3">
            <label>Possui água canalizada?</label>
            <div class="radio-row">${["Sim", "Não"].map(v => `<label><input type="radio" name="habitacaoAgua" data-field="habitacaoAgua" value="${v}" ${paf.habitacaoAgua === v ? "checked" : ""}> ${v}</label>`).join("")}</div>
          </div>
          <div class="f c5"><label>Escoamento sanitário</label><select data-field="habitacaoEsgoto"><option value="">—</option>${HABITACAO_ESGOTO.map(v => `<option value="${v}" ${paf.habitacaoEsgoto === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f c4"><label>Coleta de lixo</label><select data-field="habitacaoLixo"><option value="">—</option>${HABITACAO_LIXO.map(v => `<option value="${v}" ${paf.habitacaoLixo === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="f c3"><label>Nº total de cômodos</label><input type="text" data-field="habitacaoComodos" value="${escapeHtml(paf.habitacaoComodos)}"></div>
          <div class="f c3"><label>Nº de dormitórios</label><input type="text" data-field="habitacaoDormitorios" value="${escapeHtml(paf.habitacaoDormitorios)}"></div>
          ${simNao("habitacaoAreaRisco", paf.habitacaoAreaRisco)}
          <div class="f c12"><label>Observações sobre a habitação</label><textarea rows="2" data-field="habitacaoObs">${escapeHtml(paf.habitacaoObs)}</textarea></div>
        </div>
      </div>

      <div class="section-card">
        <h2><span class="num">03b</span>Condições Educacionais</h2>
        <div class="field-grid">
          <div class="f c4"><label>Qtd. de pessoas entre 0-5 anos fora da escola/creche</label><input type="text" data-field="eduForaEscola06" value="${escapeHtml(paf.eduForaEscola06)}"></div>
          <div class="f c4"><label>Qtd. entre 6-14 anos fora da escola</label><input type="text" data-field="eduForaEscola614" value="${escapeHtml(paf.eduForaEscola614)}"></div>
          <div class="f c4"><label>Qtd. entre 15-17 anos fora da escola</label><input type="text" data-field="eduForaEscola1517" value="${escapeHtml(paf.eduForaEscola1517)}"></div>
          <div class="f c4"><label>Qtd. entre 10-17 anos que não sabem ler/escrever</label><input type="text" data-field="eduAnalfabetismo1017" value="${escapeHtml(paf.eduAnalfabetismo1017)}"></div>
          <div class="f c4"><label>Qtd. entre 18-59 anos que não sabem ler/escrever</label><input type="text" data-field="eduAnalfabetismo1859" value="${escapeHtml(paf.eduAnalfabetismo1859)}"></div>
          <div class="f c4"><label>Qtd. com 60 anos ou mais que não sabem ler/escrever</label><input type="text" data-field="eduAnalfabetismo60mais" value="${escapeHtml(paf.eduAnalfabetismo60mais)}"></div>
          <div class="f c12"><label>Observações sobre educação</label><textarea rows="2" data-field="eduObs">${escapeHtml(paf.eduObs)}</textarea></div>
        </div>
      </div>

      <div class="section-card">
        <h2><span class="num">03c</span>Condições de Trabalho e Renda</h2>
        ${notaTecnica("A Trilha do PAIF para o contexto da Insegurança Alimentar e Nutricional (MDS/UNICEF) trata a fome como um fenômeno multidimensional, que não se resume à insuficiência de renda. Quando a família procura o CRAS pedindo uma cesta básica, a resposta imediata (busca ativa no CadÚnico, inserção em programas de transferência de renda, encaminhamento a equipamentos de segurança alimentar) deve funcionar como porta de entrada para o acompanhamento continuado pelo PAIF — e não se esgotar na entrega pontual do benefício eventual. Para situar a gravidade do que a família relata, a Escala Brasileira de Insegurança Alimentar (EBIA) distingue três níveis: leve (incerteza quanto ao acesso futuro aos alimentos ou comprometimento da qualidade), moderada (redução na quantidade de alimentos entre os adultos) e grave (redução de alimentos também entre as crianças, caracterizando fome). A Trilha é enfática, porém, que instrumentos como a EBIA servem ao diagnóstico e não devem ser exigidos como pré-requisito para conceder benefícios eventuais ou incluir a família em programas de transferência de renda — a identificação continua sendo feita pela escuta qualificada, pela consulta ao CadÚnico, pelo conhecimento do território e pela busca ativa, como em qualquer outra situação atendida pelo SUAS.")}
        <div class="field-grid">
          <div class="f c6"><label>Renda total da família (sem programas sociais)</label><input type="text" data-field="rendaTotal" placeholder="R$" value="${escapeHtml(paf.rendaTotal)}"></div>
          <div class="f c6"><label>Renda familiar per capita (sem programas sociais)</label><input type="text" data-field="rendaPerCapita" placeholder="R$" value="${escapeHtml(paf.rendaPerCapita)}"></div>
          <div class="f c12"><label>Observações sobre trabalho e renda</label><textarea rows="2" data-field="rendaObs">${escapeHtml(paf.rendaObs)}</textarea></div>
        </div>
      </div>

      <div class="section-card">
        <h2><span class="num">03d</span>Condições de Saúde</h2>
        <div class="field-grid">
          ${simNao("saudeDoencaGrave", paf.saudeDoencaGrave, "saudeDoencaGraveQuem", paf.saudeDoencaGraveQuem)}
          ${simNao("saudeMedicacaoControlada", paf.saudeMedicacaoControlada, "saudeMedicacaoQuem", paf.saudeMedicacaoQuem)}
          ${simNao("saudeAlcool", paf.saudeAlcool, "saudeAlcoolQuem", paf.saudeAlcoolQuem)}
          ${simNao("saudeDrogas", paf.saudeDrogas, "saudeDrogasQuem", paf.saudeDrogasQuem)}
          ${simNao("saudeGestante", paf.saudeGestante, "saudeGestanteQuem", paf.saudeGestanteQuem)}
          <div class="f c12"><label>Observações sobre saúde</label><textarea rows="2" data-field="saudeObs">${escapeHtml(paf.saudeObs)}</textarea></div>
        </div>
        <p class="hint">A presença de PCD e a necessidade de cuidados constantes devem ser registradas na lista de vulnerabilidades acima e/ou no campo de observações do Diagnóstico.</p>
      </div>

      <div class="section-card">
        <h2><span class="num">03e</span><span class="section-icon-badge">${psicossocialIconSvg(17)}</span>Aspectos Psicossociais e Instrumentais Técnicos</h2>
        <p class="section-sub">Recursos técnicos utilizados para a leitura da dinâmica e dos vínculos familiares.</p>
        ${notaTecnica("Genograma e ecomapa são instrumentais de leitura sistêmica da família e de sua rede de relações — recursos reconhecidos pelas Referências Técnicas do CFP/CREPOP para atuação no CRAS/SUAS —, e não instrumentos de diagnóstico clínico individual. Seu uso no PAIF apoia a compreensão dos vínculos, papéis e potencialidades da família e do território, sempre a serviço do caráter preventivo e protetivo do Serviço, e nunca como avaliação psicológica formal ou psicoterapia, que estão fora do escopo do PAIF.")}
        ${chkList("instrumentaisTecnicos", INSTRUMENTAIS_TECNICOS, paf.instrumentaisTecnicos || [], true)}
        <div class="f c12" style="margin-top:12px"><label>Aspectos relacionais observados (dinâmica, comunicação, papéis, potencialidades e vínculos da família)</label><textarea rows="3" data-field="aspectosPsicossociaisObs">${escapeHtml(paf.aspectosPsicossociaisObs)}</textarea></div>
      </div>`;
    }

    case "grupo": return `
      <div class="section-card">
        ${sectionHeader("04", "Sobre o Grupo Familiar", "Vulnerabilidades e riscos sociais a serem superados, gerados pelas múltiplas expressões da questão social.")}
        ${notaTecnica("O trabalho do PAIF é, antes de tudo, territorial e comunitário: as Referências Técnicas do CFP/CREPOP para o CRAS/SUAS situam o fortalecimento de vínculos familiares e comunitários — e não apenas o atendimento individual — como eixo central da atuação da equipe técnica, incluindo a psicóloga(o), junto a essa família. A matricialidade sociofamiliar, eixo estruturante da PNAS, não exige atender todos os membros da família sempre juntos: significa não perder de vista o contexto familiar e comunitário do sujeito atendido, mesmo quando o acompanhamento é individual, e reconhecer que a responsabilidade por superar as vulnerabilidades não recai só sobre a família. Já a territorialização vai além de localizar o serviço perto da população: trata o território como espaço vivo, de disputas e potencialidades, e não apenas como um lugar geográfico.")}
        ${paf.situacoesSociais.map((row, i) => `
          <div class="matrix-row">
            <div class="situ-label">${escapeHtml(row.situacao)}</div>
            ${situacaoMembrosField(paf, i, row)}
            <label class="chk"><input type="checkbox" data-field-check="situacoesSociais.${i}.superada" ${row.superada ? "checked" : ""}><span>Superada</span></label>
          </div>`).join("")}
        ${notaTecnica("Ao marcar \"Em contextos de violência\" para alguma mulher da família, a Trilha do PAIF para a Prevenção da Violência Doméstica e Familiar contra as Mulheres (MDS/UNICEF) orienta que a equipe acolha o relato sem exigir comprovação — verificar os fatos é atribuição do sistema de justiça, não do PAIF. O papel do Serviço aqui é preventivo e complementar ao do PAEFI: mesmo quando a situação exigir encaminhamento à rede especializada, o CRAS deve continuar sendo um espaço de referência e acolhida para essa família, sem interromper sua participação nas demais atividades do PAIF.")}
      </div>
      <div class="section-card">
        <h2><span class="num">04a</span>Trabalho Social Coletivo do PAIF</h2>
        <p class="section-sub">Ações realizadas pela própria equipe do CRAS com a família e no território — diferente dos encaminhamentos a outros serviços/órgãos (seção 05).</p>
        ${chkList("atividadesColetivas", ATIVIDADES_COLETIVAS_PAIF, paf.atividadesColetivas || [], true)}
        <div class="f" style="margin-top:12px"><label>Outras</label><input type="text" data-field="atividadesColetivasOutras" value="${escapeHtml(paf.atividadesColetivasOutras)}"></div>
      </div>
      <div class="section-card">
        <h2><span class="num">04b</span>Serviços da Rede Socioassistencial</h2>
        ${notaTecnica("A Tipificação Nacional de Serviços Socioassistenciais lista a articulação em rede do PAIF: serviços socioassistenciais de proteção básica e especial; serviços setoriais de educação, saúde, trabalho, cultura, esporte e segurança pública; conselhos de políticas públicas e de defesa de direitos; instituições de ensino e pesquisa; serviços de enfrentamento à pobreza; programas de inclusão produtiva; e redes sociais locais (associações de moradores, OSCs). Registrar aqui em quais dessas frentes a família já está inserida ajuda a visualizar lacunas de proteção a serem trabalhadas.")}
        <div class="field-grid">
          <div class="f c4"><label>Proteção Social Básica</label>${chkList("servBasica", SERVICOS_BASICA, paf.servBasica)}</div>
          <div class="f c4"><label>Média Complexidade</label>${chkList("servMedia", SERVICOS_MEDIA, paf.servMedia)}</div>
          <div class="f c4"><label>Alta Complexidade</label>${chkList("servAlta", SERVICOS_ALTA, paf.servAlta)}</div>
        </div>
      </div>`;

    case "encaminhamentos": return `
      <div class="section-card">
        ${sectionHeader("05", "Encaminhamentos", "Registre e imprima formulários de encaminhamento (modelo SUAS) para outros órgãos/serviços, com canhoto de protocolo e espaço para contra-referência.")}
        ${notaTecnica("Sempre que possível, registre também o retorno (contra-referência) do órgão para o qual a família foi encaminhada — isso evita que o acompanhamento perca o fio da meada quando a família passa por vários serviços.")}
        <table class="dyn-table">
          <thead><tr><th style="width:11%">Data</th><th style="width:18%">Área</th><th style="width:16%">Órgão/Unidade</th><th style="width:22%">Objetivo/Motivo</th><th style="width:14%">Profissional</th><th style="width:11%">Telefone</th><th></th></tr></thead>
          <tbody>
            ${(paf.encaminhamentosForm || []).map((e, i) => `
              <tr>
                <td><input type="date" data-field="encaminhamentosForm.${i}.data" value="${escapeHtml(e.data)}"></td>
                <td>
                  <select data-field="encaminhamentosForm.${i}.area">
                    <option value="">—</option>
                    ${ENCAMINHAMENTO_AREAS.map(a => `<option value="${escapeHtml(a)}" ${e.area === a ? "selected" : ""}>${escapeHtml(a)}</option>`).join("")}
                  </select>
                </td>
                <td><input type="text" data-field="encaminhamentosForm.${i}.orgaoDestino" value="${escapeHtml(e.orgaoDestino)}"></td>
                <td><textarea rows="1" data-field="encaminhamentosForm.${i}.objetivo">${escapeHtml(e.objetivo)}</textarea></td>
                <td><input type="text" data-field="encaminhamentosForm.${i}.profissionalOrigem" value="${escapeHtml(e.profissionalOrigem)}" placeholder="${escapeHtml(paf.tecnicoReferencia) || ''}"></td>
                <td><input type="text" data-field="encaminhamentosForm.${i}.telefoneOrigem" value="${escapeHtml(e.telefoneOrigem)}"></td>
                <td style="white-space:nowrap;">
                  <button class="btn btn-ghost btn-sm" data-action="imprimir-encaminhamento" data-idx="${i}" title="Gerar e imprimir" aria-label="Gerar e imprimir formulário de encaminhamento">🖨️</button>
                  <button class="row-del" data-action="remove-encaminhamento" data-idx="${i}" title="Remover" aria-label="Remover encaminhamento">✕</button>
                </td>
              </tr>
              <tr>
                <td colspan="7" style="padding-top:0;">
                  <input type="text" data-field="encaminhamentosForm.${i}.contraReferencia" placeholder="Contra-referência / retorno recebido do órgão (o que foi respondido, quando)" value="${escapeHtml(e.contraReferencia)}">
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
        <button class="add-row-btn" data-action="add-encaminhamento">+ Adicionar encaminhamento</button>
      </div>`;

    case "programas": return `
      <div class="section-card">
        ${sectionHeader("06", "Programas, Projetos, Serviços e Benefícios Socioassistenciais", "")}
        ${notaTecnica("A Trilha do PAIF para o Contexto das Condicionalidades do Programa Bolsa Família (MDS/UNICEF) orienta que o não cumprimento das condicionalidades de saúde e educação não deve ser lido como culpa ou punição da família, e sim como um sinal de possíveis desproteções sociais a serem investigadas. O Protocolo de Gestão Integrada de Serviços, Benefícios e Transferências de Renda no âmbito do SUAS (Resolução CIT nº 7/2009) reforça essa leitura ao determinar que famílias do PBF, do BPC e do PETI em maior vulnerabilidade — entre elas as em descumprimento de condicionalidades — têm prioridade de inclusão no acompanhamento do PAIF, com busca ativa proativa da equipe, e não apenas uma resposta ao aviso de bloqueio do benefício.")}
        ${notaTecnica("O Decreto nº 6.307/2007 e o Caderno de Orientações Técnicas sobre Benefícios Eventuais no SUAS (MDS) tratam a cesta básica, o auxílio natalidade, o auxílio funeral e o aluguel social como provisões suplementares e provisórias diante de nascimento, morte, calamidade pública ou vulnerabilidade temporária — e não como favor discricionário da equipe técnica. Entre os princípios que orientam sua concessão estão a afirmação do benefício eventual como direito relativo à cidadania, a ampla divulgação dos critérios de acesso e a vedação de qualquer comprovação vexatória de pobreza para concedê-lo.")}
        <div class="field-grid">
          <div class="f c6">
            <label>a) Participa de programas, projetos sociais ou de geração de renda?</label>
            <div class="radio-row">
              <label><input type="radio" name="participaProgramas" data-field="participaProgramas" value="Sim" ${paf.participaProgramas === "Sim" ? "checked" : ""}> Sim</label>
              <label><input type="radio" name="participaProgramas" data-field="participaProgramas" value="Não" ${paf.participaProgramas === "Não" ? "checked" : ""}> Não</label>
            </div>
            ${chkList("programasQuais", PROGRAMAS_QUAIS, paf.programasQuais)}
            <div class="f" style="margin-top:6px"><label>Outros</label><input type="text" list="programasOutrosList" data-field="programasOutros" value="${escapeHtml(paf.programasOutros)}"></div>
            <datalist id="programasOutrosList">${outrosSugestoes(PROGRAMAS_OUTROS_SUGESTOES, PROGRAMAS_QUAIS).map(o => `<option value="${escapeHtml(o)}">`).join("")}</datalist>
          </div>
          <div class="f c6">
            <label>b) Recebe algum outro benefício assistencial e/ou eventual?</label>
            <div class="radio-row">
              <label><input type="radio" name="recebeBeneficio" data-field="recebeBeneficio" value="Sim" ${paf.recebeBeneficio === "Sim" ? "checked" : ""}> Sim</label>
              <label><input type="radio" name="recebeBeneficio" data-field="recebeBeneficio" value="Não" ${paf.recebeBeneficio === "Não" ? "checked" : ""}> Não</label>
            </div>
            ${chkList("beneficioQuais", BENEFICIOS_QUAIS, paf.beneficioQuais)}
            <div class="f" style="margin-top:6px"><label>Outro</label><input type="text" list="beneficioOutroList" data-field="beneficioOutro" value="${escapeHtml(paf.beneficioOutro)}"></div>
            <datalist id="beneficioOutroList">${outrosSugestoes(BENEFICIOS_OUTROS_SUGESTOES, BENEFICIOS_QUAIS).map(o => `<option value="${escapeHtml(o)}">`).join("")}</datalist>
          </div>
        </div>
      </div>`;

    case "rede": return `
      <div class="section-card">
        ${sectionHeader("07", "Recursos que o Território Possui (Articulação da Rede)", "Rede de Apoio Institucional (recursos institucionais).")}
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
            <span class="folder-tab ${paf.situacaoPAF}">${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</span>
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
        ${sectionHeader("08", "Registro de Atendimentos", "Cada visita, contato ou encaminhamento realizado com a família, em ordem cronológica.")}
        ${notaTecnica("As Orientações Técnicas do PAIF distinguem \"atendimento\" (resposta pontual a uma demanda) de \"acompanhamento\" (processo continuado, com objetivos e prazos pactuados — como este PAF). Ações particularizadas, em especial, devem ser usadas com critério: sempre associadas aos objetivos do Serviço, e nunca como simples \"resolução de caso\".")}
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
                <button class="row-del" data-action="remove-atendimento" data-idx="${i}" title="Remover este atendimento" aria-label="Remover este atendimento">✕</button>
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
        <h2><span class="num">08a</span>Metas, Evolução e Resultados</h2>
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
        ${sectionHeader("09", "Estratégias a serem adotadas para superação das vulnerabilidades", "")}
        ${chkList("estrategias", ESTRATEGIAS, paf.estrategias, true)}
        <div class="f" style="margin-top:12px"><label>Outras</label><input type="text" data-field="estrategiasOutras" value="${escapeHtml(paf.estrategiasOutras)}"></div>
      </div>
      <div class="section-card">
        <h2><span class="num">09a</span>Eixos de intervenção</h2>
        ${chkList("eixos", EIXOS, paf.eixos, true)}
        <div class="f" style="margin-top:12px"><label>Outros</label><input type="text" data-field="eixosOutros" value="${escapeHtml(paf.eixosOutros)}"></div>
      </div>`;

    case "plano": return `
      <div class="section-card">
        ${sectionHeader("10", "Elaboração do Plano", "")}
        ${notaTecnica("Marque os objetivos do PAIF (conforme a Tipificação Nacional de Serviços Socioassistenciais) que este Plano pretende trabalhar com a família — isso ajuda a manter o acompanhamento alinhado à finalidade do Serviço, e não apenas à resolução de uma demanda pontual. As Referências Técnicas do CFP/CREPOP destacam que o Plano deve ter caráter não tutelar: a família participa ativamente da definição de suas metas, e o trabalho técnico busca fortalecer sua autonomia e protagonismo, e não apenas prover respostas assistencialistas às suas demandas. O SUAS busca superar a antiga lógica de \"polícia das famílias\" — palestras e oficinas educativas desarticuladas dos serviços, oferecidas como condição ou favor — e também a ideia de que a assistência social é \"ajuda\": trata-se de direito do cidadão e dever do Estado. Evite, portanto, redigir metas e estratégias em tom de condição, favor ou disciplinamento de comportamento.")}
        <label style="font-size:11.5px;font-weight:600;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em;display:block;margin-bottom:8px;">Objetivos do PAIF trabalhados neste Plano</label>
        ${chkList("objetivosPaif", OBJETIVOS_PAIF, paf.objetivosPaif || [], true)}
        <div class="f" style="margin:12px 0 20px"><label>Outros objetivos</label><input type="text" data-field="objetivosPaifOutros" value="${escapeHtml(paf.objetivosPaifOutros)}"></div>
        ${notaTecnica("A Política Nacional de Assistência Social (PNAS/2004) e a Norma Operacional Básica do SUAS (NOB-SUAS/2012) organizam a proteção socioassistencial em torno de seguranças a serem afiançadas aos usuários. Indicar aqui qual(is) delas este Plano busca garantir para a família ajuda a explicitar a finalidade protetiva do acompanhamento, para além da resposta a uma demanda pontual.")}
        <label style="font-size:11.5px;font-weight:600;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em;display:block;margin-bottom:8px;">Seguranças socioassistenciais afiançadas por este Plano</label>
        ${segurancasChkList(paf.segurancasSocioassistenciais || [])}
        <div class="f" style="margin:12px 0 20px"><label>Outras</label><input type="text" data-field="segurancasSocioassistenciaisOutras" value="${escapeHtml(paf.segurancasSocioassistenciaisOutras)}"></div>
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
        ${sectionHeader("11", "Encerramento do Acompanhamento Familiar", "")}
        ${notaTecnica("O PAIF não tem caráter terapêutico ou psicoterápico — demandas de saúde mental devem ser encaminhadas à rede intersetorial. Quando há indício de violação de direitos, o encaminhamento é ao CREAS/PAEFI, que assume o acompanhamento até a situação ser superada.")}
        ${notaTecnica("A Tipificação Nacional situa o impacto social esperado do PAIF em quatro frentes: redução da ocorrência de vulnerabilidade social, prevenção de riscos sociais (seu agravamento ou reincidência), aumento do acesso a serviços socioassistenciais e setoriais, e melhoria da qualidade de vida da família. Vale usar esses quatro eixos como critério para avaliar, no encerramento, se o Plano cumpriu sua finalidade — e não apenas se a demanda inicial foi resolvida.")}
        <div class="radio-row" style="flex-direction:column;align-items:flex-start;gap:10px;">
          ${ENCERRAMENTO_MOTIVOS.map(m => `<label style="display:flex;gap:8px;align-items:center;"><input type="radio" name="encerramentoMotivo" data-field="encerramentoMotivo" value="${m.v}" ${paf.encerramentoMotivo === m.v ? "checked" : ""}> (${m.v}) ${m.label}</label>`).join("")}
        </div>
        <div class="field-grid" style="margin-top:14px;">
          <div class="f c12"><label>Outros motivos / Observações do encerramento</label><input type="text" data-field="encerramentoOutros" value="${escapeHtml(paf.encerramentoOutros)}"></div>
          <div class="f c6"><label>Técnico Responsável</label><input type="text" data-field="encerramentoTecnico" value="${escapeHtml(paf.encerramentoTecnico)}"></div>
          <div class="f c6"><label>Data de Encerramento</label><input type="date" data-field="encerramentoData" value="${escapeHtml(paf.encerramentoData)}"></div>
        </div>
      </div>`;

    case "anexos": {
      const anexos = paf.anexos || [];
      const total = totalAnexosBytes(paf);
      const avisoNuvem = total > anexoAvisoBytes();
      const cards = anexos.map(a => {
        const ehImagem = a.tipo.startsWith("image/");
        const preview = ehImagem
          ? `<img src="${a.dataURL}" class="anexo-thumb" data-anexo-view="${a.id}">`
          : `<div class="anexo-thumb anexo-pdf-icon" data-anexo-view="${a.id}">PDF</div>`;
        return `
        <div class="anexo-card">
          ${preview}
          <div class="anexo-info">
            <span class="anexo-nome" title="${escapeHtml(a.nome)}">${escapeHtml(a.nome)}</span>
            <span class="anexo-meta">${fmtBytes(a.tamanho)}</span>
          </div>
          <div class="anexo-actions">
            <button class="btn btn-ghost btn-sm" data-anexo-baixar="${a.id}">Baixar</button>
            <button class="btn btn-danger btn-sm" data-anexo-remover="${a.id}">Excluir</button>
          </div>
        </div>`;
      }).join("");

      return `
      <div class="section-card">
        ${sectionHeader("12", "Anexos", "Anexe fotos, documentos digitalizados ou PDFs relacionados ao acompanhamento desta família.")}
        <label class="anexo-dropzone" for="anexoInput">
          <span class="anexo-dropzone-icon">＋</span>
          <span>Clique para escolher imagens ou PDFs</span>
          <input type="file" id="anexoInput" accept="image/*,application/pdf" multiple style="display:none">
        </label>
        <p class="hint">Imagens são comprimidas automaticamente ao anexar. Tamanho total dos anexos deste PAF: <strong>${fmtBytes(total)}</strong>${state.mode === "cloud" ? " (modo nuvem)" : " (somente neste dispositivo)"}.</p>
        ${avisoNuvem ? `<p class="anexo-aviso">⚠️ Os anexos estão ficando grandes para o modo nuvem (limite de sincronização por registro). Prefira menos arquivos ou imagens menores.</p>` : ""}
        ${anexos.length ? `<div class="anexo-grid">${cards}</div>` : `<p class="hint" style="margin-top:10px;">Nenhum anexo adicionado ainda.</p>`}
      </div>`;
    }

    case "observacoes": return `
      <div class="section-card">
        ${sectionHeader("13", "Observações Gerais", "Anotações complementares técnicas sobre o acompanhamento da família.")}
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
      document.getElementById("railOverlay")?.classList.remove("show");
      renderApp();
    });
  });

  // Troca rápida de status da capa
  document.querySelectorAll("[data-set-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      const novoStatus = btn.dataset.setStatus;
      if (novoStatus === "cancelado") {
        confirmModal("Cancelar este PAF?", "Cancelar este PAF vai excluí-lo definitivamente (de todos os dispositivos, se a nuvem estiver ativa). Essa ação não pode ser desfeita.", () => {
          const id = state.current.id;
          deletePAFRecord(id);
          goHome();
        });
        return;
      }
      if (novoStatus === state.current.situacaoPAF) return;
      state.current.situacaoPAF = novoStatus;
      if (!state.current.situacaoData) state.current.situacaoData = todayISO();
      savePAF(state.current, { silent: true });
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

  // Atualiza a idade exibida ao lado do campo de nascimento, sem precisar re-renderizar a tela
  container.querySelectorAll("[data-idade-of]").forEach(input => {
    input.addEventListener("input", () => {
      const badge = document.getElementById(input.dataset.idadeOf);
      if (badge) badge.textContent = idadeTexto(input.value);
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

  // Binding para o seletor de membros em "Sobre o Grupo Familiar"
  container.querySelectorAll("[data-situ-nome]").forEach(chk => {
    chk.addEventListener("change", () => {
      const idx = parseInt(chk.dataset.situIdx, 10);
      const nome = chk.dataset.situNome;
      const row = state.current.situacoesSociais[idx];
      let nomes = (row.membros || "").split(",").map(s => s.trim()).filter(Boolean);
      if (chk.checked) {
        if (!nomes.includes(nome)) nomes.push(nome);
      } else {
        nomes = nomes.filter(n => n !== nome);
      }
      row.membros = nomes.join(", ");
      scheduleAutosave();
    });
  });

  // Ações de Tabela Dinâmica (Membros da Família)
  container.querySelectorAll("[data-action='add-membro']").forEach(btn => {
    btn.addEventListener("click", () => {
      state.current.membros.push({ nome: "", nascimento: "", parentesco: "", sexo: "", nacionalidade: "", etnia: "", pcd: false });
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

  // Ações da tabela de Encaminhamentos
  container.querySelectorAll("[data-action='add-encaminhamento']").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.current.encaminhamentosForm) state.current.encaminhamentosForm = [];
      state.current.encaminhamentosForm.push({
        data: todayISO(), area: "", orgaoDestino: "", objetivo: "",
        profissionalOrigem: state.current.tecnicoReferencia || "", telefoneOrigem: "", contraReferencia: ""
      });
      savePAF(state.current, { silent: true });
      renderApp();
    });
  });

  container.querySelectorAll("[data-action='remove-encaminhamento']").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      confirmModal("Remover este encaminhamento?", "Este registro será apagado.", () => {
        state.current.encaminhamentosForm.splice(idx, 1);
        savePAF(state.current, { silent: true });
        renderApp();
      });
    });
  });

  container.querySelectorAll("[data-action='imprimir-encaminhamento']").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const enc = (state.current.encaminhamentosForm || [])[idx];
      if (enc) imprimirEncaminhamento(state.current, enc);
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

  // Anexos (PDF/imagem)
  const anexoInput = document.getElementById("anexoInput");
  if (anexoInput) {
    anexoInput.addEventListener("change", (e) => {
      adicionarAnexos(e.target.files);
      e.target.value = "";
    });
  }
  container.querySelectorAll("[data-anexo-view]").forEach(el => {
    el.addEventListener("click", () => {
      const anexo = (state.current.anexos || []).find(a => a.id === el.dataset.anexoView);
      if (anexo) abrirAnexo(anexo);
    });
  });
  container.querySelectorAll("[data-anexo-baixar]").forEach(btn => {
    btn.addEventListener("click", () => {
      const anexo = (state.current.anexos || []).find(a => a.id === btn.dataset.anexoBaixar);
      if (anexo) baixarAnexo(anexo);
    });
  });
  container.querySelectorAll("[data-anexo-remover]").forEach(btn => {
    btn.addEventListener("click", () => removerAnexo(btn.dataset.anexoRemover));
  });
}

/* ---------------------------- Global Handlers ---------------------------- */

function attachGlobalHandlers() {
  const railToggle = document.getElementById("railToggleBtn");
  const railOverlay = document.getElementById("railOverlay");
  if (railToggle) {
    railToggle.onclick = () => {
      state.railOpen = !state.railOpen;
      const rail = document.getElementById("tabRail");
      if (rail) rail.classList.toggle("open", state.railOpen);
      if (railOverlay) railOverlay.classList.toggle("show", state.railOpen);
    };
  }
  if (railOverlay) {
    railOverlay.onclick = () => {
      state.railOpen = false;
      const rail = document.getElementById("tabRail");
      if (rail) rail.classList.remove("open");
      railOverlay.classList.remove("show");
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = handleLogout;

  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) settingsBtn.onclick = openSettingsModal;

  // Fechar dropdowns de exportação ao clicar fora.
  // Anexado apenas uma vez (renderApp roda a cada interação e chamava isto de novo,
  // empilhando um novo listener no document a cada render).
  if (!state._globalClickBound) {
    state._globalClickBound = true;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".export-menu")) {
        document.querySelectorAll(".export-dropdown").forEach(d => d.style.display = "none");
      }
    });
  }
}

/* ---------------------------- Exportação: PDF (Impressão Nativa) ---------------------------- */

function exportPDF(paf) {
  if (!paf) return;
  const printWin = window.open("", "_blank");
  if (!printWin) {
    toast("Bloqueador de pop-ups ativo. Permita pop-ups para exportar.");
    return;
  }
  const qtdPdfsAnexados = (paf.anexos || []).filter(a => a.tipo === "application/pdf").length;
  if (qtdPdfsAnexados) {
    toast(`Gerando documento com ${qtdPdfsAnexados} PDF${qtdPdfsAnexados > 1 ? "s" : ""} anexado${qtdPdfsAnexados > 1 ? "s" : ""} — pode levar alguns segundos…`);
  }

  const membrosHTML = (paf.membros || []).map(m => `
    <tr>
      <td>${escapeHtml(m.nome)}</td>
      <td>${fmtDateBR(m.nascimento)}</td>
      <td>${escapeHtml(m.sexo)}</td>
      <td>${escapeHtml(m.parentesco)}</td>
      <td>${escapeHtml(m.nacionalidade) || "—"}</td>
      <td>${escapeHtml(m.etnia) || "—"}</td>
      <td>${m.pcd ? "Sim" : "—"}</td>
    </tr>
  `).join("") || "<tr><td colspan='7'>Nenhum membro informado</td></tr>";

  const temMigracao = paf.migracaoDataChegadaBrasil || (paf.migracaoDocumentacao || []).length || paf.migracaoDocumentacaoOutro || paf.migracaoInteriorizacao || paf.habitacaoAbrigoNome;
  const migracaoHTML = !temMigracao ? "" : `
    <h2>Situação Migratória e de Abrigamento</h2>
    <div class="grid">
      <div class="field"><span class="label">Abrigo</span>${escapeHtml(paf.habitacaoAbrigoNome) || "—"}</div>
      <div class="field"><span class="label">Data de chegada ao Brasil</span>${fmtDateBR(paf.migracaoDataChegadaBrasil) || "—"}</div>
      <div class="field"><span class="label">Interiorização</span>${escapeHtml(paf.migracaoInteriorizacao) || "—"}</div>
      <div class="field"><span class="label">Documentação</span>${(paf.migracaoDocumentacao || []).map(escapeHtml).join(", ") || "—"}${paf.migracaoDocumentacaoOutro ? " · Outro: " + escapeHtml(paf.migracaoDocumentacaoOutro) : ""}</div>
    </div>`;

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

  const anexosImg = (paf.anexos || []).filter(a => a.tipo.startsWith("image/"));
  const anexosPdf = (paf.anexos || []).filter(a => a.tipo === "application/pdf");
  const anexosHTML = (anexosImg.length || anexosPdf.length) ? `
    <h2>Anexos</h2>
    ${anexosImg.length ? `<div class="anexos-print-grid">${anexosImg.map(a => `
      <div class="anexo-print-item">
        <img src="${a.dataURL}">
        <span>${escapeHtml(a.nome)}</span>
      </div>`).join("")}</div>` : ""}
    ${anexosPdf.length ? `<p class="muted">Documentos PDF anexados (incluídos a seguir, uma página por documento): ${anexosPdf.map(a => escapeHtml(a.nome)).join(", ")}</p>` : ""}
  ` : "";

  const anexosPdfPaginasHTML = anexosPdf.map(a => `
    <div class="anexo-pdf-pagina">
      <p class="anexo-pdf-titulo">Anexo — ${escapeHtml(a.nome)}</p>
      <object data="${a.dataURL}" type="application/pdf" class="anexo-pdf-embed">
        <div class="anexo-pdf-fallback">
          <p>Não foi possível exibir este PDF diretamente aqui.</p>
          <a href="${a.dataURL}" download="${escapeHtml(a.nome)}" target="_blank">Toque aqui para abrir/baixar "${escapeHtml(a.nome)}"</a>
        </div>
      </object>
    </div>`).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Prontuário PAF - ${escapeHtml(paf.responsavel)}</title>
      <style>
        @page { margin: 14mm 14mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1F3A5F;
          line-height: 1.5; margin: 0; padding: 5mm 0 3mm;
        }
        .brasao { font-family: Georgia, 'Times New Roman', serif; }

        /* ---- Cabeçalho e rodapé que repetem em toda página impressa ----
           ANTES isso era feito com "position: fixed" e um deslocamento negativo igual
           à margem do @page — um truque frágil: qualquer ancestral com "position",
           "transform" ou "filter" diferente do padrão cria um novo "containing block"
           e faz o cabeçalho/rodapé "vazar" para a página seguinte, sobrepondo o texto
           (foi exatamente essa falha que aparecia na folha exportada). A forma robusta
           e nativa do navegador de repetir conteúdo em toda página impressa é usar
           <thead>/<tfoot> de uma <table> que envolve o documento inteiro: o navegador
           repete essas linhas automaticamente no topo/rodapé de cada página, sem
           depender de cálculos de margem nem de position:fixed. */
        .print-shell { width: 100%; border-collapse: collapse; }
        .print-shell > tbody > tr > td { padding: 0; border: 0; }

        .page-header-fixed {
          display: table-header-group;
        }
        .page-header-fixed .ph-row {
          display: flex; align-items: flex-end; gap: 8px;
          border-bottom: 1px solid #C9D2D9; padding-bottom: 5px; margin-bottom: 6mm; font-size: 8px; color: #6C7D8F;
          white-space: nowrap;
        }
        .page-header-fixed .brasao-mini { flex-shrink: 0; color: #B98A34; }
        .page-header-fixed .ph-row > div:nth-child(2) { flex: 1 1 auto; min-width: 0; overflow: hidden; }
        .page-header-fixed .ph-org { font-weight: 700; color: #1F3A5F; font-size: 9px; letter-spacing: .01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .page-header-fixed .ph-sub { display: block; font-weight: 400; color: #8496A8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .page-header-fixed .ph-right { flex: 0 0 auto; max-width: 42%; margin-left: auto; text-align: right; overflow: hidden; }
        .page-header-fixed .ph-right b { display: block; color: #1F3A5F; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .page-header-fixed .ph-right span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .page-footer-fixed {
          display: table-footer-group;
        }
        .page-footer-fixed .pf-row {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
          border-top: 1px solid #C9D2D9; padding-top: 5px; margin-top: 6mm; font-size: 7.3px; color: #8496A8; line-height: 1.45;
        }
        .page-footer-fixed .pf-selo {
          flex-shrink: 0; font-size: 6.6px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700;
          color: #52667C; border: 1px solid #C9D2D9; border-radius: 3px; padding: 2px 6px; white-space: nowrap;
        }

        /* ---- Marca d'água de confidencialidade, repetida em cada página ---- */
        .watermark {
          position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-32deg);
          font-family: Georgia, serif; font-size: 62px; font-weight: 700; letter-spacing: .08em;
          color: #1F3A5F; opacity: 0.045; white-space: nowrap; pointer-events: none;
        }

        .orgao-header {
          display: flex; align-items: center; gap: 10px; background: #172C48; color: #C9D6DE;
          padding: 9px 12px; border-radius: 5px 5px 0 0; margin-bottom: 0; font-size: 9px; line-height: 1.4;
        }
        .orgao-header .brasao-mini { flex-shrink: 0; color: #E7D0A0; }
        .orgao-header strong { display: block; color: #fff; font-size: 10.5px; font-family: Georgia, serif; letter-spacing: .01em; }
        .orgao-header .orgao-contato { margin-left: auto; text-align: right; color: #A9BBCB; }

        .capa-header {
          display: flex; align-items: flex-start; gap: 14px; border: 1px solid #1F3A5F;
          border-bottom: 2.5px solid #1F3A5F; padding: 12px 14px; margin-bottom: 14px; border-radius: 6px;
          position: relative; background: linear-gradient(180deg,#F8FAFB 0%,#fff 60%);
        }
        .capa-selo {
          width: 42px; height: 42px; border-radius: 50%; border: 1.6px solid #B98A34; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 19px; color: #B98A34;
        }
        .capa-titulos { flex: 1; }
        .capa-titulos .capa-eyebrow { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: .1em; color: #B98A34; font-weight: 700; margin-bottom: 2px; }
        .capa-titulos h1 { font-family: Georgia, serif; font-size: 17px; margin: 0; color: #1F3A5F; letter-spacing: -.01em; }
        .capa-titulos p { margin: 3px 0 0; font-size: 10.5px; color: #2E7D6B; font-weight: 600; }
        .capa-ficha {
          margin-left: auto; text-align: right; font-size: 9px; color: #52667C; line-height: 1.7;
          border: 1px solid #D7C39A; background: #FBF6EA; border-radius: 5px; padding: 7px 12px; min-width: 132px;
        }
        .capa-ficha .num { font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 13px; font-weight: 700; color: #7A5A1E; letter-spacing: .01em; }
        .capa-ficha .lbl { display: block; font-size: 7px; text-transform: uppercase; letter-spacing: .06em; color: #8496A8; }

        .id-band {
          background: #F6F8F9; border: 1px solid #D7E0E6; border-radius: 6px; padding: 13px 16px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .id-nome-wrap { flex: 1 1 200px; }
        .id-nome { font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin: 0 0 5px; letter-spacing: -.01em; }
        .id-status {
          display: inline-flex; align-items: center; gap: 5px; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; font-weight: bold;
          padding: 3px 9px; border-radius: 999px; border: 1.2px solid #2E7D6B; color: #2E7D6B; background: #fff;
        }
        .id-status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .id-status.andamento { border-color: #1F5C4E; color: #1F5C4E; background: #DEEAE6; }
        .id-status.encaminhado { border-color: #7A5A1E; color: #7A5A1E; background: #F3E7D0; }
        .id-status.concluido { border-color: #52667C; color: #52667C; background: #E7E9EC; }
        .id-status.cancelado { border-color: #B5473F; color: #B5473F; background: #F5E0DD; }
        .id-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px 20px; flex: 2 1 380px; font-size: 10.5px;
          border-left: 1px solid #D7E0E6; padding-left: 16px;
        }
        .id-grid .k { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: .04em; color: #8496A8; margin-bottom: 1px; }
        .id-grid .v { display: block; font-weight: 600; }
        .id-stats { display: flex; gap: 8px; flex: 0 0 auto; border-left: 1px solid #D7E0E6; padding-left: 16px; }
        .id-stat { text-align: center; background: #fff; border: 1px solid #D7E0E6; border-radius: 6px; padding: 6px 11px; min-width: 58px; }
        .id-stat .n { display: block; font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #B98A34; line-height: 1; }
        .id-stat .l { display: block; font-size: 7.5px; text-transform: uppercase; color: #8496A8; margin-top: 3px; letter-spacing: .02em; }

        body { counter-reset: secao; }
        h2 {
          counter-increment: secao;
          display: flex; align-items: center; gap: 8px;
          font-size: 12.5px; color: #1F5C4E; margin: 22px 0 8px; padding-bottom: 4px;
          border-bottom: 1.6px solid #DEEAE6; page-break-after: avoid; letter-spacing: .01em;
        }
        h2::before {
          content: counter(secao, decimal-leading-zero); flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px;
          border-radius: 4px; background: #1F5C4E; color: #fff; font-size: 8px; font-weight: 700;
          font-family: 'IBM Plex Mono', 'Courier New', monospace;
        }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px 18px; margin-bottom: 6px; }
        .field { margin-bottom: 4px; }
        .label { font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: .02em; color: #52667C; display: block; margin-bottom: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
        th, td { border: 1px solid #D7E0E6; padding: 6px 7px; text-align: left; vertical-align: top; }
        th { background: #EEF3F1; font-weight: bold; font-size: 9.5px; text-transform: uppercase; letter-spacing: .02em; border-bottom: 1.6px solid #1F5C4E; color: #1F5C4E; }
        tbody tr:nth-child(even) td { background: #FAFBFC; }
        tr { page-break-inside: avoid; }
        .tag { display: inline-block; background: #DEEAE6; color: #1F5C4E; padding: 3px 8px; border-radius: 4px; font-size: 9.5px; margin: 2px 5px 2px 0; font-weight: 600; }
        .muted { color: #8496A8; font-style: italic; }

        .reg-item {
          display: flex; gap: 11px; border: 1px solid #D7E0E6; border-left-width: 3px; border-radius: 6px;
          padding: 9px 11px; margin-bottom: 8px; page-break-inside: avoid;
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

        .fechamento { margin-top: 34px; page-break-inside: avoid; }
        .fechamento .local-data { font-size: 10px; color: #52667C; margin-bottom: 26px; }
        .assinaturas { display: flex; gap: 44px; }
        .assinatura { flex: 1; text-align: center; }
        .assinatura .linha { border-top: 1px solid #1F3A5F; margin-bottom: 5px; padding-top: 5px; font-weight: 600; }
        .assinatura .cpf-linha { font-size: 9px; color: #8496A8; font-weight: 400; margin-top: 1px; }
        .assinatura .titulo { font-size: 9px; color: #52667C; text-transform: uppercase; letter-spacing: .03em; }

        .rodape-doc {
          margin-top: 22px; padding-top: 8px; border-top: 1px dashed #D7E0E6;
          font-size: 7.8px; color: #A6B4C0; text-align: center; line-height: 1.5; font-style: italic;
        }

        .anexos-print-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
        .anexo-print-item { width: 140px; text-align: center; page-break-inside: avoid; }
        .anexo-print-item img { width: 100%; height: 140px; object-fit: cover; border: 1px solid #D7E0E6; border-radius: 4px; }
        .anexo-print-item span { display: block; font-size: 8.5px; color: #52667C; margin-top: 4px; word-break: break-word; }

        .anexo-pdf-pagina { page-break-before: always; padding-top: 8px; }
        .anexo-pdf-titulo { font-family: Georgia, serif; font-size: 11px; color: #1F3A5F; margin: 0 0 8px; }
        .anexo-pdf-embed { width: 100%; height: 95vh; border: 1px solid #D7E0E6; }
        .anexo-pdf-fallback { text-align: center; padding: 40px 20px; border: 1px dashed #D7E0E6; border-radius: 6px; }
        .anexo-pdf-fallback a { display: inline-block; margin-top: 8px; color: #2E7D6B; font-weight: bold; }
        @media print { .anexo-pdf-embed { height: 95vh; } }

        @media print {
          .capa-header, h2 { page-break-after: avoid; }
        }
        @media screen {
          .page-header-fixed, .page-footer-fixed, .watermark { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">CONFIDENCIAL</div>

      <div class="page-header-fixed">
        <div class="brasao-mini">
          <svg viewBox="0 0 48 48" width="16" height="16"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M24 12 L28 22 L38 22 L30 28 L33 38 L24 32 L15 38 L18 28 L10 22 L20 22 Z" fill="currentColor"/></svg>
        </div>
        <div>
          <span class="ph-org">Prefeitura Municipal de Boa Vista · SEMADS</span>
          <span class="ph-sub">CRAS Cristiana Vicente Nunes — Prontuário do Plano de Acompanhamento Familiar (PAF/PAIF)</span>
        </div>
        <div class="ph-right">
          <b>Ficha nº ${protocoloNumero(paf)}</b>
          <span>${escapeHtml(paf.responsavel) || "Responsável não informado"}</span>
        </div>
      </div>

      <div class="page-footer-fixed">
        <span>Rua Santo Agostinho, 193b – Centenário, Boa Vista/RR · (95) 98402-6627 · crascentenariosemges@gmail.com</span>
        <span class="pf-selo">Documento de uso interno · CRAS/SEMADS</span>
      </div>

      <div class="capa-header">
        <div class="capa-selo">P</div>
        <div class="capa-titulos">
          <span class="capa-eyebrow">Prontuário SUAS · Proteção Social Básica</span>
          <h1>Plano de Acompanhamento Familiar</h1>
          <p>Serviço de Proteção e Atendimento Integral à Família (PAIF) ${paf.crasNome ? "· " + escapeHtml(paf.crasNome) : ""}</p>
        </div>
        <div class="capa-ficha">
          <span class="lbl">Ficha nº</span>
          <span class="num">${protocoloNumero(paf)}</span>
          <span class="lbl" style="margin-top:4px;">Emitido em</span>
          ${fmtDateBR(todayISO())}
        </div>
      </div>

      <div class="id-band">
        <div class="id-nome-wrap">
          <p class="id-nome">${escapeHtml(paf.responsavel) || "Responsável não informado"}</p>
          <span class="id-status ${paf.situacaoPAF || "andamento"}">${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</span>
        </div>
        <div class="id-grid">
          <div><span class="k">CPF</span><span class="v">${escapeHtml(paf.cpf) || "—"}</span></div>
          <div><span class="k">NIS</span><span class="v">${escapeHtml(paf.nis) || "—"}</span></div>
          <div><span class="k">Sexo</span><span class="v">${escapeHtml(paf.responsavelSexo) || "—"}</span></div>
          <div><span class="k">Nacionalidade</span><span class="v">${escapeHtml(paf.responsavelNacionalidade) || "—"}${paf.responsavelEtnia ? " · " + escapeHtml(paf.responsavelEtnia) : ""}</span></div>
          <div><span class="k">Técnico de Referência</span><span class="v">${escapeHtml(paf.tecnicoReferencia) || "—"}</span></div>
          <div><span class="k">Endereço</span><span class="v">${escapeHtml(enderecoCompleto(paf)) || "—"}</span></div>
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
        <thead><tr><th>Nome</th><th>Data Nasc.</th><th>Sexo</th><th>Parentesco</th><th>Nacionalidade</th><th>Etnia indígena</th><th>PCD</th></tr></thead>
        <tbody>${membrosHTML}</tbody>
      </table>
      ${migracaoHTML}

      <h2>Diagnóstico e Vulnerabilidades</h2>
      <div>${(paf.vulnerabilidades || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhuma selecionada</span>"}</div>
      ${paf.vulnerabilidadesOutros ? `<p style="margin:6px 0 0;"><strong>Outras:</strong> ${escapeHtml(paf.vulnerabilidadesOutros)}</p>` : ""}

      <h2>Diagnóstico Socioeconômico</h2>
      <div class="grid">
        <div class="field"><span class="label">Habitação</span>${escapeHtml(paf.habitacaoTipo) || "—"}${paf.habitacaoAbrigoNome ? " (" + escapeHtml(paf.habitacaoAbrigoNome) + ")" : ""}${paf.habitacaoAreaRisco === "Sim" ? " · Em área de risco" : ""}</div>
        <div class="field"><span class="label">Saneamento</span>${escapeHtml(paf.habitacaoEsgoto) || "—"}</div>
        <div class="field"><span class="label">Crianças/adolesc. fora da escola</span>${[paf.eduForaEscola06, paf.eduForaEscola614, paf.eduForaEscola1517].filter(Boolean).join(" / ") || "—"}</div>
        <div class="field"><span class="label">Renda total / per capita</span>${[paf.rendaTotal, paf.rendaPerCapita].filter(Boolean).join(" / ") || "—"}</div>
        <div class="field"><span class="label">Doença grave na família</span>${escapeHtml(paf.saudeDoencaGrave) || "—"}${paf.saudeDoencaGraveQuem ? " (" + escapeHtml(paf.saudeDoencaGraveQuem) + ")" : ""}</div>
        <div class="field"><span class="label">Gestante(s) na família</span>${escapeHtml(paf.saudeGestante) || "—"}${paf.saudeGestanteQuem ? " (" + escapeHtml(paf.saudeGestanteQuem) + ")" : ""}</div>
      </div>
      ${[paf.habitacaoObs, paf.eduObs, paf.rendaObs, paf.saudeObs].filter(Boolean).map(o => `<p class="muted" style="margin:4px 0;">${escapeHtml(o)}</p>`).join("")}

      ${(paf.instrumentaisTecnicos || []).length || paf.aspectosPsicossociaisObs ? `
      <h2>Aspectos Psicossociais e Instrumentais Técnicos</h2>
      ${(paf.instrumentaisTecnicos || []).length ? `<div>${paf.instrumentaisTecnicos.map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("")}</div>` : ""}
      ${paf.aspectosPsicossociaisObs ? `<p class="muted" style="margin:6px 0 0;">${escapeHtml(paf.aspectosPsicossociaisObs)}</p>` : ""}` : ""}

      ${(paf.encaminhamentosForm || []).length ? `
      <h2>Encaminhamentos Realizados</h2>
      <table>
        <thead><tr><th>Data</th><th>Área</th><th>Órgão/Unidade</th><th>Objetivo</th><th>Contra-referência</th></tr></thead>
        <tbody>${paf.encaminhamentosForm.map(e => `<tr><td>${fmtDateBR(e.data)}</td><td>${escapeHtml(e.area)}</td><td>${escapeHtml(e.orgaoDestino)}</td><td>${escapeHtml(e.objetivo)}</td><td>${escapeHtml(e.contraReferencia) || "—"}</td></tr>`).join("")}</tbody>
      </table>` : ""}

      <h2>Situações Sociais Registradas</h2>
      <table>
        <thead><tr><th>Situação Social</th><th>Membros</th><th>Superada</th></tr></thead>
        <tbody>${situacoesHTML}</tbody>
      </table>

      <h2>Trabalho Social Coletivo do PAIF</h2>
      <div>${(paf.atividadesColetivas || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhuma registrada</span>"}</div>
      ${paf.atividadesColetivasOutras ? `<p style="margin:6px 0 0;"><strong>Outras:</strong> ${escapeHtml(paf.atividadesColetivasOutras)}</p>` : ""}

      <h2>Serviços da Rede Socioassistencial</h2>
      <div class="grid">
        <div class="field"><span class="label">Proteção Social Básica</span>${(paf.servBasica || []).map(escapeHtml).join(", ") || "—"}</div>
        <div class="field"><span class="label">Média Complexidade</span>${(paf.servMedia || []).map(escapeHtml).join(", ") || "—"}</div>
        <div class="field"><span class="label">Alta Complexidade</span>${(paf.servAlta || []).map(escapeHtml).join(", ") || "—"}</div>
      </div>

      <h2>Programas, Projetos e Benefícios Socioassistenciais</h2>
      <div class="grid">
        <div class="field"><span class="label">Participa de programas/projetos sociais</span>${escapeHtml(paf.participaProgramas) || "—"}</div>
        <div class="field"><span class="label">Recebe outro benefício assistencial</span>${escapeHtml(paf.recebeBeneficio) || "—"}</div>
      </div>
      <div>${(paf.programasQuais || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("")}</div>
      ${paf.programasOutros ? `<p style="margin:4px 0;"><strong>Outros programas:</strong> ${escapeHtml(paf.programasOutros)}</p>` : ""}
      <div>${(paf.beneficioQuais || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("")}</div>
      ${paf.beneficioOutro ? `<p style="margin:4px 0;"><strong>Outro benefício:</strong> ${escapeHtml(paf.beneficioOutro)}</p>` : ""}

      <h2>Recursos do Território (Rede de Apoio)</h2>
      <div>${(paf.redeApoio || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhum selecionado</span>"}</div>
      ${paf.redeApoioOutros ? `<p style="margin:6px 0 0;"><strong>Outros:</strong> ${escapeHtml(paf.redeApoioOutros)}</p>` : ""}

      <h2>Registro de Atendimentos</h2>
      ${atendimentosHTML}

      <h2>Metas e Evolução</h2>
      <table>
        <thead><tr><th>Meta</th><th>Prazo</th><th>Resultados</th></tr></thead>
        <tbody>${metasHTML}</tbody>
      </table>

      <h2>Estratégias e Eixos de Intervenção</h2>
      <div class="grid">
        <div class="field"><span class="label">Estratégias</span>${(paf.estrategias || []).map(escapeHtml).join(", ") || "—"}${paf.estrategiasOutras ? " · Outras: " + escapeHtml(paf.estrategiasOutras) : ""}</div>
        <div class="field"><span class="label">Eixos de intervenção</span>${(paf.eixos || []).map(escapeHtml).join(", ") || "—"}${paf.eixosOutros ? " · Outros: " + escapeHtml(paf.eixosOutros) : ""}</div>
      </div>

      <h2>Objetivos do PAIF Trabalhados no Plano</h2>
      <div>${(paf.objetivosPaif || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhum selecionado</span>"}</div>
      ${paf.objetivosPaifOutros ? `<p style="margin:6px 0 0;"><strong>Outros:</strong> ${escapeHtml(paf.objetivosPaifOutros)}</p>` : ""}

      <h2>Seguranças Socioassistenciais Afiançadas</h2>
      <div>${(paf.segurancasSocioassistenciais || []).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join("") || "<span class='muted'>Nenhuma selecionada</span>"}</div>
      ${paf.segurancasSocioassistenciaisOutras ? `<p style="margin:6px 0 0;"><strong>Outras:</strong> ${escapeHtml(paf.segurancasSocioassistenciaisOutras)}</p>` : ""}

      <h2>Elaboração e Encerramento</h2>
      <div class="grid">
        <div class="field"><span class="label">Família participou da elaboração</span>${escapeHtml(paf.familiaParticipou) || "—"}</div>
        <div class="field"><span class="label">Técnico de Referência</span>${escapeHtml(paf.tecnicoReferencia) || "—"}</div>
        <div class="field"><span class="label">Data de Elaboração</span>${fmtDateBR(paf.dataElaboracao) || "—"}</div>
        <div class="field"><span class="label">Prazo de execução do Plano</span>${escapeHtml(paf.prazoExecucaoPlano) || "—"}</div>
        <div class="field"><span class="label">Prazo de avaliação do Plano</span>${escapeHtml(paf.prazoAvaliacaoPlano) || "—"}</div>
        <div class="field"><span class="label">Motivo de Encerramento</span>${escapeHtml(ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo)?.label) || "—"}</div>
        <div class="field"><span class="label">Técnico do Encerramento</span>${escapeHtml(paf.encerramentoTecnico) || "—"}</div>
        <div class="field"><span class="label">Data de Encerramento</span>${fmtDateBR(paf.encerramentoData) || "—"}</div>
      </div>
      ${paf.encerramentoOutros ? `<p style="margin:6px 0 0;"><strong>Outros motivos/observações do encerramento:</strong> ${escapeHtml(paf.encerramentoOutros)}</p>` : ""}

      ${paf.observacoes ? `<h2>Observações Gerais</h2><p>${escapeHtml(paf.observacoes)}</p>` : ""}

      ${anexosHTML}

      <div class="fechamento">
        <p class="local-data">Boa Vista/RR, ${fmtDateBR(todayISO())}.</p>
        <div class="assinaturas">
          <div class="assinatura">
            <div class="linha">${escapeHtml(paf.tecnicoReferencia) || "Técnico de Referência"}</div>
            <div class="cpf-linha">Assinatura e carimbo</div>
            <div class="titulo">Técnico de Referência</div>
          </div>
          <div class="assinatura">
            <div class="linha">${escapeHtml(paf.responsavel) || "Responsável Familiar"}</div>
            <div class="cpf-linha">${escapeHtml(paf.cpf) ? "CPF " + escapeHtml(paf.cpf) : "&nbsp;"}</div>
            <div class="titulo">Responsável Familiar</div>
          </div>
        </div>
      </div>

      <div class="rodape-doc">
        Documento gerado eletronicamente pelo sistema de gestão do PAF/PAIF do CRAS Cristiana Vicente Nunes em ${fmtDateBR(todayISO())}, para uso exclusivo da equipe técnica do SUAS — sujeito a sigilo profissional.<br>
        Plano de Acompanhamento Familiar (PAF) · Serviço de Proteção e Atendimento Integral à Família (PAIF) — Paulo Xavier, CRP-20/09816, Psicólogo
      </div>

      ${anexosPdfPaginasHTML}

      <script>
        window.onload = () => { setTimeout(() => window.print(), ${anexosPdf.length ? 700 : 50}); };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/* ---------------------------- Impressão: Formulário de Encaminhamento (modelo SUAS) ---------------------------- */

function imprimirEncaminhamento(paf, enc) {
  const printWin = window.open("", "_blank");
  if (!printWin) {
    toast("Bloqueador de pop-ups ativo. Permita pop-ups para exportar.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Formulário de Encaminhamento - ${escapeHtml(paf.responsavel)}</title>
      <style>
        @page { margin: 16mm 14mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1F3A5F; line-height: 1.5; margin: 0; }
        .orgao-header { display: flex; align-items: center; gap: 10px; background: #172C48; color: #C9D6DE; padding: 9px 12px; border-radius: 5px; font-size: 9px; margin-bottom: 16px; }
        .orgao-header strong { display: block; color: #fff; font-size: 10.5px; font-family: Georgia, serif; }
        .orgao-header .orgao-contato { margin-left: auto; text-align: right; color: #A9BBCB; }
        h1 { font-family: Georgia, serif; font-size: 15px; color: #1F3A5F; border-bottom: 2px solid #1F3A5F; padding-bottom: 7px; letter-spacing: -.01em; }
        .canhoto { border: 1px dashed #8496A8; border-radius: 6px; padding: 11px 13px; margin-bottom: 20px; font-size: 10.5px; }
        .canhoto b { color: #52667C; text-transform: uppercase; font-size: 9px; letter-spacing: .03em; }
        .corpo { border: 1px solid #D7E0E6; border-radius: 6px; padding: 15px 17px; }
        .linha { margin: 0 0 11px; }
        .campo-preenchido { border-bottom: 1px solid #1F3A5F; padding: 0 2px; font-weight: 600; }
        .contra { margin-top: 32px; border-top: 2px dashed #8496A8; padding-top: 15px; }
        .contra h2 { font-size: 12px; color: #1F5C4E; margin: 0 0 9px; letter-spacing: .01em; }
        .contra .campo { border: 1px solid #D7E0E6; border-radius: 6px; min-height: 70px; padding: 9px; font-size: 10.5px; background: #FAFBFC; }
        .assinaturas { display: flex; gap: 44px; margin-top: 38px; }
        .assinatura { flex: 1; text-align: center; }
        .assinatura .linha-ass { border-top: 1px solid #1F3A5F; margin-bottom: 5px; padding-top: 5px; }
        .assinatura .titulo { font-size: 9px; color: #52667C; text-transform: uppercase; letter-spacing: .03em; }
        .rodape-print { margin-top: 26px; padding-top: 9px; border-top: 1px solid #D7E0E6; font-size: 8.5px; color: #8496A8; text-align: center; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="orgao-header">
        <div>
          <strong>Prefeitura Municipal de Boa Vista</strong>
          Secretaria Municipal de Assistência e Desenvolvimento Social (SEMADS)<br>
          Centro de Referência de Assistência Social — CRAS Cristiana Vicente Nunes
        </div>
        <div class="orgao-contato">Rua Santo Agostinho, 193b – Centenário, Boa Vista/RR<br>(95) 98402-6627 · crascentenariosemges@gmail.com</div>
      </div>

      <h1>Formulário de Encaminhamento — SUAS</h1>

      <div class="canhoto">
        <b>Canhoto de protocolo</b> — Área: ${escapeHtml(enc.area) || "—"} · Data: ${fmtDateBR(enc.data) || "—"}<br>
        Objetivo/Motivo: ${escapeHtml(enc.objetivo) || "—"}<br>
        Registre no verso o resumo do acompanhamento deste encaminhamento.
      </div>

      <div class="corpo">
        <p class="linha">Encaminho o(a) Sr(a) <span class="campo-preenchido">${escapeHtml(paf.responsavel) || "________________________"}</span>
        e solicito atenção para seu atendimento, no(a) <span class="campo-preenchido">${escapeHtml(enc.orgaoDestino) || "________________________"}</span>
        (${escapeHtml(enc.area) || "área não especificada"}), tendo em consideração as necessidades identificadas pela Assistência Social e expostas a seguir:</p>
        <p class="linha">${escapeHtml(enc.objetivo) || "—"}</p>
        <p class="linha"><b>Data:</b> ${fmtDateBR(enc.data) || "—"}</p>
        <p class="linha"><b>Nome da Unidade de origem:</b> ${escapeHtml(paf.crasNome) || "—"}</p>
        <p class="linha"><b>Telefone para contato:</b> ${escapeHtml(enc.telefoneOrigem) || "—"}</p>
        <p class="linha"><b>Nome do Profissional:</b> ${escapeHtml(enc.profissionalOrigem) || escapeHtml(paf.tecnicoReferencia) || "—"}</p>
      </div>

      <div class="contra">
        <h2>Anotações de Contra-Referência / Acompanhamento do Encaminhamento</h2>
        <div class="campo">${escapeHtml(enc.contraReferencia) || ""}</div>
      </div>

      <div class="assinaturas">
        <div class="assinatura"><div class="linha-ass">&nbsp;</div><div class="titulo">Assinatura do Profissional Responsável</div></div>
        <div class="assinatura"><div class="linha-ass">&nbsp;</div><div class="titulo">Carimbo/Recebido pela Unidade de Destino</div></div>
      </div>

      <div class="rodape-print">
        Prefeitura Municipal de Boa Vista · SEMADS · CRAS Cristiana Vicente Nunes — Rua Santo Agostinho, 193b, Centenário, Boa Vista/RR — (95) 98402-6627 — crascentenariosemges@gmail.com<br>
        Plano de Acompanhamento Familiar (PAF) · Serviço de Proteção e Atendimento Integral à Família (PAIF) — Paulo Xavier, CRP-20/09816, Psicólogo
      </div>

      <script>window.onload = () => { window.print(); };</script>
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

  const situacoesWordHTML = (paf.situacoesSociais || [])
    .filter(s => s.membros || s.superada)
    .map(s => `<tr><td>${escapeHtml(s.situacao)}</td><td>${escapeHtml(s.membros)}</td><td>${s.superada ? "Sim" : "Não"}</td></tr>`)
    .join("") || "<tr><td colspan='3'>Nenhuma situação registrada</td></tr>";

  const temMigracaoWord = paf.migracaoDataChegadaBrasil || (paf.migracaoDocumentacao || []).length || paf.migracaoDocumentacaoOutro || paf.migracaoInteriorizacao || paf.habitacaoAbrigoNome;
  const migracaoWordHTML = !temMigracaoWord ? "" : `
    <h2>02a. Situação Migratória e de Abrigamento</h2>
    <p><b>Abrigo:</b> ${escapeHtml(paf.habitacaoAbrigoNome) || "—"} | <b>Data de chegada ao Brasil:</b> ${fmtDateBR(paf.migracaoDataChegadaBrasil) || "—"} | <b>Interiorização:</b> ${escapeHtml(paf.migracaoInteriorizacao) || "—"}<br>
    <b>Documentação:</b> ${(paf.migracaoDocumentacao || []).map(escapeHtml).join(", ") || "—"}${paf.migracaoDocumentacaoOutro ? " | Outro: " + escapeHtml(paf.migracaoDocumentacaoOutro) : ""}</p>`;

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
      <table style="width:100%;border:none;margin-bottom:10pt;">
        <tr>
          <td style="border:none;padding:0;">
            <p style="margin:0;font-size:11pt;font-weight:bold;color:#1F3A5F;">Prefeitura Municipal de Boa Vista</p>
            <p style="margin:0;font-size:9pt;color:#52667C;">Secretaria Municipal de Assistência e Desenvolvimento Social (SEMADS)<br>
            Centro de Referência de Assistência Social — CRAS Cristiana Vicente Nunes</p>
          </td>
          <td style="border:none;padding:0;text-align:right;font-size:9pt;color:#52667C;">
            Rua Santo Agostinho, 193b – Centenário<br>Boa Vista/RR<br>(95) 98402-6627<br>crascentenariosemges@gmail.com
          </td>
        </tr>
      </table>
      <hr/>
      <h1>Plano de Acompanhamento Familiar - PAF</h1>
      <p><b>CRAS:</b> ${escapeHtml(paf.crasNome)} | <b>Status:</b> ${STATUS_LABELS[paf.situacaoPAF] || "Em andamento"}</p>
      <hr/>
      <h2>01. Identificação</h2>
      <p><b>Responsável:</b> ${escapeHtml(paf.responsavel)} ${paf.apelido ? "(" + escapeHtml(paf.apelido) + ")" : ""}<br>
      <b>Nome da mãe:</b> ${escapeHtml(paf.nomeMae) || "—"}<br>
      <b>Sexo:</b> ${escapeHtml(paf.responsavelSexo) || "—"} | <b>Nacionalidade:</b> ${escapeHtml(paf.responsavelNacionalidade) || "—"}${paf.responsavelEtnia ? " (" + escapeHtml(paf.responsavelEtnia) + ")" : ""}<br>
      <b>CPF:</b> ${escapeHtml(paf.cpf)} | <b>NIS:</b> ${escapeHtml(paf.nis)} | <b>RG:</b> ${escapeHtml(paf.rg)} ${escapeHtml(paf.rgOrgao)}/${escapeHtml(paf.rgUf)}<br>
      <b>Endereço:</b> ${escapeHtml(enderecoCompleto(paf))}${paf.localizacaoDomicilio ? " (" + escapeHtml(paf.localizacaoDomicilio) + ")" : ""}<br>
      <b>Ponto de referência:</b> ${escapeHtml(paf.pontoReferencia) || "—"} | <b>Telefones:</b> ${escapeHtml(paf.telefones) || "—"}<br>
      <b>Data de Início:</b> ${fmtDateBR(paf.dataInicial)}</p>

      <h2>02. Composição Familiar</h2>
      <table>
        <tr><th>Nome</th><th>Data Nasc.</th><th>Sexo</th><th>Parentesco</th><th>Nacionalidade</th><th>Etnia indígena</th><th>PCD</th></tr>
        ${(paf.membros || []).map(m => `<tr><td>${escapeHtml(m.nome)}</td><td>${fmtDateBR(m.nascimento)}</td><td>${escapeHtml(m.sexo)}</td><td>${escapeHtml(m.parentesco)}</td><td>${escapeHtml(m.nacionalidade) || "—"}</td><td>${escapeHtml(m.etnia) || "—"}</td><td>${m.pcd ? "Sim" : "—"}</td></tr>`).join("")}
      </table>
      ${migracaoWordHTML}

      <h2>03. Diagnóstico e Vulnerabilidades</h2>
      <p>${(paf.vulnerabilidades || []).map(escapeHtml).join(", ") || "Nenhuma registrada"}</p>

      <h2>03a. Situações Sociais Registradas</h2>
      <table>
        <tr><th>Situação Social</th><th>Membros</th><th>Superada</th></tr>
        ${situacoesWordHTML}
      </table>

      <h2>03b. Trabalho Social Coletivo do PAIF</h2>
      <p>${(paf.atividadesColetivas || []).map(escapeHtml).join(", ") || "Nenhuma registrada"}${paf.atividadesColetivasOutras ? " | Outras: " + escapeHtml(paf.atividadesColetivasOutras) : ""}</p>

      <h2>03c. Serviços da Rede Socioassistencial</h2>
      <p><b>Proteção Social Básica:</b> ${(paf.servBasica || []).map(escapeHtml).join(", ") || "—"}<br>
      <b>Média Complexidade:</b> ${(paf.servMedia || []).map(escapeHtml).join(", ") || "—"}<br>
      <b>Alta Complexidade:</b> ${(paf.servAlta || []).map(escapeHtml).join(", ") || "—"}</p>

      <h2>03d. Diagnóstico Socioeconômico</h2>
      <p>
      <b>Habitação:</b> ${escapeHtml(paf.habitacaoTipo) || "—"}${paf.habitacaoAbrigoNome ? " (" + escapeHtml(paf.habitacaoAbrigoNome) + ")" : ""} | ${escapeHtml(paf.habitacaoParedes) || "—"} | Energia: ${escapeHtml(paf.habitacaoEnergia) || "—"} | Esgoto: ${escapeHtml(paf.habitacaoEsgoto) || "—"} | Área de risco: ${escapeHtml(paf.habitacaoAreaRisco) || "—"}<br>
      <b>Educação:</b> Fora da escola (0-5/6-14/15-17): ${escapeHtml(paf.eduForaEscola06) || "0"}/${escapeHtml(paf.eduForaEscola614) || "0"}/${escapeHtml(paf.eduForaEscola1517) || "0"}<br>
      <b>Trabalho e Renda:</b> Renda total: ${escapeHtml(paf.rendaTotal) || "—"} | Per capita: ${escapeHtml(paf.rendaPerCapita) || "—"}<br>
      <b>Saúde:</b> Doença grave: ${escapeHtml(paf.saudeDoencaGrave) || "—"} | Medicação controlada: ${escapeHtml(paf.saudeMedicacaoControlada) || "—"} | Uso de álcool: ${escapeHtml(paf.saudeAlcool) || "—"} | Uso de drogas: ${escapeHtml(paf.saudeDrogas) || "—"} | Gestante: ${escapeHtml(paf.saudeGestante) || "—"}</p>

      <h2>03e. Aspectos Psicossociais e Instrumentais Técnicos</h2>
      <p><b>Instrumentais utilizados:</b> ${(paf.instrumentaisTecnicos || []).map(escapeHtml).join(", ") || "—"}<br>
      <b>Aspectos relacionais observados:</b> ${escapeHtml(paf.aspectosPsicossociaisObs) || "—"}</p>

      <h2>04. Registro de Atendimentos</h2>
      <table>
        <tr><th>Data</th><th>Tipo</th><th>Técnico</th><th>Evolução</th><th>Encaminhamentos</th></tr>
        ${(paf.atendimentos || []).map(a => `<tr><td>${fmtDateBR(a.data)}</td><td>${escapeHtml(a.tipo)}</td><td>${escapeHtml(a.tecnico)}</td><td>${escapeHtml(a.evolucao)}</td><td>${escapeHtml(a.encaminhamentos)}</td></tr>`).join("") || "<tr><td colspan='5'>Nenhum atendimento registrado</td></tr>"}
      </table>

      ${(paf.encaminhamentosForm || []).length ? `
      <h2>04a. Encaminhamentos Formais (Formulário SUAS)</h2>
      <table>
        <tr><th>Data</th><th>Área</th><th>Órgão/Unidade</th><th>Objetivo</th><th>Contra-referência</th></tr>
        ${paf.encaminhamentosForm.map(e => `<tr><td>${fmtDateBR(e.data)}</td><td>${escapeHtml(e.area)}</td><td>${escapeHtml(e.orgaoDestino)}</td><td>${escapeHtml(e.objetivo)}</td><td>${escapeHtml(e.contraReferencia) || "—"}</td></tr>`).join("")}
      </table>` : ""}

      <h2>04b. Programas, Projetos e Benefícios Socioassistenciais</h2>
      <p><b>Participa de programas/projetos sociais:</b> ${escapeHtml(paf.participaProgramas) || "—"} — ${(paf.programasQuais || []).map(escapeHtml).join(", ") || "nenhum selecionado"}${paf.programasOutros ? " | Outros: " + escapeHtml(paf.programasOutros) : ""}<br>
      <b>Recebe outro benefício assistencial:</b> ${escapeHtml(paf.recebeBeneficio) || "—"} — ${(paf.beneficioQuais || []).map(escapeHtml).join(", ") || "nenhum selecionado"}${paf.beneficioOutro ? " | Outro: " + escapeHtml(paf.beneficioOutro) : ""}</p>

      <h2>04c. Recursos do Território (Rede de Apoio)</h2>
      <p>${(paf.redeApoio || []).map(escapeHtml).join(", ") || "Nenhum selecionado"}${paf.redeApoioOutros ? " | Outros: " + escapeHtml(paf.redeApoioOutros) : ""}</p>

      <h2>05. Metas e Resultados</h2>
      <table>
        <tr><th>Meta</th><th>Prazo</th><th>Resultados</th></tr>
        ${(paf.metas || []).map(m => `<tr><td>${escapeHtml(m.meta)}</td><td>${escapeHtml(m.prazo)}</td><td>${escapeHtml(m.resultados)}</td></tr>`).join("")}
      </table>

      <h2>05a. Estratégias e Eixos de Intervenção</h2>
      <p><b>Estratégias:</b> ${(paf.estrategias || []).map(escapeHtml).join(", ") || "—"}${paf.estrategiasOutras ? " | Outras: " + escapeHtml(paf.estrategiasOutras) : ""}<br>
      <b>Eixos de intervenção:</b> ${(paf.eixos || []).map(escapeHtml).join(", ") || "—"}${paf.eixosOutros ? " | Outros: " + escapeHtml(paf.eixosOutros) : ""}</p>

      <h2>06. Elaboração e Encerramento</h2>
      <p><b>Objetivos do PAIF trabalhados neste Plano:</b> ${(paf.objetivosPaif || []).map(escapeHtml).join("; ") || "Nenhum selecionado"}${paf.objetivosPaifOutros ? " | Outros: " + escapeHtml(paf.objetivosPaifOutros) : ""}<br>
      <b>Seguranças socioassistenciais afiançadas:</b> ${(paf.segurancasSocioassistenciais || []).map(escapeHtml).join("; ") || "Nenhuma selecionada"}${paf.segurancasSocioassistenciaisOutras ? " | Outras: " + escapeHtml(paf.segurancasSocioassistenciaisOutras) : ""}<br>
      <b>Família participou da elaboração:</b> ${escapeHtml(paf.familiaParticipou) || "—"}<br>
      <b>Técnico de Referência:</b> ${escapeHtml(paf.tecnicoReferencia) || "—"}<br>
      <b>Data de Elaboração:</b> ${fmtDateBR(paf.dataElaboracao) || "—"}<br>
      <b>Prazo de execução do Plano:</b> ${escapeHtml(paf.prazoExecucaoPlano) || "—"} | <b>Prazo de avaliação do Plano:</b> ${escapeHtml(paf.prazoAvaliacaoPlano) || "—"}<br>
      <b>Motivo de Encerramento:</b> ${escapeHtml(ENCERRAMENTO_MOTIVOS.find(m => m.v === paf.encerramentoMotivo)?.label) || "—"} ${paf.encerramentoOutros ? "(" + escapeHtml(paf.encerramentoOutros) + ")" : ""}<br>
      <b>Técnico do Encerramento:</b> ${escapeHtml(paf.encerramentoTecnico) || "—"} | <b>Data de Encerramento:</b> ${fmtDateBR(paf.encerramentoData) || "—"}<br>
      <b>Observações:</b> ${escapeHtml(paf.observacoes) || "—"}</p>

      ${(paf.anexos || []).length ? `
      <h2>07. Anexos</h2>
      ${(() => {
        const imgs = (paf.anexos || []).filter(a => a.tipo.startsWith("image/"));
        const pdfs = (paf.anexos || []).filter(a => a.tipo === "application/pdf");
        let out = "";
        if (imgs.length) {
          out += `<table style="border:none;"><tr>` + imgs.map(a => `
            <td style="border:none;text-align:center;padding:6pt;vertical-align:top;">
              <img src="${a.dataURL}" style="max-width:220px;max-height:220px;border:1px solid #CCCCCC;"><br>
              <span style="font-size:8pt;color:#52667C;">${escapeHtml(a.nome)}</span>
            </td>`).join("") + `</tr></table>`;
        }
        if (pdfs.length) {
          out += `<p><b>Documentos PDF anexados</b> (não incorporados a este arquivo Word — baixe-os separadamente pelo app, aba "Anexos"): ${pdfs.map(a => escapeHtml(a.nome)).join(", ")}</p>`;
        }
        return out;
      })()}` : ""}

      <hr/>
      <p style="font-size:8pt;color:#8496A8;text-align:center;">
        Prefeitura Municipal de Boa Vista · SEMADS · CRAS Cristiana Vicente Nunes —
        Rua Santo Agostinho, 193b, Centenário, Boa Vista/RR — (95) 98402-6627 — crascentenariosemges@gmail.com<br>
        Serviço de Proteção e Atendimento Integral à Família (PAIF) — Paulo Xavier, CRP-20/09816, Psicólogo
      </p>
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
  const loginIlustracao = document.getElementById("loginIllustration");
  if (loginIlustracao) loginIlustracao.innerHTML = protecaoIllustration(58);
  const loginLeft = document.getElementById("loginSceneLeft");
  if (loginLeft) loginLeft.innerHTML = pilarIconSvg("acolhida", 24);
  const loginRight = document.getElementById("loginSceneRight");
  if (loginRight) loginRight.innerHTML = pilarIconSvg("autonomia", 24);
  const loginPilares = document.getElementById("loginPilares");
  if (loginPilares) {
    loginPilares.innerHTML = ["acolhida", "convivio", "autonomia"].map(id => `
      <span class="login-pilar-item">${pilarIconSvg(id, 14)}<em>${id === "acolhida" ? "Acolhida" : id === "convivio" ? "Convívio" : "Autonomia"}</em></span>
    `).join("");
  }
  initAuth();
});
