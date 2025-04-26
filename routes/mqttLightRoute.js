const express = require("express");
const { handleSingleLight, handleLight, handleLightsByTagId } = require("../controllers/mqttLightController");

const router = express.Router();

router.patch("/handleSingleLight/:lightId", handleSingleLight);
router.patch("/handleLightsByTagId/:tagId", handleLightsByTagId);
router.patch("/handleLight", handleLight);

module.exports = router;
