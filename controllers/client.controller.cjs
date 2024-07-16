const Client = require("../models/client.model.cjs");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

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

module.exports.createClient = async (req, res) => {
  const { nom, prenom, clientEmail, clientPassword, confirmPassword } = req.body;

  if (!clientEmail) {
      return res.status(400).json({ message: "L'email est requis" });
  }

  try {
      // Vérifier si l'utilisateur existe déjà
      const existingClient = await Client.findOne({ clientEmail });
      if (existingClient) {
          return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }

      // Vérifier si les mots de passe correspondent
      if (clientPassword !== confirmPassword) {
          return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
      }

      // Crypter le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(clientPassword, salt);

      // Créer un nouvel utilisateur
      const newClient = new Client({
          nom,
          prenom,
          clientEmail,
          clientPassword: hashedPassword, // Stocker le mot de passe crypté
      });

      // Sauvegarder l'utilisateur dans la base de données
      await newClient.save();

      res.status(201).json(newClient);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

module.exports.editClient = async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return res
        .status(404)
        .json({ message: "Cet utilisateur n'existe pas" });
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
