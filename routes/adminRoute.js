const express = require("express");
const { registerAdmin, loginAdmin, logoutAdmin, RefreshAccessToken } = require("../controllers/adminController");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", validateToken, logoutAdmin);
router.post("/refreshToken", RefreshAccessToken);
// router.get("/counts", totalCounts);

module.exports = router;
