const express = require("express");
const {
  handleSingleLight,
  handleLight,
  handleLightsByTagId,
  handleRandomLightsByPoles,
  handleChaseLightsByPoles,
  handleMarqueeLightsByPoles,
  handleWaveLightsByPoles,
} = require("../controllers/mqttLightController");

const router = express.Router();

router.patch("/handleSingleLight/:lightId", handleSingleLight);
router.patch("/handleLightsByTagId/:tagId", handleLightsByTagId);
router.patch("/handleRandomLightsByPoles", handleRandomLightsByPoles);
router.patch("/handleChaseLightsByPoles", handleChaseLightsByPoles);
router.patch("/handleMarqueeLightsByPoles", handleMarqueeLightsByPoles);
router.patch("/handleWaveLightsByPoles", handleWaveLightsByPoles);
router.patch("/handleLight", handleLight);

module.exports = router;
