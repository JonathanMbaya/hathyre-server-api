const cloudinary = require('cloudinary').v2;

// Configuration de Cloudinary avec vos informations d'API
cloudinary.config({
  cloud_name: 'dlwjhsc21',   // Nom de votre Cloudinary
  api_key: '238366741159928',         // Votre API Key Cloudinary
  api_secret: '-ehogjHH6LfN79U9_b5k908tY9Q'    // Votre API Secret Cloudinary
});

module.exports = cloudinary;
