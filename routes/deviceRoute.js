const express = require("express");
const {
  createDevices,
  getDevicesByPole,
  deleteDevice,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createDevices/:poleId", createDevices);
router.get("/getDevicesByPole/:poleId", getDevicesByPole);
router.delete("/deleteDevice/:deviceId", deleteDevice);

module.exports = router;
