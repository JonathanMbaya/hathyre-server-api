const User = require("../models/user.model.cjs");
// const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Recherche de l'utilisateur dans la base de données par son email
    const user = await User.findOne({ email });

    // Vérification de l'existence de l'utilisateur
    if (!user) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    // Vérification du mot de passe
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ message: "Mot de passe incorrect" });
    // }

    const passwordMatch = await User.findOne({password});
    if (!passwordMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Création d'un token JWT
    const token = jwt.sign({ UserToken: user.token }, 'your_secret_token_key', { expiresIn: '1h' });

    // Envoi de la réponse avec le token et les informations de l'utilisateur
    res.status(200).json({ user: { _id: user._id, email: user.email, nom: user.nom , prenom: user.prenom, token: user.token }, token});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports.logout = async (req, res) => {
  // Vous pouvez simplement supprimer le jeton JWT côté client en effaçant le cookie ou en supprimant le stockage local / de session
  // Par exemple, si vous utilisez des cookies, vous pouvez effacer le cookie contenant le jeton JWT
  res.clearCookie('token').send('Déconnexion réussie');
};


module.exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getOneUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Cet utilisateur n'existe pas" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà" });
    }

    // Crypter le mot de passe
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // Créer un nouvel utilisateur
    const newUser = new User({
      nom,
      prenom,
      email,
      password: password,
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.editUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Cet utilisateur n'existe pas" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Cet utilisateur n'existe pas" });
    }
    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
