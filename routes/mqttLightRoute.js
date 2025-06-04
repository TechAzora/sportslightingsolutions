const express = require("express");
const {
  handleSingleLight,
  handleLight,
  handleLightsByTagId,
  handleRandomLightsByPoles,
  handleChaseLightsByPoles,
  handleMarqueeLightsByPoles,
  handleWaveLightsByPoles,
  stopRandomLightsByPoles,
  stopWaveLightsByPoles,
  stopChaseLightsByPoles,
  stopMarqueeLightsByPoles,
  handleSetRelayBrightnessByPoles,
} = require("../controllers/mqttLightController");

const router = express.Router();

router.patch("/handleSingleLight/:lightId", handleSingleLight);
router.patch("/handleLightsByTagId/:tagId", handleLightsByTagId);
router.patch("/handleRandomLightsByPoles", handleRandomLightsByPoles);
router.patch("/stopRandomLightsByPoles", stopRandomLightsByPoles);
router.patch("/handleChaseLightsByPoles", handleChaseLightsByPoles);
router.patch("/stopChaseLightsByPoles", stopChaseLightsByPoles);
router.patch("/stopMarqueeLightsByPoles", stopMarqueeLightsByPoles);
router.patch("/handleMarqueeLightsByPoles", handleMarqueeLightsByPoles);
router.patch("/handleWaveLightsByPoles", handleWaveLightsByPoles);
router.patch("/stopWaveLightsByPoles", stopWaveLightsByPoles);
router.patch("/handleSetRelayBrightnessByPoles", handleSetRelayBrightnessByPoles);
router.patch("/handleLight", handleLight);

module.exports = router;
