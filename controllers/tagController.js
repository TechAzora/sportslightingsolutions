const asyncHandler = require("express-async-handler");
const Game = require("../models/gameModel");
const { Tag, SubTag } = require("../models/tagModel");

// ###############---------------Tag Code Starts Here ---------------###############
// ##########----------Create Tag----------##########
const createTag = asyncHandler(async (req, res) => {
  const { name, subTags } = req.body;

  if (!name) return res.respond(400, "Tag name is required!");

  const newTag = await Tag.create({ name, subTags });

  res.respond(201, "Tag created successfully!", newTag);
});

// ##########----------Update Tag----------##########
const updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { name, subTags } = req.body;

  const updatedTag = await Tag.findByIdAndUpdate(
    tagId,
    { name, subTags },
    { new: true }
  );

  if (!updatedTag) return res.respond(404, "Tag not found!");

  res.respond(200, "Tag updated successfully!", updatedTag);
});

// ##########----------Get All Tags----------##########
const getAllTags = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
    $or: [{ name: { $regex: search, $options: "i" } }],
  };

  const totalCount = await Tag.countDocuments(filter);

  const tags = await Tag.find(filter)
    .populate("subTags", "name")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!tags) return res.respond(404, "Game not found!");

  res.respond(200, "Tags fetched successfully!", {
    totalCount,
    currentPageCount: tags.length,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    data: tags,
  });
});

// ##########----------Get Tags by Game----------##########
const getTagsByGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  if (!gameId) return res.respond(400, "Game ID is required!");

  const game = await Game.findById(gameId).populate({
    path: "tags",
    populate: { path: "subTags" },
  });

  if (!game) return res.respond(404, "Game not found!");

  res.respond(200, "Tags fetched successfully!", game.tags);
});

// ##########----------Delete Tag----------##########
const deleteTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  const gameWithTag = await Game.findOne({ tags: tagId });
  if (gameWithTag) {
    return res.respond(400, "Tag is assigned to a Game and cannot be deleted!");
  }

  const deletedTag = await Tag.findByIdAndDelete(tagId);
  if (!deletedTag) return res.respond(404, "Tag not found!");

  res.respond(200, "Tag deleted successfully!", deletedTag);
});
// ###############---------------Tag Code Ends Here ---------------###############

// ###############---------------Sub-Tag Code Starts Here ---------------###############
// ##########----------Create Sub-Tag----------##########
const createSubTag = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) return res.respond(400, "SubTag name is required!");

  const newSubTag = await SubTag.create({ name });

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
  let { page = 1, limit = 10, search = "" } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {
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

// ##########----------Get Sub-Tags by Tag----------##########
const getSubTagsByTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  if (!tagId) return res.respond(400, "Tag ID is required!");

  const tag = await Tag.findById(tagId).populate("subTags");

  if (!tag) return res.respond(404, "Tag not found!");

  res.respond(200, "SubTags fetched successfully!", tag.subTags);
});

// ##########----------Delete Sub-Tag----------##########
const deleteSubTag = asyncHandler(async (req, res) => {
  const { subTagId } = req.params;

  const tagWithSubTag = await Tag.findOne({ subTags: subTagId });

  if (tagWithSubTag) {
    return res.respond(
      400,
      "SubTag is assigned to a Tag and cannot be deleted!"
    );
  }

  const deletedSubTag = await SubTag.findByIdAndDelete(subTagId);
  if (!deletedSubTag) return res.respond(404, "SubTag not found!");

  res.respond(200, "SubTag deleted successfully!", deletedSubTag);
});
// ###############---------------Sub-Tag Code Ends Here ---------------###############

module.exports = {
  createTag,
  updateTag,
  getAllTags,
  getTagsByGame,
  deleteTag,
  createSubTag,
  updateSubTag,
  getAllSubTags,
  getSubTagsByTag,
  deleteSubTag,
};
