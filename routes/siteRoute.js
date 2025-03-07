const express = require("express");
const {
  createSite,
  updateSite,
  getAllSites,
  getSiteById,
  deleteSite,
} = require("../controllers/siteController");
const uploadToCloudinary = require("../middleware/uploadToCloudnary");

const router = express.Router();

router.post(
  "/createSite",
  uploadToCloudinary("site", ["siteImage", "siteDocument"], [1, 1]),
  createSite
);
router.put(
  "/updateSite/:id",
  uploadToCloudinary("site", ["siteImage", "siteDocument"], [1, 1]),
  updateSite
);
router.get("/getAllSites", getAllSites);
router.get("/getSiteById/:id", getSiteById);
router.delete("/deleteSite/:id", deleteSite);

module.exports = router;
