import { Router } from "express";
import { getUsers, getUserById, createUser, updateUser, deleteUser, updateCustomer, archiveCustomer } from "../controllers/users.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/",       authorize("admin","manager"), getUsers);
router.get("/:id",    authorize("admin","manager"), getUserById);
router.post("/",      authorize("admin"),           createUser);
router.put("/:id/customer", authorize("admin","manager"), updateCustomer);
router.delete("/:id/customer", authorize("admin","manager"), archiveCustomer);
router.put("/:id",    authorize("admin"),           updateUser);
router.delete("/:id", authorize("admin"),           deleteUser);
export default router;
