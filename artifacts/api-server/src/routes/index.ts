import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metalsRouter from "./metals";
import materialsRouter from "./materials";
import chemicalsRouter from "./chemicals";
import calculatorRouter from "./calculator";
import visionRouter from "./vision";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metalsRouter);
router.use(materialsRouter);
router.use(chemicalsRouter);
router.use(calculatorRouter);
router.use("/vision", visionRouter);

export default router;
