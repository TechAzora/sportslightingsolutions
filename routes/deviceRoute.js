const express = require("express");
const {
  createDevice,
  getDevicesByPole,
  deleteDevice,
  updateDevice,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createDevice/:poleId", createDevice);
router.put("/updateDevice/:deviceId", updateDevice);
router.get("/getDevicesByPole/:poleId", getDevicesByPole);
router.delete("/deleteDevice/:deviceId", deleteDevice);

module.exports = router;
