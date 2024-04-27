const mongoose = require('mongoose');
const crypto = require('crypto');
// const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
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
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(5).toString('hex') // Générer un token aléatoire avec 10 caractères
    }
},
{
    timestamps: true,
});

// Avant de sauvegarder l'utilisateur, cryptez son mot de passe
// userSchema.pre('save', async function (next) {
//     const user = this;
//     if (!user.isModified('password')) return next();

//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hash = await bcrypt.hash(user.password, salt);
//         user.password = hash;
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

const User = mongoose.model('User', userSchema);

module.exports = User;
