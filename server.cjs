const express = require("express");
const cors = require('cors');
const connectDB = require("./config/db.cjs");
// const dotenv = require("dotenv").config();
// const multer = require('multer');
// const path = require('path');
const port = process.env.PORT || 8080;


// connexion à la DB
connectDB();

const app = express();

// Utilisez le middleware cors
app.use(cors());

// Middleware qui permet de traiter les données de la Request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", require("./routes/product.routes.cjs"));
app.use("/api", require("./routes/user.routes.cjs"));

// mongodb+srv://jonathanmbaya13:hathyre1234@app-hathyre.grr5ukx.mongodb.net/
  

// Lancer le serveur
app.listen(port, () => console.log("Le serveur a démarré au port " + port));
