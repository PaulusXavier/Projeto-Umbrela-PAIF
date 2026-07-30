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

- **Orientações Técnicas sobre o PAIF** (MDS, vols. 1 e 2);
- **Tipificação Nacional de Serviços Socioassistenciais** (MDS);
- **Prontuário SUAS** (MDS), para os campos de identificação, endereço e
  diagnóstico socioeconômico;
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
