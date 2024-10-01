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
  const { nom, prenom, clientEmail, clientPassword } = req.body;

  if (!clientEmail) {
      return res.status(400).json({ message: "L'email est requis" });
  }

  try {
      // Vérifier si l'utilisateur existe déjà
      const existingClient = await Client.findOne({ clientEmail });
      if (existingClient) {
          return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }

      // // Vérifier si les mots de passe correspondent
      // if (clientPassword !== confirmPassword) {
      //     return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
      // }

      // Crypter le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(clientPassword, salt);

      // Créer un nouvel utilisateur
      const newClient = new Client({
          sexe,
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