const express = require("express");
const {
  createTermCondition,
  updateTermCondition,
  getAllTermConditions,
  deleteTermCondition,
} = require("../controllers/termConditionController");

const router = express.Router();

router.post("/createTermCondition", createTermCondition);
router.put("/updateTermCondition/:id", updateTermCondition);
router.get("/getAllTermConditions", getAllTermConditions);
router.delete("/deleteTermCondition/:id", deleteTermCondition);

module.exports = router;
