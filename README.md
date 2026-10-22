# Plano de Acompanhamento Familiar — PAF / PAIF

Aplicativo web (PWA) para preencher, guardar e exportar o **Plano de Acompanhamento
Familiar (PAF)** do **Serviço de Proteção e Atendimento Integral à Família (PAIF)**,
com todos os campos do formulário original em Word.

- Funciona no navegador (computador ou celular) e pode ser **instalado como app**
  (ícone na tela inicial, funciona offline).
- Guarda os registros preenchidos **na nuvem**, compartilhados automaticamente entre
  todos os aparelhos que abrirem o mesmo link — sem precisar configurar nada em cada
  dispositivo (depois do passo único de configuração abaixo).
- Exporta cada PAF preenchido em **PDF** e em **Word (.doc)**.

---

## 1. Configurar o armazenamento compartilhado (Firebase) — ~5 minutos, uma única vez

Enquanto esse passo não é feito, o app funciona normalmente, mas cada aparelho guarda
os registros só para si (não compartilha com os outros).

1. Acesse **https://console.firebase.google.com** e crie um projeto gratuito (plano *Spark*).
2. No menu lateral, clique em **Compilação > Firestore Database** → **Criar banco de dados**
   → escolha um local (ex.: `southamerica-east1`) → inicie em **modo de produção**.
3. Ainda no Firestore, abra a aba **Regras** e substitua pelo conteúdo abaixo, depois
   clique em **Publicar**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /planos_acompanhamento_familiar/{docId} {
         allow read, write: if request.auth != null;

         match /anexos/{anexoId} {
           allow read, write: if request.auth != null;
         }
       }
     }
   }
   ```

   > **Já tinha configurado a nuvem antes?** Volte em Firestore > Regras e cole
   > essa versão atualizada por cima da antiga (ela adiciona a subcoleção
   > `anexos`, usada para permitir anexar bem mais fotos/documentos por PAF —
   > veja a seção "Anexos" mais abaixo). Sem isso, novos anexos não vão
   > sincronizar com a nuvem.

   > Isso libera leitura/escrita só para quem estiver logado (ver passo 1a abaixo) —
   > sem login, não é possível ver nem alterar os registros, mesmo tendo o link do app.

### 1a. Ativar o login (Firebase Authentication) — obrigatório para a nuvem funcionar

1. No menu lateral do Firebase, vá em **Compilação > Authentication** → **Vamos começar**.
2. Na aba **Sign-in method** (Método de login), clique em **E-mail/senha** e ative a
   primeira opção (E-mail/senha). Salve.
3. Vá para a aba **Users** (Usuários) → **Add user** (Adicionar usuário) e cadastre
   o e-mail e uma senha provisória para cada técnico da equipe que vai usar o app.
   Repita para cada pessoa. Elas podem trocar a senha depois usando o link
   "Esqueci minha senha" na tela de login do app.

4. Volte à página inicial do projeto (ícone de engrenagem → **Configurações do projeto**),
   role até **Seus apps**, clique no ícone **`</>`** (Web), dê um nome ao app e clique em
   **Registrar app**.
5. O Firebase vai mostrar um bloco `firebaseConfig = {...}`. Copie os valores para dentro
   do arquivo **`firebase-config.js`** deste projeto, substituindo cada `"COLE_AQUI"`.
6. Salve o arquivo. Pronto — a partir do próximo deploy, todos os dispositivos que
   abrirem o app vão compartilhar os mesmos PAFs em tempo real.

---

## 2. Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público ou privado, mas se for privado
   o GitHub Pages exige uma conta paga — se quiser deixar simples, use público).
2. Envie todos os arquivos desta pasta para o repositório (`index.html`, `styles.css`,
   `app.js`, `firebase-config.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`).
3. No repositório, vá em **Settings > Pages** → em "Source", selecione a branch
   `main` e a pasta `/root` → **Save**.
4. Em alguns minutos o app estará disponível em algo como:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`
5. Esse é o link que a equipe deve abrir — no celular, o navegador vai oferecer
   "Adicionar à tela inicial" / "Instalar app".

---

## 3. Como o app funciona

- **Login**: se a sincronização em nuvem estiver ativa, o app pede e-mail e senha
  antes de mostrar qualquer registro. As contas são criadas pelo administrador
  no console do Firebase (passo 1a). O botão "Sair", no topo, encerra a sessão.
- **Tela inicial**: lista todos os PAFs cadastrados, com busca por responsável/CPF/CRAS
  e filtro por situação (Ativos = Em andamento; Arquivados = Encaminhado/Concluído).
- **Família desistiu**: no lugar do antigo "Cancelado", o botão de status agora chama-se
  "Família desistiu". Ao usá-lo, o PAF completo (todas as seções preenchidas) é excluído
  definitivamente — de todos os dispositivos, se a nuvem estiver ativa — e substituído por
  um registro mínimo (nome do responsável, CPF/NIS, CRAS, técnico de referência e data da
  desistência), guardado só para controle administrativo em **Configurações > Famílias
  desistentes**. Esses registros nunca aparecem na lista de PAFs, nos filtros, na busca ou
  no painel de Gráficos, e podem ser excluídos individualmente na mesma tela.
- **+ Novo PAF**: abre um formulário dividido em seções (aba lateral), replicando o
  documento original: Cabeçalho, Membros da Família, Diagnóstico, Situações e Serviços,
  Encaminhamentos, Programas e Benefícios, Rede do Território, Metas e Evolução,
  Estratégias e Eixos, Elaboração do Plano, Encerramento e Observações.
- **Identificação e endereço completos** (seção Cabeçalho): além de nome/CPF/NIS, agora
  também há apelido, nome da mãe, RG (com órgão emissor/UF/data), **sexo, data de
  nascimento e nacionalidade do responsável familiar**, e um endereço estruturado
  (rua, número, complemento, bairro, CEP, ponto de referência, telefones, urbano/rural) —
  aproveitado do Prontuário SUAS (MDS). O campo "Endereço resumido" continua existindo
  para registros antigos ou preenchimento rápido.
- **Composição familiar detalhada** (seção Membros da Família): cada membro agora também
  registra sexo, nacionalidade e se é pessoa com deficiência (PCD).
- **Trabalho Social Coletivo do PAIF** (nova subseção 04a, dentro de "Situações, Trabalho
  Coletivo e Serviços"): registre a participação da família em acolhida, grupos de
  acompanhamento familiar, SCFV articulado ao PAIF, oficinas socioeducativas, ações
  comunitárias e mobilização de redes — distinto dos encaminhamentos a outros órgãos.
- **Objetivos do PAIF trabalhados no Plano** (seção Elaboração do Plano): checklist com
  os objetivos do Serviço conforme a Tipificação Nacional de Serviços Socioassistenciais,
  para deixar claro qual finalidade do PAIF está sendo perseguida com aquela família —
  também aparece no PDF e no Word exportados.
- **Seguranças socioassistenciais afiançadas por este Plano** (seção Elaboração do Plano):
  checklist com as seguranças da Política Nacional de Assistência Social e da NOB-SUAS
  (acolhida; convívio ou vivência familiar, comunitária e social; desenvolvimento de
  autonomia), para registrar qual(is) delas o Plano se propõe a garantir para a família —
  também aparece no PDF e no Word exportados.
- **Diagnóstico socioeconômico** (dentro da seção Diagnóstico): blocos objetivos de
  Condições Habitacionais, Condições Educacionais, Condições de Trabalho e Renda e
  Condições de Saúde, no mesmo padrão do Prontuário SUAS — mais rápidos de preencher do
  que texto livre.
- **Encaminhamentos** (nova seção): registre encaminhamentos feitos a outros órgãos
  (Saúde, Educação, INSS, Habitação, Defensoria Pública etc.), com objetivo, profissional
  responsável e telefone. Cada encaminhamento pode ser impresso individualmente no modelo
  de Formulário de Encaminhamento do SUAS, com canhoto de protocolo e espaço para anotar
  a contra-referência (retorno) recebida do outro órgão.
- O preenchimento é salvo automaticamente (nuvem ou local, conforme o passo 1).
- **Baixar PDF** / **Baixar Word (.doc)**: geram o arquivo preenchido pronto para
  impressão/assinatura, tanto na tela do formulário quanto no menu "Exportar" de cada
  card na lista. O Word agora segue o mesmo padrão visual do PDF — faixa institucional,
  título com número da ficha, seções numeradas em destaque e bloco de assinaturas —
  em vez do documento simples de antes.
- **Resumo mensal** e **Formulário de Encaminhamento**: ambos ganharam a mesma
  identidade visual do prontuário individual (faixa institucional, título com
  "ficha"/contagem em destaque, cabeçalho e rodapé repetidos em cada página impressa),
  deixando as três folhas exportadas com aparência consistente.
- **Indicadores tipo RMA/Censo SUAS no Resumo mensal**: além da evolução mensal, o
  relatório agora traz o volume de famílias em acompanhamento no mês de referência
  (A.1. Total em acompanhamento; A.2. Novas famílias inseridas) e o perfil das novas
  famílias do mês (B.1 a B.6: extrema pobreza, Bolsa Família, descumprimento de
  condicionalidades, BPC, trabalho infantil e Serviço de Acolhimento), calculados
  automaticamente a partir das fichas — para apoiar o preenchimento do RMA. A relação
  de famílias (dados individuais) do mesmo relatório passou a trazer também
  nacionalidade, sexo, estado civil e idade do responsável familiar (RF) de cada PAF.
- **Anexos**: na aba "Anexos" do formulário é possível anexar fotos e documentos PDF
  a cada PAF. Imagens são comprimidas automaticamente ao anexar. Ao **Baixar PDF**,
  as fotos aparecem no corpo do relatório e cada PDF anexado é incluído logo em
  seguida, uma página por documento (isso depende do navegador conseguir imprimir
  o PDF embutido — funciona bem no Chrome/Edge; se algum anexo não aparecer, baixe-o
  separadamente pelo botão "Baixar" do próprio anexo). No **Word (.doc)**, as fotos
  também são incorporadas ao documento, mas os PDFs continuam apenas listados por
  nome (o Word não permite embutir páginas de outro PDF).
  > **Sincronização em nuvem (Firestore):** cada anexo agora é salvo no seu próprio
  > documento (subcoleção `anexos` dentro do PAF), em vez de dividir espaço com o
  > restante da ficha e com os outros anexos — por isso cada arquivo pode chegar a
  > quase 1 MB, e a soma por PAF sobe para até 20 MB (bem mais do que antes). Em
  > **modo local** (sem Firebase configurado), os anexos continuam guardados no
  > próprio aparelho, com limites um pouco mais conservadores (até 5 MB por arquivo,
  > 6 MB no total por PAF), por causa do espaço menor do armazenamento do navegador.
  > PAFs com anexos salvos antes desta atualização são migrados automaticamente para
  > o novo formato assim que forem abertos — nenhum arquivo já anexado se perde.
- O ícone ao lado de "Config" no topo mostra se a sincronização com a nuvem está ativa.
- Em **Config**, é possível baixar um backup em JSON de todos os registros.
- Na tela inicial, o botão **Ver gráficos** (aba "Gráficos" no topo) abre o painel
  estatístico completo: indicadores gerais (total de PAFs, por situação, pessoas
  acompanhadas, pessoas com deficiência, idade média e tempo médio de acompanhamento),
  perfil dos responsáveis (sexo, nacionalidade, faixa etária), distribuição por CRAS,
  vulnerabilidades e situações sociais mais frequentes, programas e benefícios mais
  frequentes, encaminhamentos por área, **PAFs por técnico de referência e serviços da
  rede socioassistencial/trabalho coletivo do PAIF acionados**, **taxa de situações
  sociais superadas** e uma tabela de evolução mensal (novos PAFs e acumulado, por mês
  de início). Pode ser impresso/baixado em PDF.
- O painel de Gráficos tem **filtros por período (todo o período, este ano, últimos 12,
  6 ou 3 meses), por CRAS e por técnico de referência**, além de uma barra de navegação
  rápida para pular entre as seções (Visão geral, Perfil das famílias, Território,
  Vulnerabilidades, Equipe e rede, Metas do Plano, Evolução mensal). O botão "Imprimir /
  Baixar PDF" respeita os filtros ativos no momento.

## 4. Assistente Paulus (IA)

O mascote do app agora abre uma conversa com o **Paulus**, o copiloto de IA compartilhado pelos apps
(repositório `Paulus`). Ele tira dúvidas do PAIF/SUAS **citando a norma** (documento e artigo) quando a
base tem, explica como usar o app e abre telas ("abrir prioridades", "abrir gráficos", "abrir
configurações", "abrir novo PAF" — este pede confirmação, porque cria um PAF em branco).

**Privacidade (não negociável):** o Paulus **não lê nenhum dado do app**. Nem PAFs, nem anexos, nem
Firestore. Só vai para o Worker a pergunta digitada (já filtrada: bloqueia nome, documento, telefone e
endereço residencial), as últimas mensagens da conversa e o nome genérico da tela. A resposta é inserida
na tela como texto, nunca como HTML. Ao sair da conta ou por inatividade, a conversa é apagada.

**O que o Paulus sabe sobre o app (base própria, no aparelho):** além das normas, ele consulta
`conhecimento-umbrella.json`, gerado do próprio código por `scripts/gerar-conhecimento-umbrella.mjs`
(~140 verbetes: as notas técnicas de cada seção, as listas do formulário — objetivos do PAIF, seguranças,
atividades coletivas, serviços, motivos de encerramento etc. —, o guia de cada seção, as dicas do mascote e o
"como usar" deste README). São textos fixos do app; nenhum dado de família entra. Quando você editar uma nota
técnica, uma lista ou o README, rode `node scripts/gerar-conhecimento-umbrella.mjs` e aumente o `CACHE_NAME` do
`sw.js`. Essa base fica separada de `conhecimento.json`, então não se perde ao copiar a base do repositório do Paulus.

**Como ele responde:** com IA ligada, a resposta vem da IA e, abaixo dela, o Paulus mostra botões
**"No app: …"** com os trechos do próprio Umbrella sobre o assunto (texto completo, fonte e, com um PAF aberto,
**"Ir para: seção"**). Sem IA, ou quando a IA não responde, ele usa a base local com a pergunta já limpa de palavras
de enfeite e com sinônimos do PAIF (`paulus-consulta.js`; ex.: "quantas famílias por técnico" acha a nota sobre
10 a 15 famílias). Em 25 perguntas de teste sobre o PAIF, os acertos subiram de 12 para 23. A pergunta enviada à IA
nunca é alterada.

**Comandos novos:** com um PAF aberto, "abrir diagnóstico", "abrir elaboração do plano", "abrir encerramento" etc.
(todas as seções) trocam a aba do formulário — só navegam, não alteram dados. O botão **"Explicar esta seção"**
resume a seção aberta e lista as notas técnicas dela.

**IA mais fiel ao app (opcional, no repositório do Paulus):** a IA roda no Worker e não enxerga este código. Para
que ela também "aprenda" o app, faça uma das duas coisas: (a) inclua `conhecimento-umbrella.json` na base que o
Worker consulta (ela passa a recuperar e citar essas notas); ou (b) cole `docs/umbrella-para-o-worker.md` na
descrição do Umbrella em `worker/apps.mjs`. Depois, publique o Worker de novo.

**Ativar a IA (uma vez):**

1. Publique o Worker do Paulus na Cloudflare (`docs/DEPLOY.md` do repositório Paulus) e **publique de
   novo** sempre que o texto do Umbrella em `worker/apps.mjs` mudar.
2. Em `paulus-umbrella.js`, preencha `PAULUS_ENDPOINT` com o endereço do Worker
   (`https://paulus-ia.SEU-NOME.workers.dev`).
3. No `wrangler.toml` do Paulus, confirme que `ALLOWED_ORIGINS` inclui o **domínio** onde o Umbrella
   está publicado (só o domínio, sem caminho: `https://SEU-USUARIO.github.io`).

Enquanto `PAULUS_ENDPOINT` estiver vazio, o painel funciona **só com a base de normas, no aparelho**
(sem IA, sem internet). O mesmo acontece quando o aparelho está offline ou a cota diária da IA acaba.

**Atualizar o Paulus:** no repositório do Paulus rode `npm run build`, copie `dist/paulus.v1.js` para
`paulus.v1.js` e `dist/conhecimento-geral.json` para `conhecimento.json` (use o pacote *geral*, ~0,4 MB;
não o `conhecimento.json` inteiro do Paulus, que passa de 7 MB) e aumente o número de `CACHE_NAME` em
`sw.js`.

---

## 5. Fundamentação técnica


Além do formulário original em Word, o conteúdo do app (campos, notas técnicas
e checklists) foi organizado com base em:

- **Lei Orgânica da Assistência Social — LOAS** (Lei nº 8.742, de 7 de dezembro de 1993,
  alterada pela Lei nº 12.435, de 6 de julho de 2011), que institui o SUAS e, no art. 6º-C,
  torna obrigatória a oferta do PAIF no CRAS — base legal citada na nota técnica introdutória
  da seção Cabeçalho;
- **Política Nacional de Assistência Social — PNAS** (2004), origem da concepção de
  vulnerabilidade social usada nas notas técnicas das seções Cabeçalho e Diagnóstico, e
  das seguranças socioassistenciais (acolhida; convívio ou vivência familiar, comunitária
  e social; desenvolvimento de autonomia) que o Plano indica no checklist da seção
  Elaboração do Plano;
- **Norma Operacional Básica do SUAS — NOB-SUAS** (Resolução CNAS nº 33, de 12 de dezembro
  de 2012), que organiza a oferta socioassistencial em torno dessas seguranças e da
  hierarquização dos serviços em Proteção Social Básica e Especial (de Média e Alta
  Complexidade) — usada no checklist "Seguranças socioassistenciais afiançadas" e na
  lista de serviços da rede socioassistencial (seção Situações, Trabalho Coletivo e
  Serviços);
- **Tipificação Nacional de Serviços Socioassistenciais** (Resolução CNAS nº 109, de 11 de
  novembro de 2009, com as alterações da Resolução CNAS nº 13, de 13 de maio de 2014) —
  fonte da definição oficial do PAIF, de seus objetivos (reproduzidos no checklist
  "Objetivos do PAIF" com a redação da própria Tipificação), usuários prioritários,
  provisões, aquisições dos usuários e articulação em rede, e também da relação completa
  de serviços por nível de complexidade (Proteção Social Básica: PAIF, SCFV e Serviço de
  Proteção Social Básica no Domicílio para Pessoas com Deficiência e Idosas; Média
  Complexidade: PAEFI, Serviço Especializado em Abordagem Social, Serviço de Proteção
  Social a Adolescentes em Cumprimento de Medida Socioeducativa, Serviço de Proteção
  Social Especial para Pessoas com Deficiência, Idosas e suas Famílias, e Serviço
  Especializado para Pessoas em Situação de Rua; Alta Complexidade: Acolhimento
  Institucional, em República, em Família Acolhedora, e Proteção em Situações de
  Calamidades Públicas e de Emergências) — usados no checklist "Serviços da Rede
  Socioassistencial" e nas notas técnicas das seções Rede do Território e Encerramento;
- **Protocolo de Gestão Integrada de Serviços, Benefícios e Transferências de Renda no
  âmbito do SUAS** (Resolução CIT nº 7, de 10 de setembro de 2009), que determina a
  prioridade de inclusão no acompanhamento do PAIF das famílias do Bolsa Família, do BPC
  e do PETI em maior vulnerabilidade — fundamenta, junto com a Trilha do PAIF sobre
  condicionalidades (abaixo), a nota técnica da seção Programas e Benefícios;
- **Decreto nº 6.307, de 14 de dezembro de 2007**, e o **Caderno de Orientações Técnicas
  sobre Benefícios Eventuais no SUAS** (MDS) — regulamentam a cesta básica, o auxílio
  natalidade, o auxílio funeral e o aluguel social como provisões suplementares e
  provisórias diante de vulnerabilidade temporária, afirmando-os como direito de cidadania
  e vedando comprovação vexatória de pobreza para concedê-los; fundamentam a segunda nota
  técnica da seção Programas e Benefícios;
- **Orientações Técnicas sobre o PAIF** (MDS/Secretaria Nacional de Assistência Social):
  - **Volume 1** — *O Serviço de Proteção e Atendimento Integral à Família – PAIF, segundo a
    Tipificação Nacional de Serviços Socioassistenciais* (2012), que detalha usuários,
    objetivos e o caráter não terapêutico do Serviço;
  - **Volume 2** — *Trabalho Social com Famílias do Serviço de Proteção e Atendimento
    Integral à Família – PAIF* (2012), base das notas sobre a diferença entre atendimento e
    acompanhamento e sobre o caráter não tutelar do trabalho social com famílias;
- **Prontuário SUAS** (MDS), para os campos de identificação, endereço e
  diagnóstico socioeconômico;
- **Trilhas "Trabalho Social com Famílias e Territórios no PAIF"** (MDS/UNICEF),
  usadas nas Notas técnicas de campos específicos do formulário:
  - *Trilha para o contexto das condicionalidades do Programa Bolsa Família* —
    fundamenta a nota sobre não cumprimento de condicionalidades como sinal de
    desproteção social (não punição), na seção Programas e Benefícios;
  - *Trilha para o contexto da Insegurança Alimentar e Nutricional* — fundamenta
    a nota sobre a fome como fenômeno multidimensional e o atendimento à demanda
    de cesta básica como porta de entrada para o acompanhamento, na seção
    Condições de Trabalho e Renda;
  - *Trilha para prevenção da violência doméstica e familiar contra as mulheres* —
    fundamenta a nota sobre acolhida sem exigência de comprovação e o papel
    preventivo/complementar do PAIF frente ao PAEFI, na seção Sobre o Grupo
    Familiar;
  - ***Trilha para a primeira infância*** (MDS, v. 4, julho de 2026), que fundamenta,
    em notas técnicas ao longo do formulário:
    - **Cabeçalho** — conceito de Trabalho Social com Famílias e Territórios (TSFT) e o
      ciclo do PAIF em cinco passos (este PAF registra os passos 2 a 4); primeira infância
      (0 a 6 anos) e gestação, Marco Legal (Lei nº 13.257/2016) e o Serviço de Proteção
      Social Básica no Domicílio para Gestantes e Crianças — SPSBD-GC (Resolução CIT
      nº 30/2025, em vigor em 1º/1/2027), complementar e referenciado ao PAIF;
    - **Membros da Família** — análise da família em sua totalidade, situações de cuidado
      (cuidador solo, adolescente, com deficiência, sem rede), sobrecarga feminina e
      corresponsabilização masculina;
    - **Diagnóstico** — vulnerabilidades por tipo de demanda (pobreza monetária, acesso
      insuficiente a direitos, demanda por cuidados, vínculos fragilizados), riscos
      sociais como prioridade absoluta, desproteções em ordem de gravidade (Quadro 7),
      interseccionalidade e Grupos Populacionais Tradicionais e Específicos;
    - **Potencialidades** — estratégias de sobrevivência, redes de solidariedade e
      perguntas-guia do Quadro 8;
    - **Trabalho Social Coletivo** — preponderância das atividades coletivas, modalidades
      (pequenos grupos, ações comunitárias, arranjos participativos), brincar como
      direito e parentalidade positiva e protetiva;
    - **Encaminhamentos** — "encaminhar não basta: chegou? permaneceu?", elementos mínimos
      dos fluxos de referência e contrarreferência, vinculação como direito e não
      obrigação;
    - **Registro de Atendimentos, Estratégias, Elaboração do Plano e Encerramento** —
      registro técnico sem juízo de valor, vinculações possíveis, pactuação das metas a
      partir das expectativas da família (Quadro 9) e avaliação de resultados com a
      família (Quadro 14), sem caráter classificatório ou punitivo;
    - **Prioridades e Gráficos** — priorização por gravidade e busca ativa (Passo 2) e
      monitoramento agregado do PAIF, sem responsabilização moralizante (Passo 5);
    - **Assistente Paulus** — 18 verbetes de resumo da Trilha na base de normas
      (`conhecimento.json`, documento `paif-trilha-primeira-infancia-2026`). Se a base for
      regenerada a partir do repositório do Paulus (seção 4), inclua esse documento lá
      também, para que não se perca;
- ***A dimensão coletiva no SUAS: concepção e práticas no PAIF e no PAEFI*** (MDS/UNICEF,
  1ª ed., NDH-PUCPR, 2026), que fundamenta, em notas técnicas e na base do Paulus:
  - **Cabeçalho** — dimensão coletiva como termo guarda-chuva e chave de leitura da política
    (LOAS, NOB-RH, NOB-SUAS, Orientações Técnicas do PAIF, Trilhas) e distinção entre
    *atividades coletivas* e *visão coletiva* do TSFT, que orienta inclusive este PAF
    particularizado;
  - **Diagnóstico** — desproteções materiais e relacionais sem hierarquia; sofrimento
    ético-político, sofrimento social e fatalismo como chaves para ler a "baixa adesão" sem
    culpabilizar a família;
  - **Sobre o Grupo Familiar e Potencialidades** — território vivo, caráter comunitário,
    ativos do território, "referências comunitárias" no lugar de "lideranças";
  - **Trabalho Social Coletivo (04a)** — modalidades (acolhida coletiva, rodas de conversa,
    oficinas, grupos operativos; mobilização de coletivos, eventos culturais, campanhas
    socioeducativas, articulação de redes) como percursos processuais; "construir com, e não
    para" (participação como método, lente interseccional, horizontalidade, linguagem
    popular, vínculo); registro e indicadores de processo. O checklist de atividades
    coletivas ganhou os itens correspondentes (os registros antigos continuam válidos);
  - **Rede do Território e Encaminhamentos** — articulação intersetorial e entre a própria
    rede, corresponsabilização, integração PAIF–PAEFI sem que o encaminhamento ao CREAS
    encerre a responsabilidade do CRAS;
  - **Elaboração do Plano e Encerramento** — metas pactuadas em linguagem acessível, vínculo
    a processos coletivos e avaliação de participação comunitária, rede de apoio e
    pertencimento;
  - **Gráficos** — qualidade dos acompanhamentos acima do volume de atendimentos e devolutiva
    da Vigilância Socioassistencial às equipes;
  - **Assistente Paulus** — 15 verbetes de resumo do Caderno (`conhecimento.json`, documento
    `paif-dimensao-coletiva-suas-2026`). Se a base for regenerada a partir do repositório do
    Paulus (seção 4), inclua esse documento lá também;
- **Referências Técnicas para Atuação de Psicólogas(os) no CRAS/SUAS**
  (Conselho Federal de Psicologia / CREPOP, 3ª ed., 2021), que fundamenta,
  em especial: o entendimento da vulnerabilidade como situação social e
  dinâmica (não um traço fixo ou culpa da família); o reconhecimento da
  pluralidade de arranjos familiares atendidos pelo CRAS, além do modelo
  nuclear tradicional; o caráter territorial e comunitário do trabalho do
  PAIF, com foco no fortalecimento de vínculos; e o caráter não tutelar do
  Plano de Acompanhamento, que deve fortalecer a autonomia e o protagonismo
  da família, evitando o assistencialismo e a resolução pontual de "casos".
  Essas referências aparecem no app como "Notas técnicas" ao longo das
  seções do formulário.

- **"Psicologia que sobe morro e desce ladeira: vinhetas não [tão] clínicas de
  atuação da Psicologia no Centro de Referência de Assistência Social (CRAS)"**
  (relato de experiência de uma psicóloga do Suas) — fundamenta, em especial:
  a distinção entre matricialidade sociofamiliar e "atender todos os membros
  juntos" (a centralidade na família é uma postura de não perder de vista o
  contexto familiar, mesmo em atendimentos individuais, e não uma exigência de
  reunir a família inteira), usada na nota técnica da seção Sobre o Grupo
  Familiar; a compreensão de territorialização como território vivo — espaço
  de disputas e potencialidades, não apenas localização geográfica dos
  serviços —, também usada nessa seção; e a crítica ao vocabulário
  estigmatizante ainda comum no cotidiano da assistência social (como
  "carente", "família desestruturada" e a lógica de "ajuda"/favor), que
  fundamenta o cuidado de linguagem indicado nas notas técnicas das seções
  Diagnóstico e Elaboração do Plano — reforçando, com relatos de campo, o
  caráter de direito (e não de tutela, caridade ou disciplinamento) que
  já orienta o restante desta fundamentação.

Nenhum desses documentos substitui o julgamento técnico da equipe do CRAS —
servem apenas como referência para orientar o preenchimento e a leitura do
Plano.

## 6. Arquivos do projeto

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Aparência/visual do app |
| `app.js` | Toda a lógica: formulário, sincronização, exportação |
| `firebase-config.js` | Chaves do seu projeto Firebase (editar conforme passo 1) |
| `manifest.json` / `sw.js` | Tornam o app instalável e utilizável offline |
| `paulus.v1.js` | Módulo do Paulus (cópia local, gerada no repositório Paulus: `npm run build`) |
| `paulus-umbrella.js` | Liga o Paulus ao app: painel de conversa, telas que ele abre e regras de privacidade |
| `conhecimento.json` | Base de normas leve do Paulus (leis e decretos), usada também offline |
| `conhecimento-umbrella.json` | O que o app ensina sobre o PAIF, em verbetes (gerado por `scripts/gerar-conhecimento-umbrella.mjs`; não editar à mão) |
| `paulus-consulta.js` | Limpa a pergunta e acrescenta sinônimos do PAIF antes de consultar a base local |
| `scripts/gerar-conhecimento-umbrella.mjs` | Gera `conhecimento-umbrella.json` e `docs/umbrella-para-o-worker.md` a partir do `app.js` e deste README |
| `docs/umbrella-para-o-worker.md` | Resumo do app para a IA do Paulus (colar em `worker/apps.mjs` do repositório Paulus) |
| `icon-192.png` / `icon-512.png` | Ícones do app |

---
Paulo Xavier, CRP-20/09816, Psicólogo — Boa Vista, RR

---

## Histórico de Evolução da Família

A seção **Histórico de Evolução** (penúltima do menu lateral) guarda, automaticamente, tudo o que
é alterado no PAF — com data, usuário, valor anterior e valor novo —, para acompanhar a evolução
da família com o tempo.

- **Registro automático:** ao mudar renda, moradia, escolaridade, vulnerabilidades, situações
  sociais, metas, membros etc., o app anota "antes → depois". Alterações do mesmo dia são
  agrupadas num único registro (o "antes" é o valor do início do dia).
- **Data da evolução:** cada registro tem uma data editável — útil quando a mudança aconteceu
  antes do dia em que foi lançada no app.
- **Marco manual:** botão "Registrar marco" para anotar avanços que não aparecem em nenhum campo.
- **Duas visões:** *Linha do tempo* (por data) e *Por campo* (trajetória de cada campo, com
  mini-gráfico para renda e outros números). Filtro por seção.
- **Exportação:** o histórico sai no PDF e no Word do PAF.
- **Nuvem:** o histórico fica dentro do próprio documento do PAF — não exige mudar as regras do
  Firestore. Se ficar muito grande (limite de 1 MB por documento), os registros automáticos mais
  antigos são descartados.
- O histórico começa a valer a partir do momento em que esta versão é publicada; PAFs antigos
  não têm histórico retroativo.

---

## Anotações e armazenamento (atualização)

- **Anotações:** os campos de texto crescem sozinhos, mostram contagem de palavras/caracteres e têm o botão **⤢ Ampliar** (editor em tela cheia; *Esc* ou *Ctrl+Enter* conclui). Um selo discreto no canto inferior esquerdo mostra "Salvo às HH:MM".
- **Anexos:** medidor de espaço do PAF, arrastar-e-soltar, **tipo de documento** e **legenda** por anexo (a legenda sai no PDF impresso), busca e visualizador interno de imagens (setas ← →).
- **Config > Armazenamento:** espaço usado (fichas × anexos), famílias com mais anexos, **backup com anexos** e **restauração** (só acrescenta fichas inexistentes; nunca sobrescreve).
- Arquivo novo: `notas.js`. Cache do service worker atualizado para `paf-paif-v52`.

### Segunda rodada (anotações)

- **📋 Modelos:** textos-modelo (visita domiciliar, atendimento, contato telefônico, ausência, encaminhamento, grupo PAIF) inseridos no cursor com a data de hoje; dá para salvar o texto de um campo como modelo próprio (fica só neste aparelho).
- **🎤 Ditar:** escreve falando (pt-BR) em navegadores compatíveis. Pede confirmação na primeira vez, pois o áudio pode ser processado fora do aparelho — evite dados que identifiquem a família.
- **Busca:** a lista de fichas agora ignora acentos e também procura dentro das anotações (observações e evolução dos atendimentos).
- **Ctrl+S** salva a ficha aberta. **Lembrete de backup** (no máximo 1 por dia) quando passam 30 dias sem backup; Config mostra a data do último backup.
- Cache do service worker: `paf-paif-v53`.

### Terceira rodada (leitura e segurança do que foi digitado)

- **Config > Aparência e leitura:** tamanho do texto (Normal / Grande / Maior / Máximo) e modo de **alto contraste**; a escolha fica salva neste aparelho.
- **Anotações por dia (Histórico):** botões **Copiar todas as anotações** e **Baixar (.txt)** — reúne observações e evolução dos atendimentos em ordem cronológica.
- Ao fechar a aba, minimizar ou trocar de app, o que foi digitado e ainda não tinha sido salvo é gravado na hora.
- Cache do service worker: `paf-paif-v54`.

### Quarta rodada (campo e segurança)

- **★ Fixar anotação:** anotações importantes ficam no topo do campo e do Histórico, destacadas em dourado.
- **Desfazer:** ao remover uma anotação aparece "Desfazer" por 9 segundos (sem janela de confirmação).
- **Anexos:** botão **📷 Tirar foto agora** (celular/tablet, abre a câmera traseira) e **colar imagem com Ctrl+V** no computador.
- Cache do service worker: `paf-paif-v55`.

### Quinta rodada (lista de fichas)

- Cada ficha mostra o **último registro** (anotação ou atendimento) e há quantos dias; em andamento há 30+ dias fica em destaque dourado.
- Novo filtro **"Sem registro há 30+ dias"** (com contagem) para ver quem está sem acompanhamento.
- Botão **+ Anotar** em cada linha: abre a ficha direto em Observações com uma anotação nova de hoje, pronta para digitar.
- Cache do service worker: `paf-paif-v56`.
