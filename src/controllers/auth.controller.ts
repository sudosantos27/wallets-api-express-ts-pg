// Auth controller: request/response mapping for signin and signout.

import { Request, Response, NextFunction } from "express";
import { SignInBodySchema } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = SignInBodySchema.parse(req.body);
    const result = await authService.signIn(body.email, body.password);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

export const signOut = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.signOut();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};