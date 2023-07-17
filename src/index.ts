import express from "express";
import cors from "cors";
import { authenticateJwtRequestToken } from "./middleware/jwt";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes";
import skillRoutes from "./routes/skillRoutes";
import projectRoutes from "./routes/projectRoutes";

async function main() {
  dotenv.config();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(authenticateJwtRequestToken());

  // Routes
  app.use("/users", userRoutes);
  app.use("/skills", skillRoutes);
  app.use("/projects", projectRoutes);

  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`Listening on port ${port}🚀`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
