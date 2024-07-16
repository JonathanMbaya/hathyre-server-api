const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const clientSchema = new mongoose.Schema({
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
        sparse: false,
    },
    clientPassword: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(5).toString('hex') // Générer un token aléatoire avec 10 caractères
    }
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
