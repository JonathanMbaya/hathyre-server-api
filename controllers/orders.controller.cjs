const Order = require("../models/orders.model.cjs");
const stripe = require('stripe')('sk_test_51PFebILEHh2o4Mgieyrcbf461euTJRaK3DdRFzLWfQ88rnCpRaJmYx3MUOhhNQAoXLBesgL5uQGqnys9FJsYbTVP00W4HbXqym');
const paypal = require('@paypal/checkout-server-sdk');

let environment = new paypal.core.SandboxEnvironment('YOUR_PAYPAL_CLIENT_ID', 'YOUR_PAYPAL_CLIENT_SECRET'); // Remplacez par vos identifiants
let client = new paypal.core.PayPalHttpClient(environment);

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

module.exports.createOrder = async (req, res) => {
    const { nom, prenom, email, address, city, postalCode, country, mobile, articles, status, deliver } = req.body;

    try {
        // Calculer le montant total à partir des articles
        const montantTotal = articles.reduce((acc, article) => acc + article.price * article.quantity, 0);

        // Créer une intention de paiement Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: montantTotal * 100, // Stripe utilise les centimes
            currency: 'eur',
            payment_method_types: ['card'],
        });

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
            deliver
        });

        await newOrder.save();

        res.status(201).json({ order: newOrder, clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Erreur lors de la création de la commande :', error);
        res.status(500).json({ message: "Une erreur s'est produite lors de la création de la commande." });
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
    const { id } = req.params;
    const { status, deliver } = req.body;

    const validStatuses = ['En cours de préparation', 'Expédié', 'En cours de livraison', 'Livré', 'Annulé', 'Remboursé'];

    try {
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Statut de commande invalide" });
        }

        // Récupérer la commande pour vérifier son statut actuel
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        // Règles métier pour le changement de statut
        if (order.status === 'Expédié' && status === 'En cours de préparation') {
            return res.status(400).json({ message: "Impossible de revenir à 'En cours de préparation' après expédition" });
        }

        if (order.status === 'Livré' && status === 'Expédié') {
            return res.status(400).json({ message: "Impossible de revenir à 'Expédié' après la livraison" });
        }

        if (order.status === 'Livré' && status === 'Annulé') {
            return res.status(400).json({ message: "Impossible d'annuler une commande déjà livrée" });
        }

        // Mettre à jour le statut de la commande
        order.status = status;
        if (deliver) {
            order.deliver = deliver; // Si un transporteur est passé dans la requête
        }

        await order.save();

        res.status(200).json(order);
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
