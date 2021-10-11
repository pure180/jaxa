import { Router } from 'express';
import { Model, ModelCtor, SyncOptions } from 'sequelize';
import { unionBy } from 'lodash';

import { Authenticator } from '../Authentication/Authenticate';
import { ModelSettings, ModelBaseRoute } from './Definition';
import { BaseController } from '../Controller';

export interface BaseModelProps {
  name: string;
  service: ModelCtor<Model<any, any>>;
  settings: ModelSettings;
}

export class BaseModel {
  public name: string;

  public path: string;

  public router: Router;

  public service: ModelCtor<Model<any, any>>;

  public settings: ModelSettings;

  private secret: string;

  constructor(props: BaseModelProps, secret?: string) {
    this.name = props.name;
    this.router = Router({ mergeParams: true });
    this.service = props.service;
    this.settings = props.settings;
    this.secret = secret || '';

    this.path = this.getPath();
  }

  private getController = () => {
    return new BaseController(this.settings, this.service);
  };

  private getPath = () =>
    `${this.settings.definition.plural || `${this.settings.definition.name}s`}`;

  private initializeRoute = (
    controller: BaseController<any>,
    baseRoute: ModelBaseRoute,
  ) => {
    if (baseRoute.permission && baseRoute.permission === 'authenticated') {
      const authenticator = new Authenticator(this.secret);
      this.router
        .route(baseRoute.route)
        [baseRoute.handler](
          authenticator.authenticate,
          controller[baseRoute.method],
        );
    } else {
      this.router
        .route(baseRoute.route)
        [baseRoute.handler](controller[baseRoute.method]);
    }
  };

  private initializeRoutes = () => {
    const controller = this.getController();
    const baseRoutes = this.baseRoutes();

    baseRoutes.forEach((baseRoute) =>
      this.initializeRoute(controller, baseRoute),
    );
  };

  public initialize = async (options?: SyncOptions) => {
    await this.service.sync(options);
    this.initializeRoutes();
  };

  public baseRoutes = (): ModelBaseRoute[] => {
    const routes: ModelBaseRoute[] = this.settings.routes || [];
    const defaultRoutes: ModelBaseRoute[] = [
      {
        route: '/count',
        method: 'count',
        handler: 'get',
      },
      {
        route: '/:id',
        method: 'findById',
        handler: 'get',
      },
      {
        route: '/:id',
        method: 'updateById',
        handler: 'put',
      },
      {
        route: '/:id',
        method: 'deleteById',
        handler: 'delete',
      },
      {
        route: '/',
        method: 'findAll',
        handler: 'get',
      },
      {
        route: '/',
        method: 'create',
        handler: 'post',
      },
    ];

    return unionBy(routes, defaultRoutes, 'method');
  };
}

export default BaseModel;
