/*
  Script de administrador — roda no seu computador (Node.js), NÃO faz parte do
  app publicado no GitHub Pages. Serve para criar a conta de cada técnico já
  vinculada ao CRAS dele, para usar com a variante multi-CRAS das regras do
  Firestore (veja firestore.rules).

  Se todos os técnicos são do MESMO CRAS (uso mais comum deste projeto), você
  não precisa deste script — continue criando os usuários direto pelo Firebase
  Console (Authentication > Users > Add user), como o README já explica.

  --------------------------------------------------------------------------
  Como usar:

  1. Instale a dependência (uma vez só):
       npm install firebase-admin

  2. Baixe a chave de conta de serviço do seu projeto Firebase:
       Console do Firebase > Configurações do projeto > Contas de serviço
       > "Gerar nova chave privada" — salva um arquivo .json.
     Guarde esse arquivo em local seguro (NUNCA envie para o GitHub). Renomeie
     para "service-account.json" e coloque na mesma pasta deste script.

  3. Rode:
       node script-admin-criar-usuario.js
     (edite a lista CONTAS abaixo antes, com os técnicos reais)
  --------------------------------------------------------------------------
*/

const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Preencha com os técnicos que vão usar o app. "cras" deve ser IDÊNTICO ao
// texto que será digitado no campo "CRAS" do formulário (Cabeçalho do PAF).
const CONTAS = [
  // { email: "tecnico1@exemplo.com", senhaProvisoria: "TrocarNoPrimeiroAcesso1", cras: "Cristiana Vicente Nunes" },
  // { email: "tecnico2@exemplo.com", senhaProvisoria: "TrocarNoPrimeiroAcesso2", cras: "Cristiana Vicente Nunes" },
];

async function criarConta({ email, senhaProvisoria, cras }) {
  try {
    const user = await admin.auth().createUser({ email, password: senhaProvisoria });
    if (cras) await admin.auth().setCustomUserClaims(user.uid, { cras });
    console.log(`✔ Criado: ${email}${cras ? ` (CRAS: ${cras})` : ""}`);
  } catch (err) {
    console.error(`✘ Falha ao criar ${email}:`, err.message);
  }
}

(async () => {
  if (!CONTAS.length) {
    console.log("Nada a fazer — edite a lista CONTAS neste arquivo com os técnicos reais antes de rodar.");
    return;
  }
  for (const conta of CONTAS) await criarConta(conta);
  console.log("\nPronto. Peça para cada técnico usar \"Esqueci minha senha\" no app para definir a senha definitiva.");
})();
