import fs from 'fs';
import path from 'path';

import { Dialect } from 'sequelize';
import { env } from './env';

export const SQLiteSettings = (): {
  database: string;
  user: string;
  password: string;
  host: string;
  dialect: Dialect;
  storage: string;
} => {
  const dataBasePath = path.join(
    process.cwd(),
    env.JAXA_DATABASE_STORAGE || 'temp',
  );

  if (!fs.existsSync(dataBasePath)) {
    fs.mkdirSync(dataBasePath);
  }

  return {
    database: env.JAXA_DATABASE || 'db',
    user: env.JAXA_DATABASE_USER || 'user',
    password: env.JAXA_DATABASE_PASSWORD || '',
    host: env.JAXA_DATABASE_DIALECT || 'localhost',
    dialect: env.JAXA_DATABASE_DIALECT || 'sqlite',
    storage: path.join(dataBasePath, 'db.sqlite'),
  };
};

export default SQLiteSettings;
