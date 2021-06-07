import { NextFunction, Response } from 'express';
import AccessToken, { User } from './AccessToken';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader =
    req.headers.get('authorization') || req.headers.get('Authorization');

  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === null) {
    return res.sendStatus(401);
  }

  let user: User;
  try {
    user = await AccessToken.verify(token, '');
  } catch (error) {
    return res.sendStatus(403);
  }

  (req as Request & { user: User }).user = user;

  next();
};

export default authenticate;
