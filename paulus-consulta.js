/*
  Paulus no Umbrella — refinamento da consulta à base local (roda no aparelho, sem rede).

  A busca do Paulus compara as palavras da pergunta com os trechos da base. Perguntas naturais trazem
  palavras de enfeite ("o que significa", "no app", "me explique") que derrubam a cobertura e fazem a
  busca desistir. Aqui a pergunta é limpa e recebe sinônimos do vocabulário do PAIF.
  Só mexe na consulta LOCAL. A pergunta enviada à IA continua exatamente como a pessoa escreveu.

  Função pura (sem DOM, sem dados de família): testável em Node.
*/
(function (root) {
  "use strict";

  const norm = s => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  // Expressões que não dizem nada sobre o assunto (testadas já sem acento).
  const ENFEITE = [
    "o que significa", "o que quer dizer", "o que e", "o que sao", "qual e a diferenca entre", "qual a diferenca entre",
    "me explique", "me explica", "explique", "explica", "pode explicar", "pode me explicar", "quero saber", "gostaria de saber",
    "como funciona", "como e que", "para que serve", "pra que serve", "qual o", "qual a", "quais os", "quais as", "quais sao",
    "no aplicativo", "no app", "do app", "deste app", "neste app", "do aplicativo", "no sistema", "aqui no", "aqui",
    "por favor", "paulus", "umbrella", "oi", "ola"
  ];

  // Palavra da pessoa -> termos que o texto técnico usa. Só entra o que ajuda a achar o trecho certo.
  const SINONIMOS = [
    [/\b(tecnico|tecnica|profissional|assistente social|psicologo|psicologa)\b/, "tecnico referencia equipe"],
    [/\b(quantas familias|quantas familia|limite de familias|capacidade)\b/, "familias por tecnico demanda reprimida"],
    [/\b(prioridade|prioridades|priorizar|priorizacao|fila)\b/, "prioridades escala fila tecnica busca ativa"],
    [/\b(encerrar|encerramento|fechar|finalizar|dar baixa|concluir)\b/, "encerramento objetivos alcancados desligamento"],
    [/\b(desistiu|desistencia|desistir|nao quer mais)\b/, "familia desistiu excluido registro minimo"],
    [/\b(meta|metas|objetivo da familia)\b/, "metas pactuacao expectativas da familia formular escrever meta observavel prazo"],
    [/\b(abrir um paf|abrir o paf|quando abrir|propor acompanhamento|inserir a familia|decidir acompanhar)\b/, "estudo social decisao acompanhar atendimento pontual propor acompanhamento"],
    [/\b(assumem|assume|assumir|responsabilidades)\b/, "compromissos familia servico rede pactuacao"],
    [/\b(devolutiva|devolver o plano|devolver)\b/, "devolutiva familia plano linguagem simples potencialidades"],
    [/\b(genograma|ecomapa)\b/, "genograma ecomapa instrumentais entrevista"],
    [/\b(quem pode ver|quem acessa|quem tem acesso|acesso ao paf)\b/, "consentimento sigilo anexos acesso prontuario equipe tecnica"],
    [/\b(alcancada|alcancou|alcancadas)\b/, "meta nao alcancada readequar plano"],
    [/\b(compromisso|compromissos|pactuar|pactuacao|contrato)\b/, "compromissos pactuacao familia servico rede encontro inicial"],
    [/\b(readequar|readequacao|revisar|revisao|atualizar o plano|reavaliar|reavaliacao|mudar o plano|plano nao funcionou|travou)\b/, "reavaliar readequar plano meta nao alcancada historico revisao"],
    [/\b(particularizado|particularizada|individual ou em grupo|em grupo)\b/, "acompanhamento particularizado em grupo familias vulnerabilidades similares"],
    [/\b(exito|deu certo|funcionou|resultado do acompanhamento|avaliar o acompanhamento)\b/, "exito seguranças acesso direitos avaliacao conjunta"],
    [/\b(estudo social)\b/, "estudo social acompanhamento encontro inicial plano"],
    [/\b(migrante|migrantes|venezuelana|venezuelano|abrigo|refugiada|refugiado|indigena|indigenas|warao|macuxi|wapichana)\b/, "migrantes indigenas situacao documental rede especifica intercultural"],
    [/\b(erro|erros|checklist|bem feito|qualidade do plano|plano bom)\b/, "erros comuns checklist qualidade do plano"],
    [/\b(psicologa|psicologo|psicologia|papel do psicologo)\b/, "psicologia no paf escuta nao terapeutico saude mental"],
    [/\b(grupo|grupos|roda|rodas|oficina|oficinas|coletivo|coletiva|coletivas)\b/, "coletivo oficina grupo acolhida coletiva"],
    [/\b(rede|intersetorial|articulacao)\b/, "rede territorio articulacao referencia contrarreferencia"],
    [/\b(encaminhar|encaminhamento|encaminhamentos|contrarreferencia|contra referencia)\b/, "encaminhamento referencia contrarreferencia"],
    [/\b(vulnerabilidade|vulnerabilidades|risco|riscos|desprotecao|desprotecoes)\b/, "vulnerabilidade risco desprotecao diagnostico"],
    [/\b(potencialidade|potencialidades|pontos fortes|forcas)\b/, "potencialidades estrategias de sobrevivencia redes de solidariedade"],
    [/\b(acompanhamento|acompanhar)\b/, "acompanhamento familiar PAF processo continuado"],
    [/\b(atendimento)\b/, "atendimento pontual acompanhamento"],
    [/\b(violencia|violacao|violacoes|abuso|maus tratos)\b/, "violencia violacao CREAS PAEFI"],
    [/\b(bolsa familia|condicionalidade|condicionalidades|descumprimento)\b/, "bolsa familia condicionalidades descumprimento"],
    [/\b(beneficio eventual|beneficios eventuais|cesta basica|auxilio natalidade|auxilio funeral|aluguel social)\b/, "beneficios eventuais cesta basica auxilio"],
    [/\b(territorio|comunidade|comunitario|comunitaria)\b/, "territorio comunitario referencias comunitarias"],
    [/\b(grafico|graficos|indicador|indicadores|rma|relatorio)\b/, "graficos indicadores RMA resumo mensal"],
    [/\b(seguranca|segurancas)\b/, "segurancas socioassistenciais acolhida convivio autonomia"],
    [/\b(registro|registrar|prontuario|anotar|anotacao)\b/, "registro prontuario sem juizo de valor"],
    [/\b(sigilo|lgpd|anexo|anexos|confidencial)\b/, "sigilo anexos LGPD"],
    [/\b(visita|visitas|domiciliar)\b/, "visita domiciliar consentimento"],
    [/\b(construir com|junto com a familia|participacao)\b/, "participacao familia sujeito pactuacao"],
    [/\b(terapia|psicoterapia|terapeutico|terapeutica|clinico|clinica|tratamento psicologico)\b/, "terapeutico carater nao terapeutico saude mental rede intersetorial"],
    [/\b(religiao|religioso|religiosa|igreja|culto|oracao)\b/, "laicidade praticas religiosas"],
    [/\b(nao adere|nao aderiu|adesao|nao comparece|nao vem|faltou|abandono do acompanhamento|baixa adesao)\b/, "adesao baixa adesao desprotecao fatalismo participacao voluntaria"],
    [/\b(exigir|obrigar|obrigatorio|obrigatoria|imposto|condicao)\b/, "voluntaria nao pode ser imposta condicionalidade"],
    // --- uso do app (manual do Umbrella): vocabulário de quem pergunta "como faço no sistema" ---
    [/\b(ler as fichas|le as fichas|consegue ler|ver as fichas|ve as fichas|enxerga|acessa os dados|le os dados|ver os dados|dados das familias|privacidade|lgpd do paulus)\b/, "Paulus nao le nenhum dado privacidade fichas filtro"],
    [/\b(atalho|atalhos|teclado|ctrl|tecla)\b/, "atalhos de teclado Ctrl+S salvar busca Alt setas"],
    [/\b(salvar|salva|salvou|salvamento|autosave|perdi|perdeu|sincronizar|sincroniza|sincronizacao|nuvem)\b/, "salvamento automatico salvo nuvem local sincronizacao"],
    [/\b(sessao|inatividade|inativo|login|senha|sair|logout|deslogou|caiu)\b/, "login sessao inatividade senha sair encerrada"],
    [/\b(instalar|instalacao|offline|sem internet|pwa|tela inicial do celular)\b/, "instalar app offline tela inicial service worker"],
    [/\b(backup|restaurar|restauracao|copia de seguranca|armazenamento|espaco)\b/, "backup restaurar configuracoes armazenamento espaco usado"],
    [/\b(modo foco|foco|tela inteira)\b/, "modo foco tela inteira menu lateral"],
    [/\b(pontos|pontuacao|pontua|peso|pesos|score|escala)\b/, "escala prioridades pontos peso nivel alta media regular"],
    [/\b(extrema pobreza|218|a 1|b 1|novas familias)\b/, "RMA extrema pobreza indicadores A.1 A.2 B.1 resumo mensal"],
    [/\b(progresso|preenchido|preenchimento|percentual|completo|completa)\b/, "progresso preenchimento secoes percentual preenchido"],
    [/\b(alerta|alertas|pendencia|pendencias)\b/, "alertas painel de apoio ficha pendencias"],
    [/\b(pdf|word|doc|exportar|exportacao|imprimir|baixar|capa|sumario)\b/, "exportar PDF Word imprimir capa sumario assinaturas"],
    [/\b(foto|fotos|camera|colar imagem|escanear|upload|arquivo grande|tamanho do arquivo|limite do anexo|limite de anexo)\b/, "anexos foto camera limite tamanho arquivo"],
    [/\b(ditar|ditado|voz|modelo|modelos|template|ampliar|fixar)\b/, "anotacoes modelos ditar ampliar fixar anotacao"],
    [/\b(historico|linha do tempo|marco|evolucao da familia)\b/, "historico de evolucao marco linha do tempo por campo"],
    [/\b(mascote|guarda chuva|minimizar|minimizado|paulus|comando|comandos)\b/, "mascote Paulus minimizar comandos abrir telas privacidade"],
    [/\b(tamanho do texto|tamanho da letra|letra|fonte|contraste|enxergar|aparencia)\b/, "aparencia tamanho do texto alto contraste configuracoes"],
    [/\b(excluir|apagar|deletar|remover ficha)\b/, "excluir ficha confirmacao desistencia menu mais"],
    [/\b(cpf|duplicado|duplicada|nis)\b/, "CPF duplicado validacao NIS cabecalho"],
    [/\b(filtro|filtros|filtrar|ordenar|buscar na lista|busca na lista|pesquisar|procurar ficha)\b/, "lista busca filtros ordenar sem registro 30 dias tecnico"],
    [/\b(habitacao|moradia|agua|esgoto|energia|lixo|comodos)\b/, "condicoes habitacionais diagnostico 03a tipo de residencia"],
    [/\b(protocolo|prontuario numero|numero da ficha)\b/, "protocolo numero ficha ordem de criacao"],
    [/\b(menu lateral|secoes|secao|abas|navegar|navegacao)\b/, "mapa das secoes menu lateral navegar secao anterior proxima"],
    [/\b(tipo de atendimento|tipos de atendimento|registrar atendimento|atendimentos)\b/, "registro de atendimentos metas e evolucao tipos de atendimento"]
  ];

  function limparPergunta(texto) {
    let t = " " + norm(texto) + " ";
    for (const e of ENFEITE.slice().sort((a, b) => b.length - a.length)) t = t.split(" " + e + " ").join(" ");
    return t.replace(/\s+/g, " ").trim();
  }

  // Devolve { limpa, expandida }. "expandida" = pergunta limpa + sinônimos (usada na busca local).
  function refinar(texto) {
    const limpa = limparPergunta(texto);
    const base = limpa || norm(texto);
    const extras = [];
    for (const [re, termos] of SINONIMOS) if (re.test(" " + base + " ")) extras.push(termos);
    return { limpa: base, expandida: (base + " " + extras.join(" ")).trim() };
  }

  const api = { refinar, limparPergunta };
  root.PaulusConsulta = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);
