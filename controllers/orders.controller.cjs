const Order = require("../models/orders.model.cjs");
const stripe = require('stripe')('sk_test_51PFebILEHh2o4Mgieyrcbf461euTJRaK3DdRFzLWfQ88rnCpRaJmYx3MUOhhNQAoXLBesgL5uQGqnys9FJsYbTVP00W4HbXqym');

module.exports.createOrder = async (req, res) => {
    const { nom, prenom, email, address, mobile, articles, status } = req.body;

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
            mobile,
            articles,
            montantTotal,
            date: new Date(),
            status,
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

module.exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['En cours de préparation', 'Expédié', 'En cours de livraison', 'Livré', 'Annulé'];

    try {
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Statut de commande invalide" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        res.status(200).json(updatedOrder);
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
