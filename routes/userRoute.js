const express = require("express");
const {
  registerUser,
  loginUser,
  verifyOtp,
  logoutUser,
  getAllUsers,
  RefreshAccessToken,
  updateUserStatus,
  getUserProfile,
  deleteUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.post("/logout", validateToken, logoutUser);
router.post("/refreshToken", RefreshAccessToken);
router.put("/updateUserProfile/:id", updateUserProfile);
router.patch("/updateUserStatus/:id", updateUserStatus);
router.get("/getAllUsers", getAllUsers);
router.get("/getUserProfile", validateToken, getUserProfile);
router.get("/deleteUserProfile/:id", deleteUserProfile);

module.exports = router;
