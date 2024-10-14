const express = require("express");
const {
  getUsers,
  getOneUser,
  createUser,
  editUser,
  deleteUser,
  loginAdmin
} = require("../controllers/user.controller.cjs");
const router = express.Router();

router.get("/users", getUsers);
router.get("/user/:id", getOneUser);
router.post("/add/user", createUser);
router.post("/admin/login", loginAdmin);
router.put("/update/user/:id", editUser);
router.delete("/delete/user/:id", deleteUser);

module.exports = router;