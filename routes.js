const express = require("express");

const router = express.Router();

router.use("/admin", require("./routes/adminRoute"));
router.use("/user", require("./routes/userRoute"));
router.use("/site", require("./routes/siteRoute"));
router.use("/pole", require("./routes/poleRoute"));
router.use("/game", require("./routes/gameRoute"));
router.use("/tag", require("./routes/tagRoute"));
router.use("/device", require("./routes/deviceRoute"));
router.use("/lightType", require("./routes/lightTypeRoute"));
router.use("/light", require("./routes/lightRoute"));
router.use("/mqttLight", require("./routes/mqttLightRoute"));
router.use("/about", require("./routes/aboutRoute"));
router.use("/termCondition", require("./routes/termConditionRoute"));
router.use("/privacyPolicy", require("./routes/privacyPolicyRoute"));

module.exports = router;
