const express = require("express");

const router = express.Router();

router.use("/admin", require("./routes/adminRoute"));
router.use("/user", require("./routes/userRoute"));
router.use("/site", require("./routes/siteRoute"));
router.use("/pole", require("./routes/poleRoute"));
router.use("/game", require("./routes/gameRoute"));
router.use("/tag", require("./routes/tagRoute"));

module.exports = router;

