const Client = require("../models/client.model.cjs");
// const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Recherche de l'utilisateur dans la base de données par son email
    const client = await Client.findOne({ email });

    // Vérification de l'existence de l'utilisateur
    if (!client) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    // Vérification du mot de passe
    // const passwordMatch = await bcrypt.compare(password, client.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ message: "Mot de passe incorrect" });
    // }

    const passwordMatch = await Client.findOne({password});
    if (!passwordMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Création d'un token JWT
    const token = jwt.sign({ clientToken: Client.token }, 'your_secret_token_key', { expiresIn: '1h' });

    // Envoi de la réponse avec le token et les informations de l'utilisateur
    res.status(200).json({ client: { _id: client._id, email: client.email, nom: client.nom , prenom: client.prenom, token: client.token }, token});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports.logout = async (req, res) => {
  // Vous pouvez simplement supprimer le jeton JWT côté client en effaçant le cookie ou en supprimant le stockage local / de session
  // Par exemple, si vous utilisez des cookies, vous pouvez effacer le cookie contenant le jeton JWT
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
  try {
    const { nom, prenom, clientEmail, clientPassword, confirmPassword } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà" });
    }

    // Crypter le mot de passe
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // Créer un nouvel utilisateur
    const newClient = new Client({
      nom,
      prenom,
      clientEmail,
      clientPassword : clientPassword,
      confirmPassword: confirmPassword,
 
    });


    if (clientPassword === confirmPassword) {
      // Sauvegarder l'utilisateur dans la base de données
      await newClient.save();
    }
    else {
      console.log("Les mots de passe sont différents")
    }


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
