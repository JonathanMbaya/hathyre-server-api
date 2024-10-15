const express = require("express");
const compression = require('compression');
const cors = require('cors');
const connectDB = require("./config/db.cjs");
const stripe = require("stripe")('sk_test_51PFebILEHh2o4Mgieyrcbf461euTJRaK3DdRFzLWfQ88rnCpRaJmYx3MUOhhNQAoXLBesgL5uQGqnys9FJsYbTVP00W4HbXqym');
const port = process.env.PORT || 8080;

// Connexion à la base de données
connectDB();

const app = express();

// Ajouter le middleware compression
app.use(compression());

// Utilisez le middleware cors globalement
app.use(cors());

// Middleware qui permet de traiter les données de la Request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", require("./routes/product.routes.cjs"));
app.use("/api", require("./routes/user.routes.cjs"));
app.use("/api", require("./routes/client.routes.cjs"));
app.use("/api", require("./routes/order.routes.cjs"));
app.post("/stripe/load", async (req, res) => {
    let { amount, id } = req.body;
    console.log("amount & id :", amount, id);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convertir le montant en centimes
            currency: "EUR",
            description: "HATHYRE COSMETICS",
            payment_method: id,
            confirm: true,
            return_url: "https://hathyre-web.onrender.com/", // URL de retour après le paiement
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            message: "Paiement réussi",
            success: true,
        });
    } catch (error) {
        console.error("Erreur lors de la création du paiement :", error);
        res.status(500).json({ error: "Erreur lors de la création du paiement" });
    }
});

  

// Lancer le serveur
app.listen(port, () => console.log("Le serveur a démarré au port " + port));
