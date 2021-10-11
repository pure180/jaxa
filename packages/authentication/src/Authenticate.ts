import { NextFunction, Response, Request } from 'express';
import AccessToken, { User } from './AccessToken';

export class Authenticator {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;

    this.authenticate = this.authenticate.bind(this);
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader =
      req.headers.authorization ||
      (req.headers.Authorization as string) ||
      null;

    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === null) {
      return res.sendStatus(401);
    }

    let user: User;
    try {
      user = await AccessToken.verify(token, this.secret);
    } catch (error) {
      return res.sendStatus(403);
    }

    (req as Request & { user: User }).user = user;

    next();
  }
}

export default Authenticator;
