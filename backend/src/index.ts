import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("Missing MONGO_URI in environment");
}

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "MERN backend is running" });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
