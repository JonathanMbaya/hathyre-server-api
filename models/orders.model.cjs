const mongoose = require('mongoose');

// Fonction de validation pour l'email
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// Schéma de l'article
const articleSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
});

// Schéma de la commande
const orderSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: [validateEmail, 'Veuillez entrer une adresse email valide.'],
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    postalCode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /\d{10,}/.test(v); // Valide que le numéro contient au moins 10 chiffres
            },
            message: props => `${props.value} n'est pas un numéro de téléphone valide!`
        }
    },
    articles: [articleSchema], // Utilise le schéma défini pour les articles
    montantTotal: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['En cours de préparation', 'Expédié', 'Livré', 'Annulé'],
        default: 'En cours de préparation',
        index: true, // Index pour optimiser les requêtes sur ce champ
    },
}, {
    timestamps: true, // Ajoute createdAt et updatedAt
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
