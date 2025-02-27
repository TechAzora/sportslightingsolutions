const express = require("express");

const router = express.Router();

router.use("/admin", require("./adminRoute"));
router.use("/user", require("./userRoute"));

module.exports = router;
