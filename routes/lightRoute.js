const express = require("express");
const {
  createLight,
  updateLight,
  getLightsByDevice,
  deleteLight,
} = require("../controllers/deviceAndLightController");

const router = express.Router();

router.post("/createLight/:lightType", createLight);
router.put("/updateLight/:lightId", updateLight);
router.get("/getLightsByDevice/:lightType", getLightsByDevice);
router.delete("/deleteLight/:lightId", deleteLight);

module.exports = router;
