const express = require("express");
const {
  createLight,
  updateLight,
  getLightsByDevice,
  deleteLight,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createLight/:deviceId", createLight);
router.put("/updateLight/:lightId", updateLight);
router.get("/getLightsByDevice/:deviceId", getLightsByDevice);
router.delete("/deleteLight/:lightId", deleteLight);

module.exports = router;
