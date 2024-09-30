const Product = require("../models/product.model.cjs");
// const multer = require('multer');
// const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig.cjs'); // Importer la configuration Cloudinary

// Configuration de Multer avec Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Le nom du dossier où stocker les images dans Cloudinary
    allowed_formats: ['jpg', 'png', 'webp'], // Formats d'images autorisés
  },
});

const upload = multer({ storage: storage });




module.exports.getProducts = async (req, res) => {
  try {
    // Récupérer tous les produits de la base de données
    const products = await Product.find();

    // Répondre avec tous les produits récupérés
    res.status(200).json(products);
    
  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({ message: "Une erreur est survenue lors de la récupération des produits." });
  }
};



module.exports.getProductsFilters = async (req, res) => {
  try {
    // Récupérer les paramètres de requête pour les filtres
    const sortByName = req.params.sortByName;
    const sortByPrice = req.params.sortByPrice;

    let products;

    // Récupérer tous les produits
    products = Product.find();

    // Si le tri par nom est spécifié, l'appliquer
    if (sortByName === 'asc') {
      products.sort({ name: 1 }); // Tri par ordre croissant de nom
    } else if (sortByName === 'desc') {
      products.sort({ name: -1 }); // Tri par ordre décroissant de nom
    }

    // Si le tri par prix est spécifié, l'appliquer
    if (sortByPrice === 'asc') {
      products.sort({ price: 1 }); // Tri par ordre croissant de prix
    } else if (sortByPrice === 'desc') {
      products.sort({ price: -1 }); // Tri par ordre décroissant de prix
    }

    // Récupérer les produits après le tri
    products = await products.exec();

    // Répondre avec les produits filtrés ou tous les produits si aucun filtre n'est spécifié
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports.getOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Ce produit n'existe pas" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports.setProduct = async (req, res) => {
  try {
    // Utilisation du middleware multer pour uploader l'image avant de traiter le reste
    upload.single('image')(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Vérification que le fichier a bien été uploadé
      if (!req.file) {
        return res.status(400).json({ error: 'Aucune image uploadée.' });
      }

      // L'image a été uploadée sur Cloudinary via multer
      const imageUrl = req.file.path;

      // Création d'une nouvelle instance de produit
      const product = new Product({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        description: req.body.description,
        ingredients: req.body.ingredients,
        conseils: req.body.conseils,
        promo: req.body.promo,
        stock: req.body.stock,
        image: imageUrl // Stocker l'URL de l'image Cloudinary dans la base de données
      });

      const result = await product.save();
      res.status(200).json(result);
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Une erreur s'est produite lors de l'enregistrement du produit.");
  }
};


module.exports.editProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: "Ce produit n'existe pas" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Ce produit n'existe pas" });
    }
    res.status(200).json({ message: "Produit supprimé ref:" + req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assurez-vous d'importer le modèle Product si nécessaire

module.exports.searchProducts = async (req, res) => {
  try {
    const searchTerm = req.params.q;
    const regex = new RegExp(searchTerm, 'i'); // Expression régulière pour rechercher les noms commençant par le terme de recherche, 'i' pour insensible à la casse
    const products = await Product.find({ name: { $regex: regex } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports.likeProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likes: req.body.userId } },
      { new: true }
    );

    const likeCount = product.likes.length; // Obtenir le nombre de likes

    res.status(200).json({ product, likeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports.dislikeProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $pull: { likes: req.body.userId } },
      { new: true }
    );

    const dislikeCount = product.likes.length; // Obtenir le nombre total de dislikes après le retrait

    res.status(200).json({ product, dislikeCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour récupérer les 4 derniers produits ou tous les produits selon le paramètre latest
module.exports.getLatestProducts = async (req, res) => {
  try {
    const { latest } = req.params;

    // Si le paramètre "latest" est présent, récupérer uniquement les 4 derniers produits
    let products;
    if (latest) {
      products = await Product.find({})
        .sort({ createdAt: -1 }) // Tri par ordre décroissant de createdAt
        .limit(4); // Limiter les résultats à 4
    } else {
      // Sinon, renvoyer tous les produits
      products = await Product.find({});
    }

    res.status(200).json(products); // Répondre avec les produits sous forme de JSON
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};



module.exports.getCatProducts = async (category) => {
  try {
    const catProducts = await Product.find({ category })
    res.status(200).json(catProducts);
    return catProducts;

  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    throw error;
  }
};


