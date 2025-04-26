const express = require("express");
const {
  createAbout,
  updateAbout,
  getAllAbouts,
  deleteAbout,
  getsingleAbout,
} = require("../controllers/aboutController");

const router = express.Router();

router.post("/createAbout", createAbout);
router.put("/updateAbout/:aboutId", updateAbout);
router.get("/getAllAbouts", getAllAbouts);
router.get("/getsingleAbout/:aboutId", getsingleAbout);
router.delete("/deleteAbout/:aboutId", deleteAbout);

module.exports = router;
