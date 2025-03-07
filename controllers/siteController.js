const { asyncHandler } = require("../utils/asyncHandler");
const Site = require("../models/siteModel");
const Tag = require("../models/tagModel");

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
    stadiumType,
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
    !stadiumType ||
    !noOfControllers ||
    !simCardNumber
  ) {
    return res.respond(400, "All fields are required!");
  }

  const existingTag = await Tag.findById(stadiumType);
  if (!existingTag) {
    return res.respond(400, "Invalid stadiumType ID!");
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
    stadiumType,
    noOfControllers,
    simCardNumber,
    siteImage,
    siteDocument,
  });

  const populatedSite = await Site.findById(newSite._id).populate(
    "stadiumType",
    "stadiumType tags subTags"
  );

  res.respond(201, "Site created successfully!", populatedSite);
});

// ##########----------Update Site----------##########
const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.stadiumType) {
    const existingTag = await Tag.findById(updateData.stadiumType);
    if (!existingTag) {
      return res.respond(400, "Invalid stadiumType ID!");
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
  }).populate("stadiumType", "stadiumType tags subTags");

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
    .populate("stadiumType", "stadiumType tags subTags")
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

  const site = await Site.findById(id).populate(
    "stadiumType",
    "stadiumType tags subTags"
  );

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

module.exports = {
  createSite,
  updateSite,
  getAllSites,
  getSiteById,
  deleteSite,
};
