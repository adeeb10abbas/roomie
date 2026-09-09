import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import profilesRouter from "./profiles";
import swipesRouter from "./swipes";
import matchesRouter from "./matches";
import messagesRouter from "./messages";
import housingRouter from "./housing";
import housingActionsRouter from "./housing-actions";
import notificationsRouter from "./notifications";
import verificationRouter from "./verification";
import safetyRouter from "./safety";
import accountRouter from "./account";
import aiRouter from "./ai";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(profilesRouter);
router.use(swipesRouter);
router.use(matchesRouter);
router.use(messagesRouter);
// housing-actions must be before housing so /housing/mine and /housing/join-requests/:id
// are matched before /housing/:id
router.use(housingActionsRouter);
router.use(housingRouter);
router.use(notificationsRouter);
router.use(verificationRouter);
router.use(safetyRouter);
router.use(accountRouter);
router.use(aiRouter);
router.use(feedbackRouter);

export default router;
