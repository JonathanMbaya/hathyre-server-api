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
} = require("../controllers/product.controller.cjs");

// const {
//   setImage
// } = require("../controllers/image.controller");

const router = express.Router();

router.get("/products/:latest?", getProducts);
router.get("/products/filters/:sortByName?/:sortByPrice?", getProductsFilters);
router.get("/products/filters/:sortByName?", getProductsFilters);
router.get("/products/filters/:sortByPrice?", getProductsFilters);
router.get("/product/:id", getOneProduct);
router.post("/add/product", setProduct);
router.put("/update/product/:id", editProduct);
router.delete("/delete/product/:id", deleteProduct);
router.get("/product/search/:q", searchProducts);
router.patch("/liked/:id", likeProduct);
router.patch("/disliked/:id", dislikeProduct);


module.exports = router;