const express = require("express");

const router = express.Router();

router.use("/admin", require("./routes/adminRoute"));
router.use("/user", require("./routes/userRoute"));
router.use("/tag", require("./routes/tagRoute"));
router.use("/site", require("./routes/siteRoute"));

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 30826dad66e13e4335c53bbebd79a5dcfe5d574c
