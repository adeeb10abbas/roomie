import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import profilesRouter from "./profiles";
import swipesRouter from "./swipes";
import matchesRouter from "./matches";
import messagesRouter from "./messages";
import housingRouter from "./housing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(profilesRouter);
router.use(swipesRouter);
router.use(matchesRouter);
router.use(messagesRouter);
router.use(housingRouter);

export default router;
