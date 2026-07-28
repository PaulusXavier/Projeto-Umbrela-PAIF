/* =========================================================================
   firebase-config.js - Configuração e Persistência Offline
   ========================================================================= */

// Configuração de credenciais do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByab3GgZB-9uNjQrguggSYqR7Bxv5pIXE",
  authDomain: "paif-d2ab8.firebaseapp.com",
  projectId: "paif-d2ab8",
  storageBucket: "paif-d2ab8.firebasestorage.app",
  messagingSenderId: "477546152425",
  appId: "1:477546152425:web:05a6265f23028e4f468b78",
  measurementId: "G-Y10LF92J1X"
};

// Inicializa a aplicação Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Inicializa a instância do Firestore
const db = firebase.firestore();

// Ativa a persistência de dados offline (Multi-Tab)
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log('Persistência offline do Firestore ativada com sucesso.');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Múltiplas abas abertas simultaneamente podem causar isso em navegadores sem suporte total a lock
      console.warn('Persistência offline desativada: Ativa apenas na primeira aba aberta.');
    } else if (err.code === 'unimplemented') {
      // Navegadores muito antigos ou em modos privados restritivos
      console.warn('O navegador atual não suporta suporte offline do Firestore.');
    } else {
      console.error('Erro ao habilitar persistência do Firestore:', err);
    }
  });
