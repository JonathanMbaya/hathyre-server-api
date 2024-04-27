const Product = require("../models/product.model.cjs");
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Répertoire de destination des images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom de fichier unique avec l'extension d'origine
  }
});

// Filtrer les fichiers acceptés
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true); // Accepter le fichier
  } else {
    cb(new Error('Seuls les fichiers JPEG et PNG sont acceptés.'), false); // Rejeter le fichier
  }
};

// Initialisation de Multer
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter 
}).single('image');



module.exports.getProducts = async (req, res) => {
  try {
    
    // Récupérer tous les produits
    let products;
    // Récupération du paramètre de l'URL
    const latest = req.params.latest;
    if (latest) {
      // Si le paramètre "latest" est présent dans la requête, récupérer les 4 derniers produits
      products = await Product.find({})
        .sort({ createdAt: -1 }) // Tri par ordre décroissant de createdAt
        .limit(4); // Limiter les résultats à 4
    } else {
      // Sinon, récupérer tous les produits
      products = await Product.find();
    }

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
    // Appeler la fonction d'upload de Multer
    upload(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Créer une nouvelle instance de produit avec les détails envoyés dans le corps de la requête
      const product = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        promo: req.body.promo,
        stock: req.body.stock,
        image: '/images/' + req.file.filename // Chemin de l'image téléchargée dans le répertoire public
      });

      // Enregistrer le produit dans la base de données
      const result = await product.save();
      
      // Envoyer la réponse avec le résultat
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

// Fonction pour récupérer les 4 derniers produits
module.exports.getLatestProducts = async () => {
  try {
    // Récupérer les produits triés par ordre décroissant de leur date de création
    const latestProducts = await Product.find({})
      .sort({ createdAt: -1 }) // Tri par ordre décroissant de createdAt
      .limit(4); // Limiter les résultats à 4

    return latestProducts;
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    throw error; // Propage l'erreur vers l'appelant
  }
};


