const express = require("express");
const { createTag, getAllTag, updateTag, deleteTag } = require("../controllers/tagController");

const router = express.Router();

router.post("/createTag", createTag);
router.put("/updateTag/:id", updateTag);
router.get("/getAllTag", getAllTag);
router.delete("/deleteTag/:id", deleteTag);

module.exports = router;
