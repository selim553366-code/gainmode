import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import foodRouter from "./food";
import feedbackRouter from "./feedback";
import coachRatingRouter from "./coachRating";
import earlyListRouter from "./earlyList";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(foodRouter);
router.use(feedbackRouter);
router.use(coachRatingRouter);
router.use(earlyListRouter);

export default router;
