const express = require("express");
const {
    getOneOrder,
    getOrders, 
    updateOrderStatus,
    deleteOrder,
    createOrder
} = require("../controllers/orders.controller.cjs");

const router = express.Router();

// Créer une commande
router.post('/neworders', createOrder);

// Mettre à jour le statut d'une commande
router.patch('/orders/:id/status', updateOrderStatus);

// Supprimer une commande
router.delete('/orders/:id', deleteOrder);

// Récupérer toutes les commandes
router.get('/orders', getOrders);

// Récupérer une commande par ID
router.get('/orders/:id', getOneOrder);

module.exports = router;
