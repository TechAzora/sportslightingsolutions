const { asyncHandler } = require("../utils/asyncHandler");
const TermCondition = require("../models/termsConditionModel");

// ##########----------Create Term & Condition----------##########
const createTermCondition = asyncHandler(async (req, res) => {
  const { termCondition } = req.body;

  if (!termCondition) return res.respond(400, "Term & Condition text is required!");

  const newTerm = await TermCondition.create({ termCondition });

  res.respond(201, "Term & Condition created successfully!", newTerm);
});

// ##########----------Update Term & Condition----------##########
const updateTermCondition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { termCondition } = req.body;

  const updatedTerm = await TermCondition.findByIdAndUpdate(
    id,
    { termCondition },
    { new: true }
  );

  if (!updatedTerm) return res.respond(404, "Term & Condition not found!");

  res.respond(200, "Term & Condition updated successfully!", updatedTerm);
});

// ##########----------Get All Terms & Conditions----------##########
const getAllTermConditions = asyncHandler(async (req, res) => {
  const terms = await TermCondition.find();

  res.respond(200, "Terms & Conditions fetched successfully!", terms);
});

// ##########----------Delete Term & Condition----------##########
const deleteTermCondition = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedTerm = await TermCondition.findByIdAndDelete(id);
  if (!deletedTerm) return res.respond(404, "Term & Condition not found!");

  res.respond(200, "Term & Condition deleted successfully!", deletedTerm);
});

module.exports = {
  createTermCondition,
  updateTermCondition,
  getAllTermConditions,
  deleteTermCondition,
};
