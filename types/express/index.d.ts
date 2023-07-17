import { User } from "../../src/types/User";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
