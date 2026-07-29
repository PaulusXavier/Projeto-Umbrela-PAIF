/* ==========================================================================
   CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE — PAF/PAIF
   SEMADS / CRAS Cristiana Vicente Nunes — Boa Vista/RR
   ========================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyByab3GgZB-9uNjQrguggSYqR7Bxv5pIXE",
  authDomain: "paif-d2ab8.firebaseapp.com",
  projectId: "paif-d2ab8",
  storageBucket: "paif-d2ab8.firebasestorage.app",
  messagingSenderId: "477546152425",
  appId: "1:477546152425:web:05a6265f23028e4f468b78"
};

// Coleção principal no Firestore e chave de reserva no localStorage
const FIRESTORE_COLLECTION = "planos_acompanhamento_familiar";
const LOCAL_STORAGE_KEY = "paf_dados_locais";

let db = null;
let auth = null;
let firebaseAtivo = false;

// Inicialização segura do Firebase (Firestore + Authentication)
if (typeof firebase !== "undefined" && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "COLE_AQUI") {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    auth = firebase.auth();
    firebaseAtivo = true;
    console.log("[Firebase] Conexão inicializada com sucesso.");
  } catch (error) {
    console.error("[Firebase] Erro ao inicializar o Firebase:", error);
  }
} else {
  console.warn("[Firebase] Configuração pendente ou SDK não carregado. O sistema utilizará modo Offline (localStorage).");
}

/* ==========================================================================
   FUNÇÕES DE OPERAÇÃO DE DADOS (FIRESTORE + FALLBACK LOCALSTORAGE)
   ========================================================================== */

/**
 * Salva ou atualiza um documento PAF.
 * @param {Object} pafData - Dados do Plano de Acompanhamento Familiar.
 */
async function salvarPAF(pafData) {
  if (!pafData.id) {
    pafData.id = "paf_" + Date.now();
  }

  pafData.atualizadoEm = new Date().toISOString();

  if (firebaseAtivo && db) {
    try {
      await db.collection(FIRESTORE_COLLECTION).doc(pafData.id).set(pafData, { merge: true });
      return pafData;
    } catch (error) {
      console.error("[Firestore] Erro ao salvar online. Gravando localmente...", error);
    }
  }

  // Fallback offline (localStorage)
  const listaLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  const index = listaLocal.findIndex(item => item.id === pafData.id);

  if (index >= 0) {
    listaLocal[index] = pafData;
  } else {
    listaLocal.push(pafData);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listaLocal));
  return pafData;
}

/**
 * Carrega todos os registros de PAFs.
 * @returns {Promise<Array>} Lista de planos.
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
      console.error("[Firestore] Erro ao carregar online. Lendo localmente...", error);
    }
  }

  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
}

/**
 * Sincronização em tempo real para múltiplos dispositivos.
 * @param {Function} callback - Função para atualizar a interface ao receber dados novos.
 */
function escutarPAFs(callback) {
  if (firebaseAtivo && db) {
    return db.collection(FIRESTORE_COLLECTION).onSnapshot(
      snapshot => {
        const pafs = [];
        snapshot.forEach(doc => {
          pafs.push({ id: doc.id, ...doc.data() });
        });
        callback(pafs);
      },
      error => {
        console.error("[Firestore] Erro no escutador em tempo real:", error);
        callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"));
      }
    );
  } else {
    callback(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"));
    return () => {};
  }
}
