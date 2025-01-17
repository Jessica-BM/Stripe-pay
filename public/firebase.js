// Importar Firebase desde el paquete de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configuración desde el archivo .env cargada desde el servidor
const firebaseConfig = {
  apiKey: "AIzaSyBo-e2fal1DPD6zwEx_yRsg7rVj6UIZ7AI",
  authDomain: "escuelas-235df.firebaseapp.com",
  projectId: "escuelas-235df",
  storageBucket: "escuelas-235df.appspot.com",
  messagingSenderId: "559386225352",
  appId: "1:559386225352:web:106c95bc92748f80a313fd",
  measurementId: "G-T010J2CDKV",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, Timestamp };
