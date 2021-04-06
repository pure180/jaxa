import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
import { HttpError } from 'http-errors';

import { logger, stream } from './Utils/Logger';
import Sequelizer from './Sequelizer/Sequelizer';
import { PackageDefinition } from './Utils/PackageDefinition';
import { Swagger } from './Swagger/Swagger';

enum EnvKeys {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
}

/**
 *
 */
export interface AppSettings {
  cors?: CorsOptions;
  domain?: string;
  middleWares?: express.RequestHandler[];
  packageJson?: PackageDefinition;
}

/**
 * Base express application
 */
export class App {
  private app: express.Application;
  private env: EnvKeys;
  private listening: boolean = false;
  private port: number;
  private router: Router;

  /**
   * @var settings {AppSettings | undefined} -
   */
  private settings?: AppSettings;

  /**
   *
   * @param settings {AppSettings} -
   * @param settings.cors {CorsOptions} -
   * @param settings.domain {String} -
   * @param settings.middleWares {RequestHandler} -
   * @returns App -
   */
  constructor(settings?: AppSettings) {
    this.app = express();
    this.app.mountpath = '/api/v1';
    this.env =
      (process.env.NODE_ENV as EnvKeys | undefined) || EnvKeys.Development;
    this.port = Number(process.env.PORT) || 1337;
    this.settings = settings;
    this.router = Router({ mergeParams: true });
  }

  /**
   *
   * @returns {express.Application} -
   */
  public listen() {
    if (!this.listening) {
      this.app
        .listen(this.port, () => {
          logger.info(`App listening on the port ${this.port}`);
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

  /**
   * @returns void -
   */
  public async start() {
    this.initializeMiddleware();
    await this.initializeRoutes();

    this.listen();
  }

  /**
   * @returns void -
   */
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

  /**
   * @returns void -
   */
  private async initializeRoutes() {
    this.router.get(
      this.app.mountpath,
      (req: Request, res: Response, next: NextFunction) => {
        try {
          res.sendStatus(200);
        } catch (error) {
          next(error);
        }
      },
    );

    this.app.use(this.app.mountpath, this.router);

    const sequelizer = new Sequelizer();
    const models = await sequelizer.sequelizeModels();
    sequelizer.defineModelRelations();

    for (const model of models) {
      await model.initialize();
      this.router.use(`/${model.path}`, model.router);
    }

    const swagger = new Swagger({
      app: this.app,
      models,
      router: this.router,
      sequelizer: sequelizer,
    });

    swagger.initialize();
  }
}

export default App;