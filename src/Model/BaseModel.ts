import { IRoute, Router } from 'express';
import { Model, ModelCtor, SyncOptions } from 'sequelize';

import { ModelSettings } from './Definition';
import { KeysOfBaseController, BaseController } from '../Controller';

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

  constructor(props: BaseModelProps) {
    this.name = props.name;
    this.router = Router({ mergeParams: true });
    this.service = props.service;
    this.settings = props.settings;

    this.path = this.getPath();
  }

  private getController = () => {
    return new BaseController(this.service);
  };

  private getPath = () =>
    `${this.settings.definition.plural || `${this.settings.definition.name}s`}`;

  private initializeRoutes = () => {
    const controller = this.getController();
    this.baseRoutes().forEach((baseRoute) => {
      this.router
        .route(baseRoute.route)
        [baseRoute.handler](controller[baseRoute.method]);
    });
  };

  public initialize = async (options?: SyncOptions) => {
    await this.service.sync(options);
    this.initializeRoutes();
  };

  public baseRoutes = (): {
    route: string;
    method: KeysOfBaseController;
    handler: keyof IRoute;
  }[] => {
    return [
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
  };
}

export default BaseModel;
