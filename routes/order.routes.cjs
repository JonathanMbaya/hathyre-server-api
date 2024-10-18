const express = require("express");
const {
    getOneOrder,
    getOrders, 
    updateOrderStatus,
    deleteOrder,
    createOrder,
    filterOrdersByStatus,
    createPaypalOrder,
    capturePaypalOrder,
} = require("../controllers/orders.controller.cjs");

const router = express.Router();

// Créer une commande
router.post('/neworders', createOrder);

// Mettre à jour le statut d'une commande
router.put('/orders/:id/status', updateOrderStatus);

// Supprimer une commande
router.delete('/orders/:id', deleteOrder);

// Récupérer toutes les commandes
router.get('/orders', getOrders);

// Récupérer une commande par ID
router.get('/orders/:id', getOneOrder);

router.get('/orders/filter', filterOrdersByStatus);

// Route pour créer une commande PayPal
router.post('/paypal/orders',  createPaypalOrder);

// Route pour capturer une commande PayPal
router.post('/paypal/orders/:orderId/capture', capturePaypalOrder);

module.exports = router;
