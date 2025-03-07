const { asyncHandler } = require("../utils/asyncHandler");
const Tag = require("../models/tagModel");
const Site = require("../models/siteModel");

// ##########----------Create Tag and Sub-Tag----------##########
const createTag = asyncHandler(async (req, res) => {
  const { stadiumType, tags, subTags } = req.body;

  if (!stadiumType || !tags || !subTags) {
    return res.respond(400, "All fields are required!");
  }

  const newTag = await Tag.create({
    stadiumType,
    tags,
    subTags,
  });

  res.respond(201, "Tag and Sub-Tag created successfully!", newTag);
});

// ##########----------Update Tag and Sub-Tag----------##########
const updateTag = asyncHandler(async (req, res) => {
  const { stadiumType, tags, subTags } = req.body;

  const updatedTag = await Tag.findByIdAndUpdate(
    req.params.id,
    { stadiumType, tags, subTags },
    { new: true }
  );

  if (!updatedTag) {
    return res.respond(404, "Tag not found!");
  }

  res.respond(200, "Tag and Sub-Tag updated successfully!", updatedTag);
});

// ##########----------Get All Tag and Sub-Tag----------##########
const getAllTag = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    $or: [
      { stadiumType: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { subTags: { $regex: search, $options: "i" } },
    ],
  };

  const totalCount = await Tag.countDocuments();

  const tags = await Tag.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.respond(200, "Tag and Sub-Tag fetched successfully!", {
    totalCount,
    currentPageCount: tags.length,
    currentPage: page,
    totalPages: Math.ceil(totalTags / limit),
    data: tags,
  });
});

// ##########----------Delete All Tag and Sub-Tag----------##########
const deleteTag = asyncHandler(async (req, res) => {
  const tagId = req.params.id;

  const existingSite = await Site.findOne({ stadiumType: tagId });
  if (existingSite) {
    return res.respond(400, "Cannot delete tag! A site exists with this tag!");
  }

  const deletedTag = await Tag.findByIdAndDelete(tagId);
  if (!deletedTag) {
    return res.respond(404, "Tag not found!");
  }

  res.respond(200, "Tag and Sub-Tag fetched successfully!", deletedTag);
});

module.exports = {
  createTag,
  updateTag,
  getAllTag,
  deleteTag,
};
