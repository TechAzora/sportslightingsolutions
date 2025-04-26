const { asyncHandler } = require("../utils/asyncHandler");
const Game = require("../models/gameModel");
const { Tag, SubTag } = require("../models/tagModel");

// ###############---------------Tag Code Starts Here ---------------###############
// ##########----------Create Tag----------##########
const createTag = asyncHandler(async (req, res) => {
  const { name, site } = req.body;

  if (!name) return res.respond(400, "Tag name is required!");

  const newTag = await Tag.create({ name, site });

  res.respond(201, "Tag created successfully!", newTag);
});

// ##########----------Update Tag----------##########
const updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { name } = req.body;

  const updatedTag = await Tag.findByIdAndUpdate(
    tagId,
    { name },
    { new: true }
  );

  if (!updatedTag) return res.respond(404, "Tag not found!");

  res.respond(200, "Tag updated successfully!", updatedTag);
});

// ##########----------Get All Tags----------##########
const getAllTags = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    site: siteId,
    $or: [{ name: { $regex: search, $options: "i" } }],
  };

  const totalCount = await Tag.countDocuments(filter);

  const tags = await Tag.find(filter)
    .populate("site", "siteName")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!tags) return res.respond(404, "Sites not found!");

  res.respond(200, "Tags fetched successfully!", {
    totalCount,
    currentPageCount: tags.length,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: tags,
  });
});

// ##########----------Delete Tag----------##########
const deleteTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  const deletedTag = await Tag.findByIdAndDelete(tagId);
  if (!deletedTag) return res.respond(404, "Tag not found!");

  res.respond(200, "Tag deleted successfully!", deletedTag);
});
// ###############---------------Tag Code Ends Here ---------------###############

// ###############---------------Sub-Tag Code Starts Here ---------------###############
// ##########----------Create Sub-Tag----------##########
const createSubTag = asyncHandler(async (req, res) => {
  const { name, tag } = req.body;

  if (!name || !tag)
    return res.respond(400, "SubTag and Tag name is required!");

  const newSubTag = await SubTag.create({ name, tag });

  res.respond(201, "SubTag created successfully!", newSubTag);
});

// ##########----------Update Sub-Tag----------##########
const updateSubTag = asyncHandler(async (req, res) => {
  const { subTagId } = req.params;
  const { name } = req.body;

  const updatedSubTag = await SubTag.findByIdAndUpdate(
    subTagId,
    { name },
    { new: true }
  );

  if (!updatedSubTag) return res.respond(404, "SubTag not found!");

  res.respond(200, "SubTag updated successfully!", updatedSubTag);
});

// ##########----------Get All Sub-Tags----------##########
const getAllSubTags = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  if (!tagId) return res.respond(400, "Tag ID is required!");

  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    tag: tagId,
    $or: [{ name: { $regex: search, $options: "i" } }],
  };

  const totalCount = await SubTag.countDocuments(filter);

  const subTags = await SubTag.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!subTags) return res.respond(404, "Tag not found!");

  res.respond(200, "SubTags fetched successfully!", {
    totalCount,
    currentPageCount: subTags.length,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: subTags,
  });
});

// ##########----------Delete Sub-Tag----------##########
const deleteSubTag = asyncHandler(async (req, res) => {
  const { subTagId } = req.params;

  const deletedSubTag = await SubTag.findByIdAndDelete(subTagId);
  if (!deletedSubTag) return res.respond(404, "SubTag not found!");

  res.respond(200, "SubTag deleted successfully!", deletedSubTag);
});
// ###############---------------Sub-Tag Code Ends Here ---------------###############

module.exports = {
  createTag,
  updateTag,
  getAllTags,
  deleteTag,
  createSubTag,
  updateSubTag,
  getAllSubTags,
  deleteSubTag,
};
