const express = require("express");
const {
  createPoles,
  updatePole,
  getPolesBySite,
  deletePole,
} = require("../controllers/siteController");

const router = express.Router();

router.post("/createPoles/:siteId", createPoles);
router.put("/updatePole/:poleId", updatePole);
router.get("/getPolesBySite/:siteId", getPolesBySite);
router.delete("/deletePole/:poleId", deletePole);

module.exports = router;
