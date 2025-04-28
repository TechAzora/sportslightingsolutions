const { asyncHandler } = require("../utils/asyncHandler");
const About = require("../models/aboutModel");

// ##########----------Create About----------##########
const createAbout = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description)
    return res.respond(400, "About title is required!");

  const newAbout = await About.create({ title, description });

  res.respond(201, "About created successfully!", newAbout);
});

// ##########----------Update About----------##########
const updateAbout = asyncHandler(async (req, res) => {
  const { aboutId } = req.params;
  const { title, description } = req.body;

  const updatedAbout = await About.findByIdAndUpdate(
    aboutId,
    { title, description },
    { new: true }
  );

  if (!updatedAbout) return res.respond(404, "About not found!");

  res.respond(200, "About updated successfully!", updatedAbout);
});

// ##########----------Get All Abouts----------##########
const getAllAbouts = asyncHandler(async (req, res) => {
  const abouts = await About.find();

  res.respond(200, "Abouts fetched successfully!", abouts);
});

// ##########----------Get Single About----------##########
const getsingleAbout = asyncHandler(async (req, res) => {
  const { aboutId } = req.params;

  const about = await About.findById(aboutId);

  if (!about) return res.respond(404, "About not found!");

  res.respond(200, "About fetched successfully!", about);
});

// ##########----------Delete About----------##########
const deleteAbout = asyncHandler(async (req, res) => {
  const { aboutId } = req.params;

  const deletedAbout = await About.findByIdAndDelete(aboutId);
  if (!deletedAbout) return res.respond(404, "About not found!");

  res.respond(200, "About deleted successfully!", deletedAbout);
});

module.exports = {
  createAbout,
  updateAbout,
  getAllAbouts,
  getsingleAbout,
  deleteAbout,
};
