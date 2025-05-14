const { asyncHandler } = require("../utils/asyncHandler");
const PrivacyPolicy = require("../models/privacyPolicyModel");

// ##########----------Create Privacy Policy----------##########
const createPrivacyPolicy = asyncHandler(async (req, res) => {
  const { privacyPolicy } = req.body;

  if (!privacyPolicy)
    return res.respond(400, "Privacy Policy text is required!");

  const newPolicy = await PrivacyPolicy.create({ privacyPolicy });

  res.respond(201, "Privacy Policy created successfully!", newPolicy);
});

// ##########----------Update Privacy Policy----------##########
const updatePrivacyPolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { privacyPolicy } = req.body;

  const updatedPolicy = await PrivacyPolicy.findByIdAndUpdate(
    id,
    { privacyPolicy },
    { new: true }
  );

  if (!updatedPolicy) return res.respond(404, "Privacy Policy not found!");

  res.respond(200, "Privacy Policy updated successfully!", updatedPolicy);
});

// ##########----------Get All Privacy Policies----------##########
const getAllPrivacyPolicies = asyncHandler(async (req, res) => {
  const policies = await PrivacyPolicy.find();

  res.respond(200, "Privacy Policies fetched successfully!", policies);
});

// ##########----------Delete Privacy Policy----------##########
const deletePrivacyPolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedPolicy = await PrivacyPolicy.findByIdAndDelete(id);
  if (!deletedPolicy) return res.respond(404, "Privacy Policy not found!");

  res.respond(200, "Privacy Policy deleted successfully!", deletedPolicy);
});

module.exports = {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  getAllPrivacyPolicies,
  deletePrivacyPolicy,
};
