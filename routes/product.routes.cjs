const express = require("express");
const {
  setProduct,
  getProducts,
  getProductsFilters,
  getOneProduct,
  editProduct,
  deleteProduct,
  likeProduct,
  dislikeProduct,
  searchProducts,
  getCatProducts
} = require("../controllers/product.controller.cjs");



const router = express.Router();

// Les tendances de produits récemment ajoutés
router.get("/products/:latest?", getProducts);

// Filtre de produits
router.get("/products/filters/:sortByName?/:sortByPrice?", getProductsFilters);
router.get("/products/filters/:sortByPrice?/:sortByName?", getProductsFilters);
router.get("/products/filters/:sortByName?", getProductsFilters);
router.get("/products/filters/:sortByPrice?", getProductsFilters);
router.get("/products/:category?", getCatProducts);

// Gestion des produits en base de données 
router.get("/product/:id", getOneProduct);
router.post("/add/product", setProduct);
router.put("/update/product/:id", editProduct);
router.delete("/delete/product/:id", deleteProduct);

// Recherche des produits
router.get("/product/search/:q", searchProducts);

// Produits en favoris
router.patch("/liked/:id", likeProduct);
router.patch("/disliked/:id", dislikeProduct);


module.exports = router;