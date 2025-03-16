const asyncHandler = require("express-async-handler");
const Game = require("../models/gameModel");
const { Site } = require("../models/siteModel");

// ##########----------Create Game----------##########
const createGame = asyncHandler(async (req, res) => {
  const { name, tags } = req.body;

  if (!name) return res.respond(400, "Game name is required!");

  const newGame = await Game.create({ name, tags });

  res.respond(201, "Game created successfully!", newGame);
});

// ##########----------Update Game----------##########
const updateGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { name, tags } = req.body;

  const updatedGame = await Game.findByIdAndUpdate(
    gameId,
    { name, tags },
    { new: true }
  );

  if (!updatedGame) return res.respond(404, "Game not found!");

  res.respond(200, "Game updated successfully!", updatedGame);
});

// ##########----------Get All Games----------##########
const getAllGames = asyncHandler(async (req, res) => {
  const games = await Game.find().populate("tags");

  res.respond(200, "Games fetched successfully!", games);
});

// ##########----------Delete Game----------##########
const deleteGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;

  const siteWithGame = await Site.findOne({ game: gameId });
  if (siteWithGame) {
    return res.respond(
      400,
      "Game is assigned to a Site and cannot be deleted!"
    );
  }

  const deletedGame = await Game.findByIdAndDelete(gameId);
  if (!deletedGame) return res.respond(404, "Game not found!");

  res.respond(200, "Game deleted successfully!", deletedGame);
});

module.exports = {
  createGame,
  updateGame,
  getAllGames,
  deleteGame,
};
