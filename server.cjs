const express = require("express");
const compression = require('compression');
const cors = require('cors');
const connectDB = require("./config/db.cjs");
const stripe = require("stripe")('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');
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

// Route pour créer et confirmer un PaymentIntent
app.post("/stripe/load", async (req, res) => {
    let { amount, id } = req.body;
    console.log("Montant & ID de paiement :", amount, id);

    try {
        // Création du PaymentIntent avec confirmation automatique
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Montant en centimes
            currency: "EUR",
            description: "HATHYRE COSMETICS",
            payment_method: id, // ID de la méthode de paiement (token Stripe)
            confirm: true, // Confirmation immédiate
            return_url: "https://hathyre.com/", // URL de retour après le paiement
            automatic_payment_methods: {
                enabled: true, // Méthodes de paiement automatiques
            },
        });

        // Vérifier si le paiement nécessite une action supplémentaire (3D Secure)
        if (paymentIntent.status === "requires_action" && paymentIntent.next_action) {
            // Si une action supplémentaire est nécessaire (par exemple, 3D Secure)
            return res.status(200).json({
                success: false,
                requires_action: true,
                next_action: paymentIntent.next_action, // Retourner l'action à effectuer (3D Secure)
            });
        }

        // Si le paiement est confirmé et capturé avec succès
        if (paymentIntent.status === 'succeeded') {
            return res.status(200).json({
                message: "Paiement réussi",
                success: true,
                amount_received: paymentIntent.amount_received / 100, // Montant reçu en euros
            });
        }

        // Si le paiement est en attente de confirmation supplémentaire
        return res.status(200).json({
            message: "Le paiement est en attente d'une action",
            success: false,
        });

    } catch (error) {
        console.error("Erreur lors de la création du paiement :", error);

        // Gestion des erreurs
        return res.status(500).json({
            error: "Erreur lors de la création du paiement",
            details: error.message,
        });
    }
});



  

// Lancer le serveur
app.listen(port, () => console.log("Le serveur a démarré au port " + port));
