// server.js
require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middleware para parsear JSON - debe ir primero
app.use(express.json());

// Rutas de la API - deben ir antes de los archivos estáticos
app.get("/config", (req, res) => {
  res.json({
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    },
  });
});

// Ruta para crear la intención de pago
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, customerData } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Inscripción al Ciclo Escolar 2025 - 2026",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/success.html`,
      cancel_url: `${req.protocol}://${req.get("host")}/cancel.html`,
      metadata: {
        customerName: customerData.nombre,
        customerEmail: customerData.email,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook para manejar eventos de Stripe
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Error de webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Pago completado:", session);
        break;
      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Pago fallido:", failedPayment.id);
        break;
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Servir archivos estáticos - debe ir después de las rutas de la API
app.use(express.static("public"));

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(
    `Configuración cargada: Stripe PK disponible: ${!!process.env
      .STRIPE_PUBLIC_KEY}`
  );
  console.log(`Firebase config disponible: ${!!process.env.FIREBASE_API_KEY}`);
});
