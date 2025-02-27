const express = require("express");
const { registerUser,
    loginUser,
    verifyOtp,
    logoutUser,
    getAllUsers,
    RefreshAccessToken, } = require("../controllers/userController");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.post("/logout", validateToken, logoutUser);
router.post("/refreshToken", RefreshAccessToken);
router.get("/all", getAllUsers);

module.exports = router;
