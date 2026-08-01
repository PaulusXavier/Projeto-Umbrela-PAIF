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
       }
     }
   }
   ```

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
  e filtro por situação (Em andamento, Encaminhado, Concluído, Cancelado).
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
  card na lista.
- **Anexos**: na aba "Anexos" do formulário é possível anexar fotos e documentos PDF
  a cada PAF. Imagens são comprimidas automaticamente ao anexar. Ao **Baixar PDF**,
  as fotos aparecem no corpo do relatório e cada PDF anexado é incluído logo em
  seguida, uma página por documento (isso depende do navegador conseguir imprimir
  o PDF embutido — funciona bem no Chrome/Edge; se algum anexo não aparecer, baixe-o
  separadamente pelo botão "Baixar" do próprio anexo). No **Word (.doc)**, as fotos
  também são incorporadas ao documento, mas os PDFs continuam apenas listados por
  nome (o Word não permite embutir páginas de outro PDF).
  > **Atenção ao usar a sincronização em nuvem (Firestore):** cada PAF é salvo como
  > um único documento, que tem um limite de ~1 MB no total. O app avisa quando os
  > anexos de um PAF estão ficando grandes demais e recusa arquivos que ultrapassem
  > esse limite. Para anexar PDFs grandes com folga, prefira o modo local (sem
  > Firebase configurado) ou anexe poucos arquivos pequenos por PAF.
- O ícone ao lado de "Config" no topo mostra se a sincronização com a nuvem está ativa.
- Em **Config**, é possível baixar um backup em JSON de todos os registros.
- Na tela inicial, o botão **Resumo mensal** mostra um painel estatístico completo:
  indicadores gerais (total de PAFs, por situação, pessoas acompanhadas, pessoas com
  deficiência, idade média e tempo médio de acompanhamento), perfil dos responsáveis
  (sexo, nacionalidade, faixa etária), distribuição por CRAS, vulnerabilidades e
  situações sociais mais frequentes, programas e benefícios mais frequentes,
  encaminhamentos por área e uma tabela de evolução mensal (novos PAFs e acumulado,
  por mês de início). Pode ser impresso/baixado em PDF.

## 4. Fundamentação técnica

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

## 5. Arquivos do projeto

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Aparência/visual do app |
| `app.js` | Toda a lógica: formulário, sincronização, exportação |
| `firebase-config.js` | Chaves do seu projeto Firebase (editar conforme passo 1) |
| `manifest.json` / `sw.js` | Tornam o app instalável e utilizável offline |
| `icon-192.png` / `icon-512.png` | Ícones do app |

---
Paulo Xavier, CRP-20/09816, Psicólogo — Boa Vista, RR
