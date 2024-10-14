const express = require("express");
const {
  getClients,
  getOneClient,
  createClient,
  editClient,
  deleteClient,
  login,
  getFavorites,
  addFavorite,
  removeFavorite,
  verifyEmail
} = require("../controllers/client.controller.cjs");
const router = express.Router();

router.get("/clients", getClients);
router.get("/client/:id", getOneClient);
router.post("/add/client", createClient);
router.get('/verify-email', verifyEmail);

router.post("/login/client", login);
router.put("/update/client/:id", editClient);
router.delete("/delete/client/:id", deleteClient);
// Route pour récupérer les favoris d'un client
router.get('/favorites/:userId', getFavorites);

// Route pour ajouter un produit aux favoris
router.post('/favorites/:userId/add', addFavorite);

// Route pour retirer un produit des favoris
router.delete('/favorites/:userId/remove/:productId',removeFavorite);


module.exports = router;