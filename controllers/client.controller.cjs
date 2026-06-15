require('dotenv').config(); // Pour utiliser les variables d'environnement
const Client = require("../models/client.model.cjs");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');



module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await Client.findOne({ clientEmail: email })
      .select("+clientPassword");

    if (!client) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      client.clientPassword
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    if (!client.isEmailVerified) {
      return res.status(403).json({
        message: "Email non vérifié"
      });
    }

    const token = jwt.sign(
      { clientId: client._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      token,
      client: {
        _id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        clientEmail: client.clientEmail
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.logout = async (req, res) => {
  res.clearCookie('token').send('Déconnexion réussie');
};

module.exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find()
      .select("nom prenom clientEmail isEmailVerified createdAt")
      .lean();

    return res.status(200).json(clients);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getOneClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .select("-clientPassword")
      .lean();

    if (!client) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.status(200).json(client);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Fonction pour générer un token unique
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports.createClient = async (req, res) => {
  const { nom, prenom, clientEmail, clientPassword, civilite } = req.body;

  try {
    const existingClient = await Client.findOne({ clientEmail });

    if (existingClient) {
      return res.status(400).json({ message: "Utilisateur existe déjà" });
    }

    const hashedPassword = await bcrypt.hash(clientPassword, 10);

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    const newClient = new Client({
      civilite,
      nom,
      prenom,
      clientEmail,
      clientPassword: hashedPassword,
      emailVerificationToken,
      isEmailVerified: false
    });

    await newClient.save();

    // ❌ ne jamais renvoyer le token
    return res.status(201).json({
      message: "Compte créé. Vérifiez votre email."
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Contrôleur pour vérifier l'email via le token
module.exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const client = await Client.findOne({ emailVerificationToken: token });

    if (!client) {
      return res.status(400).json({ message: "Token invalide" });
    }

    client.isEmailVerified = true;
    client.emailVerificationToken = null;

    await client.save();

    return res.redirect("https://www.hathyre.com/confirm-account");

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.editClient = async (req, res) => {
  try {
    // Rechercher l'utilisateur par son ID
    const userId = req.params.id;

    // Mettez à jour seulement les champs existants dans la requête
    const updatedClient = await Client.findByIdAndUpdate(
      userId,
      { $set: req.body }, // Seulement les champs envoyés dans le body seront mis à jour
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Cet utilisateur n'existe pas" });
    }

    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ message: "Cet utilisateur n'existe pas" });
    }
    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Récupérer les favoris du client
exports.getFavorites = async (req, res) => {
  try {
    const clientId = req.params.userId;

    // Trouver le client et récupérer les favoris
    const client = await Client.findById(clientId)
    .select("favoris")
    .lean();

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    res.json({ favorites: client.favoris });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des favoris.' });
  }
};

// Ajouter un produit aux favoris
exports.addFavorite = async (req, res) => {
  try {
    const clientId = req.params.userId;
    const { productId } = req.body;

    // Trouver le client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    // Ajouter le produit aux favoris s'il n'est pas déjà présent
    if (!client.favoris.includes(productId)) {
      client.favoris.addToSet(productId);
      await client.save();
    }

    res.status(200).json({ message: 'Produit ajouté aux favoris.', favorites: client.favoris });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du produit aux favoris.' });
  }
};

// Supprimer un produit des favoris
exports.removeFavorite = async (req, res) => {
  try {
    const clientId = req.params.userId;
    const productId = req.params.productId;

    // Trouver le client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé.' });
    }

    // Supprimer le produit des favoris
    client.favoris.pull(productId);
    await client.save();

    res.status(200).json({ message: 'Produit retiré des favoris.', favorites: client.favoris });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du produit des favoris.' });
  }
};