const mongoose = require('mongoose');

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
    },
    address: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    articles: [
        {
            productId: { type: String , required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    montantTotal: {
        type: Number,
        required: true,
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
        index: true, // Ajout d'un index pour optimiser les requêtes sur ce champ
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
