// Cargar variables de entorno
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY;
const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializar Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// Inicializar Stripe
const stripe = Stripe(STRIPE_PUBLIC_KEY);

let currentSection = 1;
const totalSections = 5;

// Navegación entre secciones
function nextSection(currentSectionNumber) {
  if (validateSection(currentSectionNumber)) {
    document
      .getElementById(`section${currentSectionNumber}`)
      .classList.remove("active");
    document
      .getElementById(`section${currentSectionNumber + 1}`)
      .classList.add("active");
    updateProgressBar(currentSectionNumber + 1);
    currentSection = currentSectionNumber + 1;
  }
}

function previousSection(currentSectionNumber) {
  document
    .getElementById(`section${currentSectionNumber}`)
    .classList.remove("active");
  document
    .getElementById(`section${currentSectionNumber - 1}`)
    .classList.add("active");
  updateProgressBar(currentSectionNumber - 1);
  currentSection = currentSectionNumber - 1;
}

// Actualizar barra de progreso
function updateProgressBar(sectionNumber) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((step, index) => {
    if (index < sectionNumber) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });
}

// Validación de secciones
function validateSection(sectionNumber) {
  const section = document.getElementById(`section${sectionNumber}`);
  const inputs = section.querySelectorAll("input, select");
  let isValid = true;

  // Limpiar errores anteriores
  clearErrors(section);

  inputs.forEach((input) => {
    if (input.required && !input.value) {
      showError(input, "Este campo es requerido");
      isValid = false;
    }

    // Validaciones específicas
    switch (input.id) {
      case "curp":
        if (!validateCURP(input.value)) {
          showError(input, "CURP inválida");
          isValid = false;
        }
        break;
      case "telefonoTutor":
      case "telefonoEmergencia":
        if (!validatePhone(input.value)) {
          showError(input, "Teléfono inválido");
          isValid = false;
        }
        break;
    }
  });

  return isValid;
}

// Funciones de validación específicas
function validateCURP(curp) {
  const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/;
  return curpRegex.test(curp);
}

function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

// Mostrar y limpiar errores
function showError(input, message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.innerText = message;
  input.parentNode.appendChild(errorDiv);
}

function clearErrors(section) {
  const errors = section.querySelectorAll(".error");
  errors.forEach((error) => error.remove());
}

// Procesar pago con Stripe
async function processPayment() {
  if (!validateSection(5)) return;

  const formData = getFormData();

  try {
    // Crear sesión de pago en el servidor
    const response = await fetch("/api/create-payment-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conceptoPago: formData.conceptoPago,
        montoPago: formData.montoPago,
      }),
    });

    const session = await response.json();

    // Redirigir a Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    showMessage("Error al procesar el pago: " + error.message, false);
  }
}

// Guardar datos en Firebase
async function saveToFirebase(formData, paymentIntent) {
  try {
    const docRef = await db.collection("registros").add({
      ...formData,
      paymentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    throw new Error("Error al guardar los datos: " + error.message);
  }
}

// Obtener todos los datos del formulario
function getFormData() {
  const form = document.getElementById("registrationForm");
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

// Mostrar mensajes al usuario
function showMessage(message, isSuccess) {
  const container = document.getElementById("messageContainer");
  container.innerHTML = `
                <div class="${isSuccess ? "success" : "error"}">
                    ${message}
                </div>
            `;
}

// Manejar respuesta del pago
async function handlePaymentResponse(paymentIntent) {
  try {
    const formData = getFormData();

    if (paymentIntent.status === "succeeded") {
      // Guardar en Firebase
      await saveToFirebase(formData, paymentIntent);
      showMessage("¡Registro y pago completados con éxito!", true);

      // Opcional: redireccionar a página de confirmación
      setTimeout(() => {
        window.location.href = "/confirmacion.html";
      }, 3000);
    } else {
      throw new Error("El pago no se completó correctamente");
    }
  } catch (error) {
    showMessage(error.message, false);
  }
}

// Actualizar monto según concepto de pago
document
  .getElementById("conceptoPago")
  .addEventListener("change", function (e) {
    const montos = {
      inscripcion: 5000,
      mensualidad: 3000,
    };
    document.getElementById("montoPago").value = montos[e.target.value] || "";
  });
