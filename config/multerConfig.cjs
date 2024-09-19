const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig.cjs'); // Importer la configuration Cloudinary

// Configuration de Multer avec Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Le nom du dossier où stocker les images dans Cloudinary
    allowed_formats: ['jpg', 'png'], // Formats d'images autorisés
  },
});

const upload = multer({ storage: storage });
