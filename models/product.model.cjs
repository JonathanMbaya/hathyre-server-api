const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    promo: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      required: true,
    },

    image2: {
      type: String,
      required: true,
    },

    likes: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      enum: ["Savon", "Accessoires", "Beurres et huiles"],
      required: true,
    },

    ingredients: {
      type: String,
      required: true,
    },

    conseils: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);