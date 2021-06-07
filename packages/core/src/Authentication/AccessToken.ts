import { sign, SignOptions, verify } from 'jsonwebtoken';

export interface User {
  email: string;
  id: number | string;
  name: string;
  password: string;
  token?: string | null;
  verified: boolean;
}

export const AccessToken = {
  generate: async <U extends User>(
    user: Partial<U>,
    secret: string,
    options?: SignOptions,
  ) =>
    new Promise<string>((resolve, reject) => {
      let token: string;
      try {
        token = sign(user, secret, options);
      } catch (error) {
        return reject(error);
      }
      return resolve(token);
    }),
  verify: async <U extends User>(token: string, secret: string) =>
    new Promise<U>((resolve, reject) =>
      verify(token, secret, (error, user) => {
        if (error) {
          return reject(error);
        }
        return resolve(user as U);
      }),
    ),
};

export default AccessToken;
