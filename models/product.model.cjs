const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    promo: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // URL de l'image téléchargée
      required: true,
    },
    likes: {
      type: [String],
    },
    category: {
      type: String,
      enum: ['savon', 'accessoire', 'Beurres et Huiles'],
      default: 'En cours de préparation',
      index: true, // Ajout d'un index pour optimiser les requêtes sur ce champ
  },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
