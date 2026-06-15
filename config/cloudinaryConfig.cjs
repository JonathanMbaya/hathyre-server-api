const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuration de Cloudinary avec vos informations d'API
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // Nom de votre Cloudinary
  api_key: process.env.CLOUDINARY_API_KEY,         // Votre API Key Cloudinary
  api_secret: process.env.CLOUDINARY_API_SECRET    // Votre API Secret Cloudinary
});

module.exports = cloudinary;