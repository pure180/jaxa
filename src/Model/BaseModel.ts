import { Router } from 'express';
import { Model, ModelCtor } from 'sequelize';

import { ModelSettings } from './Definition';
import { BaseController } from '../Controller/BaseController';

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
    `${this.settings.definition.plural || this.settings.definition.name + 's'}`;

  private initializeRoutes = () => {
    const controller = this.getController();

    this.router.route('/count').get(controller.count);
    this.router
      .route('/:id')
      .get(controller.findById)
      .put(controller.updateById)
      .delete(controller.deleteById);

    this.router.route('/').get(controller.findAll).post(controller.create);
  };

  public initialize = async () => {
    try {
      await this.service.sync();
      this.initializeRoutes();
    } catch (error) {
      throw error;
    }
  };
}
