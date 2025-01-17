// app.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import config from "./public/config.js";

// Inicializar Firebase
const firebaseApp = initializeApp(config.firebase);
const db = getFirestore(firebaseApp);

// Inicializar Stripe
const stripe = Stripe(config.stripe.publicKey);

let currentStep = 1;
const totalSteps = 5;

// Elementos DOM
const form = document.getElementById("registrationForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.querySelector(".close");

// Event Listeners
document.getElementById("conceptoPago").addEventListener("change", updateMonto);
closeModal.addEventListener("click", () => (modal.style.display = "none"));

// Funciones de navegación
window.prevStep = function () {
  if (currentStep > 1) {
    document.getElementById(`step${currentStep}`).classList.add("hidden");
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.remove("hidden");
    updateButtons();
    updateProgress();
  }
};

window.nextStep = function () {
  if (validateCurrentStep()) {
    if (currentStep < totalSteps) {
      document.getElementById(`step${currentStep}`).classList.add("hidden");
      currentStep++;
      document.getElementById(`step${currentStep}`).classList.remove("hidden");
      updateButtons();
      updateProgress();
    } else if (currentStep === totalSteps) {
      processPago();
    }
  }
};

function updateButtons() {
  prevBtn.style.display = currentStep === 1 ? "none" : "block";
  nextBtn.textContent =
    currentStep === totalSteps ? "Proceder al Pago" : "Siguiente";
}

function updateProgress() {
  document.querySelectorAll(".step").forEach((step, index) => {
    if (index + 1 < currentStep) {
      step.classList.add("completed");
    } else if (index + 1 === currentStep) {
      step.classList.add("active");
    } else {
      step.classList.remove("active", "completed");
    }
  });
}
