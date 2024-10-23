const Order = require("../models/orders.model.cjs");
const sgMail = require('@sendgrid/mail');
const stripe = require('stripe')('pk_live_51PFebILEHh2o4MgiphBqg0EArDxRfgbaPJeV5cGbohjQpMJlVd6Cufm2gQZwGwJZ99jRTNFTZw8XU3EDFprY2Vzj00ruJ2DMtL');
const paypal = require('@paypal/checkout-server-sdk');

let environment = new paypal.core.SandboxEnvironment('YOUR_PAYPAL_CLIENT_ID', 'YOUR_PAYPAL_CLIENT_SECRET'); // Remplacez par vos identifiants
let client = new paypal.core.PayPalHttpClient(environment);


// Configurez l'API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Assurez-vous que votre clé API est stockée dans une variable d'environnement

// Fonction pour envoyer l'e-mail de remboursement
const sendRefundEmail = async (userEmail, refundId) => {
    const msg = {
        to: userEmail, // destinataire
        from: 'jonathanmbaya13@gmail.com', // expéditeur (doit être une adresse vérifiée dans SendGrid)
        subject: `Remboursement - HATHYRE COSMETICS - [${refundId}]`,
        text: `Votre remboursement a été traité avec succès.`, // contenu de l'e-mail
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f6f3; padding: 20px; border-radius: 5px; max-width: 600px; margin: auto;">
            <h1 style="color: #5b3a29;">Remboursement Traitée</h1>
            <p style="color: #4e3c31; font-size: 16px;">Nous vous informons que votre remboursement a été traité avec succès.</p>
            <p style="color: #4e3c31; font-size: 16px;">
                <strong>ID du remboursement :</strong> <span style="color: #5b3a29;">${refundId}</span>
            </p>
            <div style="margin-top: 30px; padding: 10px; background-color: #5b3a29; color: #ffffff; border-radius: 5px;">
                <p style="margin: 0;">Merci d'avoir choisi HATHYRE COSMETICS !</p>
            </div>
        </div>
    `, 
    };

    try {
        await sgMail.send(msg);
        console.log('E-mail de remboursement envoyé à', userEmail);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
};


// Méthode pour créer une commande PayPal
module.exports.createPaypalOrder = async (req, res) => {
    const { articles } = req.body;

    try {
        const montantTotal = articles.reduce((acc, article) => acc + article.price * article.quantity, 0);

        // Créer la commande PayPal
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: montantTotal.toFixed(2),
                },
            }],
        });

        const order = await client.execute(request);

        res.status(201).json({ orderId: order.result.id });
    } catch (error) {
        console.error('Erreur lors de la création de la commande PayPal :', error);
        res.status(500).json({ message: "Une erreur s'est produite lors de la création de la commande PayPal." });
    }
};

// Méthode pour capturer une commande PayPal
module.exports.capturePaypalOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const capture = await client.execute(request);

        // Vous pouvez traiter le montant ici
        res.status(200).json(capture.result);
    } catch (error) {
        console.error('Erreur lors de la capture de la commande PayPal :', error);
        res.status(500).json({ message: "Une erreur s'est produite lors de la capture de la commande PayPal." });
    }
};

// Route pour créer une commande et effectuer le paiement
module.exports.createOrder = async (req, res) => {
    const { nom, prenom, email, address, city, postalCode, country, mobile, articles, status, deliver, paymentMethod } = req.body;

    try {
        // Calculer le montant total à partir des articles
        const montantTotal = articles.reduce((acc, article) => acc + article.price * article.quantity, 0);

        // Création de l'intention de paiement et confirmation immédiate
        const paymentIntent = await stripe.paymentIntents.create({
            amount: montantTotal * 100, // Montant total en centimes
            currency: 'eur',
            payment_method: paymentMethod, // ID de la méthode de paiement
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
            // Créer une nouvelle commande dans la base de données
            const newOrder = new Order({
                nom,
                prenom,
                email,
                address,
                city, 
                postalCode, 
                country,
                mobile,
                articles,
                montantTotal,
                date: new Date(),
                status,
                deliver,
                paymentIntentId: paymentIntent.id, // Stocker l'ID du PaymentIntent
                paymentMethod: paymentMethod // Stocker le type de méthode de paiement
            });

            await newOrder.save(); // Enregistrer la commande dans la base de données

            return res.status(201).json({
                message: "Paiement réussi",
                success: true,
                order: newOrder,
                amount_received: paymentIntent.amount_received / 100 // Montant reçu en euros
            });
        }

        // Si le paiement est en attente d'une confirmation supplémentaire
        return res.status(400).json({
            message: "Le paiement n'a pas été traité avec succès ou est en attente d'une opération supplémentaire",
            success: false,
            status: paymentIntent.status,
        });

    } catch (error) {
        console.error('Erreur lors de la création de la commande :', error);
        res.status(500).json({ message: "Une erreur s'est produite lors de la création de la commande.", error: error.message });
    }
};




module.exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }
        res.status(200).json({ message: "Commande supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports.getOneOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status, orderNumber, deliver, comments } = req.body; // Récupération du statut, numéro de suivi et transporteur
  
    try {
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }
  
      // Mise à jour du statut, numéro de suivi et transporteur
      order.status = status;
      if (orderNumber) order.orderNumber = orderNumber; // Ajoute le numéro de suivi
      if (deliver) order.deliver = deliver;       
      if (comments) order.comments = comments;       // Ajoute le transporteur
  
      await order.save(); // Sauvegarde la commande mise à jour
  
      res.status(200).json(order); // Retourne la commande mise à jour
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};


module.exports.filterOrdersByStatus = async (req, res) => {
    const { status } = req.query; // Récupère le statut de la requête

    if (!status) {
        return res.status(400).json({ message: "Le statut est requis pour filtrer les commandes." });
    }

    try {
        // Filtrer les commandes par statut
        const orders = await Order.find({ status });

        if (orders.length === 0) {
            return res.status(404).json({ message: "Aucune commande trouvée pour ce statut." });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports.refunds = async (req, res) => {

    const { paymentIntentId, amount, orderId, userEmail } = req.body;

    try {
        // Récupérer la charge associée au Payment Intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const chargeId = paymentIntent.latest_charge;

        if (!chargeId) {
            return res.status(400).json({ error: 'Aucune charge trouvée pour ce paiement.' });
        }

        // Vérifier que le montant du remboursement n'excède pas le montant payé
        if (amount > paymentIntent.amount_received / 100) {
            return res.status(400).json({ error: 'Le montant du remboursement dépasse le montant du paiement initial.' });
        }

        // Créer le remboursement
        const refund = await stripe.refunds.create({
            charge: chargeId,
            amount: amount * 100, // Montant en centimes
        });

        // Mettre à jour la commande dans la base de données
        await Order.findByIdAndUpdate(orderId, { status: 'Remboursé' });

        // Envoi d'un email de confirmation au client
        await sendRefundEmail(userEmail, refund.id); // Assurez-vous que cette fonction est définie ou importée

        // Réponse en cas de succès
        return res.status(200).json({ success: true, refund });
    } catch (error) {
        console.error('Erreur lors du traitement du remboursement:', error);
        return res.status(500).json({ error: error.message || 'Erreur lors du traitement du remboursement.' });
    }
}

module.exports.cancelledPay = async (req, res) => {
    const orderId = req.params.id;  // Récupérer l'ID de la commande depuis les paramètres de la requête

    try {
        // Récupérer la commande pour obtenir l'ID du PaymentIntent
        const order = await Order.findById(orderId);

        if (!order || !order.id_stripe) {
            return res.status(404).json({ error: "Commande ou PaymentIntent introuvable." });
        }

        // Annuler le PaymentIntent
        const canceledIntent = await stripe.paymentIntents.cancel(order.id_stripe);

        return res.status(200).json({ success: true, canceledIntent });
    } catch (error) {
        console.error('Erreur lors de l\'annulation du paiement :', error);
        return res.status(500).json({ error: error.message || 'Erreur lors de l\'annulation du paiement.' });
    }
};
