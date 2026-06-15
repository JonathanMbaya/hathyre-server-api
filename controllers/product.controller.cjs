const Product = require("../models/product.model.cjs");
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
    // const products = await Product.find();
    
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const products = await Product.find()
      .select("name price image image2 promo stock category")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

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
    const product = await Product.findById(req.params.id).lean();
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
    // Utilisation du middleware multer pour uploader les deux images
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image2', maxCount: 1 }])(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Vérification que les deux fichiers ont bien été uploadés
      if (!req.files || !req.files.image || !req.files.image2) {
        return res.status(400).json({ error: 'Les deux images doivent être uploadées.' });
      }

      // Récupération des URLs des images uploadées sur Cloudinary
      const imageUrl1 = req.files.image[0].path;
      const imageUrl2 = req.files.image2[0].path;

      // Création d'une nouvelle instance de produit avec les deux images
      const product = new Product({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        description: req.body.description,
        ingredients: req.body.ingredients,
        conseils: req.body.conseils,
        promo: req.body.promo,
        stock: req.body.stock,
        image: imageUrl1, // URL de la première image Cloudinary
        image2: imageUrl2 // URL de la deuxième image Cloudinary
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
    const products = await Product.find({
      $text: {
        $search: req.params.q,
      },
    }).lean();

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

    const dislikeCount = product.likes.length;

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
      products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name price image image2 promo")
        .lean();
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

module.exports.getCatProducts = async (req, res) => {
  try {
    const { category } = req.params;

    const catProducts = await Product.find({ category })
      .select("name price image promo stock category")
      .lean();

    return res.status(200).json(catProducts);

  } catch (error) {

    console.error("Erreur lors de la récupération des produits :", error);

    return res.status(500).json({
      message: "Erreur serveur"
    });

  }
};