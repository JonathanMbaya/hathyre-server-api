const express = require("express");
const {
  getClients,
  getOneClient,
  createClient,
  editClient,
  deleteClient,
  login
} = require("../controllers/client.controller.cjs");
const router = express.Router();

router.get("/clients", getClients);
router.get("/client/:id", getOneClient);
router.post("/add/client", createClient);
router.put("/update/client/:id", editClient);
router.delete("/delete/client/:id", deleteClient);
router.delete("/login/client", login);

module.exports = router;