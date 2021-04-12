import dotenv from 'dotenv';
import path from 'path';

export enum EnvKeys {
  development = 'development',
  production = 'production',
  staging = 'staging',
  test = 'test',
}

dotenv.config({
  path: path.join(
    process.cwd(),
    `.env${
      (process.env.NODE_ENV !== EnvKeys.development &&
        EnvKeys[process.env.NODE_ENV as EnvKeys] &&
        '.' + EnvKeys[process.env.NODE_ENV as EnvKeys]) ||
      ''
    }`,
  ),
});

type EnvBase = { [key: string]: string | undefined };

export interface Env extends EnvBase {
  JAXA_CONFIGURATION_PATH?: string;
}

export const env = process.env as Env;
