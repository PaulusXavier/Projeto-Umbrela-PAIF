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
         allow read, write: if true;
       }
     }
   }
   ```

   > Isso deixa a coleção aberta para leitura/escrita por quem tiver o link do app —
   > é o mesmo padrão usado nos outros aplicativos internos da equipe. Se quiser
   > restringir por senha/login mais adiante, é possível evoluir para regras com
   > autenticação do Firebase.

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

- **Tela inicial**: lista todos os PAFs cadastrados, com busca por responsável/CPF/CRAS
  e filtro por situação (Em andamento, Encaminhado, Concluído, Cancelado).
- **+ Novo PAF**: abre um formulário dividido em seções (aba lateral), replicando o
  documento original: Cabeçalho, Membros da Família, Diagnóstico, Situações e Serviços,
  Programas e Benefícios, Rede do Território, Metas e Evolução, Estratégias e Eixos,
  Elaboração do Plano, Encerramento e Observações.
- O preenchimento é salvo automaticamente (nuvem ou local, conforme o passo 1).
- **Baixar PDF** / **Baixar Word (.doc)**: geram o arquivo preenchido pronto para
  impressão/assinatura, tanto na tela do formulário quanto no menu "Exportar" de cada
  card na lista.
- O ícone ao lado de "Config" no topo mostra se a sincronização com a nuvem está ativa.
- Em **Config**, é possível baixar um backup em JSON de todos os registros.

## 4. Arquivos do projeto

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
