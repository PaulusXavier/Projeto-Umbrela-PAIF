// firebase-config.js

// Configuração do Firebase com as suas credenciais[cite: 2, 5]
const firebaseConfig = {
  apiKey: "AIzaSyByab3GgZB-9uNjQrguggSYqR7Bxv5pIXE",
  authDomain: "paif-d2ab8.firebaseapp.com",
  projectId: "paif-d2ab8",
  storageBucket: "paif-d2ab8.firebasestorage.app",
  messagingSenderId: "477546152425",
  appId: "1:477546152425:web:05a6265f23028e4f468b78",
  measurementId: "G-Y10LF92J1X"
};

// Inicializa o Firebase[cite: 2, 5]
firebase.initializeApp(firebaseConfig);

// Inicializa o banco de dados Firestore[cite: 2, 5]
const db = firebase.firestore();

// Habilita a persistência de dados offline no navegador
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência offline falhou: Múltiplas abas abertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('O navegador atual não suporta persistência offline.');
    }
  });
