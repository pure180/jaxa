import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
import { Sequelize } from 'sequelize';
import { HttpError } from 'http-errors';

import { logger, stream } from './Utils/Logger';
import { capitalizeFirstLetter, ModelConfig } from './Utils/ModelConfig';
import { BaseModel } from './Model/BaseModel';

const killPort = require('kill-port');

enum EnvKeys {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
}

export interface AppSettings {
  cors?: CorsOptions;
  domain?: string;
  middleWares?: express.RequestHandler[];
}

export class App {
  private app: express.Application;
  private env: EnvKeys;
  private listening: boolean = false;
  private port: number;
  private router: Router;
  private sequelize: Sequelize;
  private settings?: AppSettings;

  constructor(settings?: AppSettings) {
    this.app = express();
    this.env = (process.env.NODE_ENV as EnvKeys | undefined) || EnvKeys.Development;
    this.port = Number(process.env.PORT) || 1337;
    this.settings = settings;
    this.sequelize = new Sequelize('sqlite::memory:');
    this.router = Router({ mergeParams: true });
  }

  public listen() {
    if (!this.listening) {
      this.app
        .listen(this.port, () => {
          logger.info(`🚀 App listening on the port ${this.port}`);
          this.listening = true;
        })
        .once('error', (error: HttpError) => {
          if (error.code === 'EADDRINUSE') {
            console.info(error.message);
          }
        });
    }

    return this.app.listen;
  }

  public async start() {
    this.initializeMiddleware();
    await this.initializeRoutes();

    this.listen();
  }

  private initializeMiddleware() {
    if (this.env === EnvKeys.Development) {
      this.app.use(morgan('dev', { stream }));
      this.app.use(
        cors({
          origin: true,
          credentials: true,
          ...this.settings?.cors,
        }),
      );
    } else {
      this.app.use(morgan('combined', { stream }));
      this.app.use(
        cors({
          origin: this.settings?.domain,
          credentials: true,
          ...this.settings?.cors,
        }),
      );
    }

    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    if (this.settings?.middleWares) {
      this.settings.middleWares.forEach((middleWare) => {
        this.app.use(middleWare);
      });
    }
  }

  private async initializeRoutes() {
    this.router.get(this.app.mountpath, (req: Request, res: Response, next: NextFunction) => {
      try {
        res.sendStatus(200);
      } catch (error) {
        next(error);
      }
    });

    this.app.use(this.app.mountpath, this.router);
    const models = await this.sequelizeModels();

    for (const model of models) {
      await model.initialize();
      this.router.use(`/:${model.path}`, model.router);
    }
  }

  private async sequelizeModels() {
    try {
      await this.sequelize.authenticate();
    } catch (error) {
      throw error;
    }

    const modelConfigurations = new ModelConfig().getModelConfigurations();

    return Object.keys(modelConfigurations).map((key) => {
      const conf = modelConfigurations[key];
      const model = new BaseModel({
        name: capitalizeFirstLetter(conf.definition.name),
        sequelize: this.sequelize,
        settings: modelConfigurations[key],
      });

      return model;
    });
  }
}

export default App;
