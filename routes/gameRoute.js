const express = require("express");
const {
  createGame,
  updateGame,
  getAllGames,
  deleteGame,
} = require("../controllers/gameController");

const router = express.Router();

router.post("/createGame", createGame);
router.put("/updateGame/:gameId", updateGame);
router.get("/getAllGames", getAllGames);
router.delete("/deleteGame/:gameId", deleteGame);

module.exports = router;
