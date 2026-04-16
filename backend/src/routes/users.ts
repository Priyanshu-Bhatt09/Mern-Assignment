import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createUser,
  deactivateUser,
  getMyProfile,
  getUserDetails,
  getUsers,
  updateMyProfile,
  updateUser,
} from "../controllers/userController.js";

const router = Router();

router.get("/", authenticate, getUsers);
router.post("/", authenticate, createUser);
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.get("/:id", authenticate, getUserDetails);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deactivateUser);

export default router;
