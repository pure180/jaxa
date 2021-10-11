import { Request, Response, Router } from 'express';
import validator from 'validator';
import { BaseModel, MailService } from '@jaexa/core';
import createError, { HttpError } from 'http-errors';

import { compare, hash } from 'bcrypt';

import { Model } from 'sequelize/types';
import AccessToken, { User } from './AccessToken';

export interface AuthServiceProps {
  model: BaseModel;
  secret: string;
}

export interface VerificationBody {
  userId: User['id'];
  token: User['token'];
}

export class AuthService {
  private model: BaseModel;

  private saltRounds = 10;

  private secret: string;

  public router: Router;

  constructor(props: AuthServiceProps) {
    this.model = props.model;
    this.secret = props.secret;

    this.router = Router({ mergeParams: true });
  }

  public initialize = async () => {
    this.router.route('/login').post(this.signIn);
    this.router.route('/register').post(this.signOn);
    this.router.route('/verify').post(this.verifyAccount);
  };

  public signIn = async (req: Request<unknown, User, User>, res: Response) => {
    const { body } = req;
    const { email, password } = body;

    let error: HttpError | undefined;

    const rejectLogin = () => {
      error = new createError.Unauthorized('Username or password wrong.');
      error.code = 'BAD_CREDENTIALS';
      return res.status(error.status).send({ ...error });
    };

    if ((!email && !password) || (password && !password.length)) {
      return rejectLogin();
    }

    if (!validator.isEmail(email)) {
      error = new createError.UnprocessableEntity(
        'Please use a valid e-mail address, e.g.: name@domain.tld',
      );
      error.code = 'BAD_EMAIL';
    }

    let result: Model<Partial<User>, Partial<User>> | null;
    try {
      result = await this.model.service.findOne<
        Model<Partial<User>, Partial<User>>
      >({
        where: { email },
      });
    } catch (err) {
      error = new createError.Unauthorized(err as string);
      return res.status(error.status).send({ ...error });
    }

    const user = result?.toJSON() as Partial<User>;

    if (!user || (user && !user.password)) {
      return rejectLogin();
    }

    if (!user.verified) {
      error = new createError.Unauthorized(
        'Email address not verified, please verify your email address!',
      );
      error.code = 'BAD_VERIFICATION';
      return res.status(error.status).send({ ...error });
    }

    const passwordIsValid = await compare(password, user.password || '');

    if (!passwordIsValid) {
      return rejectLogin();
    }

    const token = await AccessToken.generate(user, this.secret, {
      expiresIn: '7d',
    });

    const now = new Date();
    res.cookie('Authorization', `Bearer ${token}`, {
      httpOnly: true,
      expires: new Date(now.setDate(now.getDate() - 13)),
    });

    delete user.password;

    res.send({
      ...user,
      token,
    });
  };

  public signOn = async (req: Request<unknown, User, User>, res: Response) => {
    const { body } = req;
    const { email, password } = body;

    let error: HttpError | undefined;

    if (!validator.isEmail(email)) {
      error = new createError.UnprocessableEntity(
        'Please use a valid e-mail address, e.g.: name@domain.tld',
      );
      error.code = 'BAD_EMAIL';
    }

    const isStrongPassword = validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

    if (!isStrongPassword && !error) {
      error = new createError.UnprocessableEntity(
        'Please use a strong password, min. 8 characters, at least 1 uppercase, at least 1 lowercase, at least 1 number and at least one special character',
      );
      error.code = 'BAD_PASSWORD';
    }

    if (error) {
      return res.status(error.status).send({ ...error });
    }

    const existingResult = await this.model.service.findOne<
      Model<Partial<User>, Partial<User>>
    >({
      where: { email },
    });

    let user = existingResult?.toJSON() as Partial<User>;

    if (user && user.email === email) {
      error = new createError.BadRequest('User already exists.');
      error.code = 'BAD_EMAIL';
      return res.status(error.status).send({ ...error });
    }

    const hashedPassword = await hash(password, this.saltRounds);
    const randomVerificationNumber = Math.floor(Math.random() * 1000000);
    const token = await hash(
      randomVerificationNumber.toString(),
      this.saltRounds,
    );

    let result: Model<Partial<User>, Partial<User>> | undefined;
    try {
      result = await this.model.service.create<
        Model<Partial<User>, Partial<User>>
      >({
        ...body,
        password: hashedPassword,
        token,
        verified: false,
      });
    } catch (err) {
      error = new createError.BadRequest(err as string);
      return res.status(error.status).send({ ...error });
    }

    user = result.toJSON();

    delete user.password;
    delete user.token;

    const mailer = new MailService({
      mailOptions: {
        to: user.email,
        subject: 'This should work',
        html: `<b>${randomVerificationNumber}</b>`,
      },
    });

    const info = await mailer.send();

    return res.status(200).send({
      ...user,
      verification: {
        success: !!info,
        to: info?.envelope.to,
        randomVerificationNumber,
      },
    });
  };

  public verifyAccount = async (
    req: Request<unknown, VerificationBody, VerificationBody>,
    res: Response,
  ) => {
    const { body } = req;
    const { userId, token } = body;

    let error: HttpError | undefined;
    if (!userId && (!token || (token && !token.length))) {
      error = new createError.UnprocessableEntity(
        'No token or user id provided',
      );
      return res.status(error.status).send({ ...error });
    }

    let result: Model<Partial<User>, Partial<User>> | null;
    try {
      result = await this.model.service.findByPk<
        Model<Partial<User>, Partial<User>>
      >(userId);
    } catch (err) {
      error = new createError.BadRequest(err as string);
      return res.status(error.status).send({ ...error });
    }

    const user = result?.toJSON() as Partial<User>;

    if (!user) {
      error = new createError.BadRequest(`User with ${userId} doesn't exist.`);
      error.code = 'NOT_FOUND';
      return res.status(error.status).send({ ...error });
    }

    if (user.verified) {
      error = new createError.BadRequest(`User already verified`);
      error.code = 'BAD_VERIFICATION';
      return res.status(error.status).send({ ...error });
    }

    if (!user.token) {
      error = new createError.BadRequest(`User already verified`);
      error.code = 'BAD_VERIFICATION';
      return res.status(error.status).send({ ...error });
    }

    const isValidToken = await compare(token || '', user.token || '');

    if (!isValidToken) {
      error = new createError.BadRequest(`Token is invalid`);
      error.code = 'BAD_TOKEN';
      return res.status(error.status).send({ ...error });
    }

    user.token = null;
    user.verified = true;
    Object.assign(result, user);

    try {
      await result?.save();
    } catch (err) {
      error = new createError.BadRequest(err as string);
      return res.status(error.status).send({ ...error });
    }

    delete user.password;

    return res.status(200).send(user);
  };

  // private signOut = (
  //   req: Request<unknown, User, User>,
  //   res: Response,
  //   next: NextFunction,
  // ) => {

  // }
}

export default AuthService;
