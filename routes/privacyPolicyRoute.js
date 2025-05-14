const express = require("express");
const {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  getAllPrivacyPolicies,
  deletePrivacyPolicy,
} = require("../controllers/privacyPolicyController");

const router = express.Router();

router.post("/createPrivacyPolicy", createPrivacyPolicy);
router.put("/updatePrivacyPolicy/:id", updatePrivacyPolicy);
router.get("/getAllPrivacyPolicies", getAllPrivacyPolicies);
router.delete("/deletePrivacyPolicy/:id", deletePrivacyPolicy);

module.exports = router;
