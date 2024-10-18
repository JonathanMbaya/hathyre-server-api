const Client = require("../models/client.model.cjs");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // Pour utiliser les variables d'environnement
const emailjs = require('emailjs-com')


module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Recherche de l'utilisateur dans la base de données par son email
    const client = await Client.findOne({ clientEmail: email});

    // Vérification de l'existence de l'utilisateur
    if (!client) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    // Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, client.clientPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Vérification de la confirmation de l'email
    if (!client.isEmailVerified && client.isEmailVerified == false) {
      return res.status(403).json({ message: "Veuillez confirmer votre adresse email avant de vous connecter." });
    }

    // Création d'un token JWT
    const token = jwt.sign({ clientId: client._id }, 'your_secret_token_key', { expiresIn: '1h' });

    // Envoi de la réponse avec le token et les informations de l'utilisateur
    res.status(200).json({ client: { _id: client._id, clientEmail: client.clientEmail, nom: client.nom, prenom: client.prenom, token: client.token }, token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.logout = async (req, res) => {
  res.clearCookie('token').send('Déconnexion réussie');
};

module.exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getOneClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cet utilisateur n'existe pas" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fonction pour générer un token unique
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports.createClient = async (req, res) => {
  const { nom, prenom, clientEmail, clientPassword, civilite } = req.body;

  // Validation des champs requis
  if (!nom || !prenom || !clientEmail || !clientPassword) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
      // Vérifier si le client existe déjà
      const existingClient = await Client.findOne({ clientEmail });
      if (existingClient) {
          return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }

      // Crypter le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(clientPassword, salt);

      // Générer un token de vérification
      const emailVerificationToken = generateToken();

      // Créer un nouvel utilisateur
      const newClient = new Client({
          civilite,
          nom,
          prenom,
          clientEmail,
          clientPassword: hashedPassword, // Stocker le mot de passe crypté
          emailVerificationToken, // Stocker le token de vérification
      });

      // Sauvegarder l'utilisateur dans la base de données
      await newClient.save();

      // Option : Envoi de l'email de vérification (si la fonction est activée)
      // await sendVerificationEmail(clientEmail, emailVerificationToken);

      // Répondre avec un succès, et envoyer le token de vérification au frontend
      res.status(201).json({ 
          message: "Utilisateur créé. Veuillez vérifier votre email pour confirmer votre inscription.",
          emailVerificationToken  // Ajoute le token pour que le frontend puisse l'utiliser
      });

  } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur :", error);
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur. Veuillez réessayer plus tard." });
  }
};

// Contrôleur pour vérifier l'email via le token
module.exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
      const client = await Client.findOne({ emailVerificationToken: token });
      if (!client) {
          return res.status(400).json({ message: 'Token invalide ou expiré' });
      }

      // Si le token est valide, confirmer l'email
      client.isEmailVerified = true;
      client.emailVerificationToken = null; // Supprimer le token après vérification
      await client.save();

      return res.redirect('/confirm-account'); 

      // res.status(200).json({ message: 'Email vérifié avec succès' });
  } catch (error) {
      res.status(500).json({ message: error.message });
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
    const client = await Client.findById(clientId).select('favoris');

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
      client.favoris.push(productId);
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
    client.favoris = client.favoris.filter(fav => fav !== productId);
    await client.save();

    res.status(200).json({ message: 'Produit retiré des favoris.', favorites: client.favoris });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du produit des favoris.' });
  }
};