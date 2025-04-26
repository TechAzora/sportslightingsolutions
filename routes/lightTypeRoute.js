const express = require("express");
const {
  createLightType,
  updateLightType,
  getLightTypesByDevice,
  deleteLightType,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createLightType/:deviceId", createLightType);
router.put("/updateLightType/:lightTypeId", updateLightType);
router.get("/getLightTypesByDevice/:deviceId", getLightTypesByDevice);
router.delete("/deleteLightType/:lightTypeId", deleteLightType);

module.exports = router;
