/* ==========================================================================
   1. CONFIGURAÇÃO DO FIREBASE E FIRESTORE
   ========================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyByab3GgZB-9uNjQrguggSYqR7Bxv5pIXE",
  authDomain: "paif-d2ab8.firebaseapp.com",
  projectId: "paif-d2ab8",
  storageBucket: "paif-d2ab8.firebasestorage.app",
  messagingSenderId: "477546152425",
  appId: "1:477546152425:web:05a6265f23028e4f468b78"
};

// Coleção no Firestore e chave do localStorage
const FIRESTORE_COLLECTION = "planos_acompanhamento_familiar";
const LOCAL_STORAGE_KEY = "paf_dados_locais";

let db = null;
let firebaseAtivo = false;

// Inicializa o Firebase se a apiKey for válida
if (typeof firebase !== "undefined" && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "COLE_AQUI") {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    firebaseAtivo = true;
    console.log("Firebase inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
  }
} else {
  console.warn("Firebase não inicializado. O aplicativo usará o armazenamento local (localStorage).");
}


/* ==========================================================================
   2. FUNÇÕES DE MANIPULAÇÃO DOS DADOS (FIRESTORE + LOCALSTORAGE)
   ========================================================================== */

/**
 * Salva ou atualiza um Plano de Acompanhamento Familiar (PAF).
 * @param {Object} pafData - Objeto contendo os dados do PAF (deve conter um id único).
 */
async function salvarPAF(pafData) {
  if (!pafData.id) {
    pafData.id = "paf_" + Date.now();
  }

  pafData.atualizadoEm = new Date().toISOString();

  if (firebaseAtivo && db) {
    try {
      await db.collection(FIRESTORE_COLLECTION).doc(pafData.id).set(pafData, { merge: true });
      console.log("PAF salvo no Firestore com sucesso:", pafData.id);
      return pafData;
    } catch (error) {
      console.error("Erro ao salvar no Firestore. Salvando localmente...", error);
    }
  }

  // Fallback: Armazenamento local no localStorage
  const listaLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  const index = listaLocal.findIndex(item => item.id === pafData.id);

  if (index >= 0) {
    listaLocal[index] = pafData;
  } else {
    listaLocal.push(pafData);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listaLocal));
  console.log("PAF salvo no localStorage localmente:", pafData.id);
  return pafData;
}

/**
 * Busca todos os PAFs cadastrados.
 * @returns {Promise<Array>} Lista com todos os PAFs.
 */
async function carregarPAFs() {
  if (firebaseAtivo && db) {
    try {
      const snapshot = await db.collection(FIRESTORE_COLLECTION).get();
      const pafs = [];
      snapshot.forEach(doc => {
        pafs.push({ id: doc.id, ...doc.data() });
      });
      return pafs;
    } catch (error) {
      console.error("Erro ao carregar do Firestore. Buscando no localStorage...", error);
    }
  }

  // Fallback: Busca do localStorage
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
}

/**
 * Escuta alterações em tempo real no Firestore (sincronização automática em todos os dispositivos).
 * @param {Function} callback - Função que recebe a lista atualizada de PAFs.
 */
function escutarPAFs(callback) {
  if (firebaseAtivo && db) {
    return db.collection(FIRESTORE_COLLECTION).onSnapshot(snapshot => {
      const pafs = [];
      snapshot.forEach(doc => {
        pafs.push({ id: doc.id, ...doc.data() });
      });
      callback(pafs);
    }, error => {
      console.error("Erro na escuta do Firestore:", error);
      callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"));
    });
  } else {
    // Retorna os dados locais se o Firebase não estiver ativo
    callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"));
    return () => {}; // Função vazia para unsubscribe
  }
}
