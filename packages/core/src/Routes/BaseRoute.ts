import express, { NextFunction, Request, Response, Router } from 'express';

export interface BaseRouteProps {
  path?: string;
  app: express.Application;
  forModel?: undefined | true;
  name: string;
  routerOptions?: express.RouterOptions;
}

export class BaseRoute {
  public basePath: string;

  public router: Router;

  constructor({ path, app, forModel, name, routerOptions }: BaseRouteProps) {
    this.basePath = `${app.mountpath}${path || ''}${(forModel && name) || ''}`;
    this.router = Router(routerOptions);

    this.createRoutes();

    return this;
  }

  private createRoutes = () => {
    this.router.get(
      this.basePath,
      (req: Request, res: Response, next: NextFunction): void => {
        try {
          res.sendStatus(200);
        } catch (error) {
          next(error);
        }
      },
    );
  };
}

export default BaseRoute;
