import express, { Request, Response } from "express";
import cors from "cors";
import monitorRouter from "./routes/monitor.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/v1/monitor", monitorRouter);
app.use("/api/v1/user", userRouter);

// app.get("/health", (req: Request, res: Response) => {
//   res.json({ status: "UP" });
// });

export default app;
