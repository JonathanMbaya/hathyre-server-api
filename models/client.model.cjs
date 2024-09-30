const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const clientSchema = new mongoose.Schema({
    sexe: {
        type: String,
        enum: ['Madame', 'Monsieur', 'Non défini'], 
    },
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    clientEmail: {
        type: String,
        required: true,
        unique: true,
    },
    clientPassword: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date,
    },
    address: {
        type: String,
    },
    mobile: {
        type: String,
    },
    token: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(5).toString('hex')
    },
    favoris: {
        type: [String],  // Tableau des IDs des produits favoris par exemple
    },
    montantDepense: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
