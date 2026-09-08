import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import foodRouter from "./food";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(foodRouter);
router.use(feedbackRouter);

export default router;
