const mongoose = require('mongoose');
const crypto = require('crypto');

const clientSchema = new mongoose.Schema(
  {
    civilite: {
      type: String,
      enum: ['Madame', 'Monsieur', 'Non défini'],
      default: 'Non défini',
      index: true
    },

    nom: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    prenom: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    clientEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    clientPassword: {
      type: String,
      required: true,
      select: false // 🔥 important sécurité
    },

    birthday: {
      type: Date
    },

    address: {
      type: String,
      trim: true
    },

    mobile: {
      type: String,
      trim: true
    },

    token: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(5).toString('hex')
    },

    emailVerificationToken: {
      type: String,
      default: null,
      index: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    purchases: {
      type: [String],
      default: []
    },

    favoris: {
      type: [String],
      default: []
    },

    montantDepense: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Index composés utiles
clientSchema.index({ clientEmail: 1 });
clientSchema.index({ nom: 1, prenom: 1 });

module.exports = mongoose.model('Client', clientSchema);