import { Router, type IRouter } from "express";
import healthRouter from "./health";
import predictionsRouter from "./predictions";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/predictions", predictionsRouter);
router.use("/chat", chatRouter);

export default router;
