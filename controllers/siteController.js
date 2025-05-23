const { asyncHandler } = require("../utils/asyncHandler");
const { Site, Pole } = require("../models/siteModel");
const Game = require("../models/gameModel");

// ###############---------------Site Code Starts Here ---------------###############
// ##########----------Create Site----------##########
const createSite = asyncHandler(async (req, res) => {
  const {
    siteName,
    department,
    siteLocation,
    isDimmable,
    electricRates,
    noOfPoles,
    perLightConsumptionRate,
    game,
    noOfControllers,
    simCardNumber,
  } = req.body;

  if (
    !siteName ||
    !department ||
    !siteLocation ||
    isDimmable == null ||
    !electricRates ||
    !noOfPoles ||
    !perLightConsumptionRate ||
    !game ||
    !noOfControllers ||
    !simCardNumber
  ) {
    return res.respond(400, "All fields are required!");
  }

  const existingGame = await Game.findById(game);
  if (!existingGame) {
    return res.respond(400, "Invalid Game ID!");
  }

  const siteImage = req.files["siteImage"]
    ? req.files["siteImage"][0].path
    : null;

  const siteDocument = req.files["siteDocument"]
    ? req.files["siteDocument"][0].path
    : null;

  if (!siteImage) {
    return res.respond(400, "please provide site image!");
  }

  if (!siteDocument) {
    return res.respond(400, "please provide site document!");
  }

  const newSite = await Site.create({
    siteName,
    department,
    siteLocation,
    isDimmable,
    electricRates,
    noOfPoles,
    perLightConsumptionRate,
    game,
    noOfControllers,
    simCardNumber,
    siteImage,
    siteDocument,
  });

  const populatedSite = await Site.findById(newSite._id).populate(
    "game",
    "name"
  );

  res.respond(201, "Site created successfully!", populatedSite);
});

// ##########----------Update Site----------##########
const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.game) {
    const existingGame = await Game.findById(updateData.game);
    if (!existingGame) {
      return res.respond(400, "Invalid Game ID!");
    }
  }

  if (req.files["siteImage"]) {
    updateData.siteImage = req.files["siteImage"][0].path;
  }
  if (req.files["siteDocument"]) {
    updateData.siteDocument = req.files["siteDocument"][0].path;
  }

  const updatedSite = await Site.findByIdAndUpdate(id, updateData, {
    new: true,
  }).populate("game", "name");

  if (!updatedSite) {
    return res.respond(404, "Site not found!");
  }

  res.respond(200, "Site updated successfully!", updatedSite);
});

// ##########----------Get All Site----------##########
const getAllSites = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    $or: [
      { siteName: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { simCardNumber: { $regex: search, $options: "i" } },
    ],
  };

  const totalCount = await Site.countDocuments(filter);

  const sites = await Site.find(filter)
    .populate("game", "name")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.respond(200, "Sites fetched successfully!", {
    totalCount,
    currentPageCount: sites.length,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: sites,
  });
});

// ##########----------Get Single Site By ID----------##########
const getSiteById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const site = await Site.findById(id).populate("game", "name");

  if (!site) {
    return res.respond(404, "Site not found!");
  }

  res.respond(200, "Site fetched successfully!", site);
});

// ##########----------Delete Site By ID----------##########
const deleteSite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedSite = await Site.findByIdAndDelete(id);

  if (!deletedSite) {
    return res.respond(404, "Site not found!");
  }

  res.respond(200, "Site deleted successfully!", deletedSite);
});
// ###############---------------Site Code Ends Here ---------------###############

// ###############---------------Pole Code Starts Here ---------------###############
// ##########----------Create Poles----------##########
const createPoles = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { poleName } = req.body;

  if (!poleName) {
    return res.respond(400, "Pole Name is required!");
  }

  const createdPole = await Pole.create({
    poleName,
    siteId,
  });

  await Site.findByIdAndUpdate(siteId, {
    $push: { poles: createdPole._id },
  });

  res.respond(201, "Poles created successfully!", createdPole);
});

// ##########----------Update Pole----------##########
const updatePole = asyncHandler(async (req, res) => {
  const { poleId } = req.params;
  let { poleName } = req.body;

  const updatedPole = await Pole.findByIdAndUpdate(
    poleId,
    { poleName },
    { new: true }
  );

  if (!updatedPole) return res.respond(404, "Pole not found!");

  res.respond(200, "Pole updated successfully!", updatedPole);
});

// ##########----------Get Poles By Site----------##########
const getPolesBySite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!siteId) return res.respond(400, "siteId is required!");

  const poles = await Pole.find({ siteId });

  res.respond(200, "Poles fetched successfully!", poles);
});

// ##########----------Delete Pole----------##########
const deletePole = asyncHandler(async (req, res) => {
  const { poleId } = req.params;

  const deletedPole = await Pole.findByIdAndDelete(poleId);
  if (!deletedPole) return res.respond(404, "Pole not found!");

  await Site.findByIdAndUpdate(deletedPole.siteId, {
    $pull: { poles: poleId },
  });

  res.respond(200, "Pole deleted successfully!", deletedPole);
});
// ###############---------------Pole Code Ends Here ---------------###############

module.exports = {
  createSite,
  updateSite,
  getAllSites,
  getSiteById,
  deleteSite,
  createPoles,
  updatePole,
  getPolesBySite,
  deletePole,
};
