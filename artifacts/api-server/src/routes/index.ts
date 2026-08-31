import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import foodRouter from "./food";
import runForgeRouter from "./runForge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(foodRouter);
router.use(runForgeRouter);

export default router;
