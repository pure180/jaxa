import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { HttpError } from 'http-errors';
import morgan from 'morgan';
import { join } from 'path';

import { AuthService } from '@jaexa/authentication';
import { Sequelizer } from '@jaexa/sequelizer';
import {
  env,
  EnvKeys,
  logger,
  PackageDefinition,
  stream,
  getPackageDefinition,
} from '@jaexa/utils';

import { Swagger } from './Swagger/Swagger';

/**
 *
 */
export interface AppSettings {
  cors?: CorsOptions;
  domain?: string;
  middleWares?: express.RequestHandler[];
  models?: { pathToConfig?: string };
  publicPath?: string;
  packageJson?: PackageDefinition;
  jwt?: {
    secret: string;
  };
}

/**
 * Base express application
 */
export class App {
  private app: express.Application;

  private env: EnvKeys;

  private listening = false;

  private port: number;

  private publicPath: string;

  private router: Router;

  /**
   * @var settings {AppSettings | undefined} -
   */
  private settings?: AppSettings;

  private runningSince?: string | Date;

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
    this.env = (env.NODE_ENV as EnvKeys | undefined) || EnvKeys.development;
    this.port = Number(env.PORT) || 1337;
    this.publicPath = settings?.publicPath || join(__dirname, '..', 'public');
    this.settings = settings;
    if (this.settings) {
      this.settings.packageJson =
        settings?.packageJson || getPackageDefinition();
    }
    this.router = Router({ mergeParams: true });
    this.app.set('views', this.publicPath);
    this.app.set('view engine', 'jade');
  }

  /**
   *
   * @returns {express.Application} -
   */
  public async listen() {
    if (!this.listening) {
      await this.app
        .listen(this.port, () => {
          logger.info(`App listening on the port ${this.port}`);
          this.listening = true;
          this.runningSince = new Date();
        })
        .once('error', (error: HttpError) => {
          if (error.code === 'EADDRINUSE') {
            // eslint-disable-next-line no-console
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

    this.app.use('/', express.static(this.publicPath));
    this.app.get('/', (req, res) => {
      res.render('index', {
        application: this,
        env: this.env,
        express: this.app,
        pkg: this.settings?.packageJson,
        runningSince: this.runningSince,
      });
    });

    await this.initializeRoutes();

    await this.listen();

    return this;
  }

  /**
   * @returns void -
   */
  private initializeMiddleware() {
    if (this.env === EnvKeys.development) {
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
    this.app.get(this.app.mountpath, (req, res) => {
      res.json({
        name: this.settings?.packageJson?.name,
        started: this.runningSince,
      });
    });

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

    const baseSequelizer = new Sequelizer({
      pathToConfig: this.settings?.models?.pathToConfig,
      secret: this.settings?.jwt?.secret,
    });

    const models = await baseSequelizer.sequelizeModels();

    baseSequelizer.defineModelRelations();

    for (const model of models) {
      await model.initialize();

      this.router.use(`/${model.path}`, model.router);

      if (model.name === 'user' || model.name === 'User') {
        const authService = new AuthService({
          secret: this.settings?.jwt?.secret || '',
          model,
        });
        await authService.initialize();
        this.router.use('/auth', authService.router);
      }
    }

    const swagger = new Swagger({
      app: this.app,
      models,
      sequelizer: baseSequelizer,
    });

    swagger.initialize();
  }
}

export default App;
