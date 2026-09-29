import { Router } from "express";
import { getGames, getGameById, createGame, updateGame, deleteGame } from "../controllers/games.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/",       getGames);
router.get("/:id",    getGameById);
router.post("/",      authorize("admin","manager"), createGame);
router.put("/:id",    authorize("admin","manager"), updateGame);
router.delete("/:id", authorize("admin"),           deleteGame);
export default router;
