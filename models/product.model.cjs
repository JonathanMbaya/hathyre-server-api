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
    },
    stock: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // URL de l'image téléchargée
      required: true,
    },
    image2: {
      type: String, // URL de l'image téléchargée
      required: true,
    },
    likes: {
      type: [String],
    },
    category: {
      type: String,
      enum: ['Savon', 'Accessoires', 'Beurres et huiles'],
    },

    ingredients: {
      type: String,
      required: true,
    },

    conseils: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
