import Game from "../models/Game.model.js";

export const getGames = async (req, res) => {
  try {
    const { search = "", platform = "", isActive, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (search)   filter.name     = new RegExp(search, "i");
    if (platform) filter.platform = platform;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await Game.countDocuments(filter);
    const games = await Game.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: games, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    res.json({ success: true, data: game });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createGame = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.status(201).json({ success: true, data: game });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: game });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteGame = async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Game deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
