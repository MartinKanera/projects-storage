import { Request, Response } from 'express';

export default async (req: Request, res: Response, next: Function): Promise<void> => {
  res.locals = {
    id: req.headers.authorization,
  };
  next();
};
