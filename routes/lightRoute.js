const express = require("express");
const {
  createLights,
  updateLight,
  getLightsByDevice,
  deleteLight,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createLights/:deviceId", createLights);
router.put("/updateLight/:lightId", updateLight);
router.get("/getLightsByDevice/:deviceId", getLightsByDevice);
router.delete("/deleteLight/:lightId", deleteLight);

module.exports = router;
