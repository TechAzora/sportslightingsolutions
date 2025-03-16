const express = require("express");
const {
  createTag,
  updateTag,
  getTagsByGame,
  deleteTag,
  createSubTag,
  updateSubTag,
  getSubTagsByTag,
  deleteSubTag,
  getAllTags,
  getAllSubTags,
} = require("../controllers/tagController");

const router = express.Router();

// ###############---------------Tag Routes Starts Here ---------------###############
router.post("/createTag", createTag);
router.put("/updateTag/:tagId", updateTag);
router.get("/getAllTags", getAllTags);
router.get("/getTagsByGame/:gameId", getTagsByGame);
router.delete("/deleteTag/:tagId", deleteTag);
// ###############---------------Tag Routes Ends Here ---------------###############

// ###############---------------Sub-Tag Routes Starts Here ---------------###############
router.post("/createSubTag", createSubTag);
router.put("/updateSubTag/:subTagId", updateSubTag);
router.get("/getAllSubTags", getAllSubTags);
router.get("/getSubTagsByTag/:tagId", getSubTagsByTag);
router.delete("/deleteSubTag/:subTagId", deleteSubTag);
// ###############---------------Sub-Tag Routes Ends Here ---------------###############

module.exports = router;
