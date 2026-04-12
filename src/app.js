import mongoSanitize from "@exortek/express-mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(hpp());
app.use(mongoSanitize());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://akod-delivery-note.vercel.app"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use("/api/v1", apiRoutes);
app.use(errorHandler);
app.get("/", (req, res) => res.send("AKOD Backend Running"));

export default app;
