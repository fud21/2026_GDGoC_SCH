import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import surveyRouter from "./routes/survey.js";
import eduRouter from "./routes/edu.js";
import simRouter from "./routes/sim.js";
import assistantRouter from "./routes/assistant.js";
import advRouter from "./routes/adv.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/survey", surveyRouter);
app.use("/api/edu", eduRouter);
app.use("/api/sim", simRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/adv", advRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
