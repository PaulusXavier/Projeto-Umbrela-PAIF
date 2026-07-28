/*
  CONFIGURAÇÃO DO FIREBASE — leia o README.md para o passo a passo completo (leva ~5 minutos).

  1. Crie um projeto gratuito em https://console.firebase.google.com
  2. No menu lateral, ative "Firestore Database" (modo produção) e depois cole as regras
     que estão no README.md em Firestore > Regras.
  3. Em "Configurações do projeto" (ícone de engrenagem) > aba "Geral" > "Seus apps",
     crie um app da Web (</>) e copie o objeto de configuração para dentro do objeto abaixo.

  Depois de preencher e publicar no GitHub Pages, TODOS os dispositivos que abrirem
  este mesmo link vão compartilhar automaticamente os mesmos Planos de Acompanhamento
  Familiar salvos — não é preciso configurar nada em cada aparelho.

  Enquanto os campos abaixo estiverem como "COLE_AQUI", o app funciona normalmente,
  mas guarda os PAFs apenas no aparelho atual (sem sincronizar com outros dispositivos).
*/

const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// Nome da coleção usada no Firestore — pode manter como está.
const FIRESTORE_COLLECTION = "planos_acompanhamento_familiar";
