import { UserModel } from "../../generated/prisma/models/User"; // or your user type

export {};
declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}
