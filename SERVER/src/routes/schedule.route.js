import express from "express";
import { verifyTokenUser } from "../middlewares/verifyToken.js";
import { getMySchedule, addPersonalSchedule, deleteSchedule } from "../controllers/schedule.controller.js";

const router = express.Router();

router.get("/", verifyTokenUser, getMySchedule);
router.post("/", verifyTokenUser, addPersonalSchedule);
router.delete("/:id", verifyTokenUser, deleteSchedule);

export default router;