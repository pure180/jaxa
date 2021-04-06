import fs from 'fs';
import path from 'path';

import { Dialect } from 'sequelize';

export const SQLiteSettings = (): {
  database: string;
  user: string;
  password: string;
  host: string;
  dialect: Dialect;
  storage: string;
} => {
  const dataBasePath = path.join(process.cwd(), 'tmp');

  if (!fs.existsSync(dataBasePath)) {
    fs.mkdirSync(dataBasePath);
  }

  return {
    database: 'db',
    user: 'user',
    password: '',
    host: 'localhost',
    dialect: 'sqlite',
    storage: path.join(dataBasePath, 'db.sqlite'),
  };
};
