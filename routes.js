const express = require("express");

const router = express.Router();

router.use("/admin", require("./routes/adminRoute"));
router.use("/user", require("./routes/userRoute"));
router.use("/tag", require("./routes/tagRoute"));
router.use("/site", require("./routes/siteRoute"));

module.exports = router;

