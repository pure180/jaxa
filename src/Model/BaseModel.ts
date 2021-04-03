import { Sequelize } from 'sequelize';
import { modelService, Service } from '../Services/BaseService';
import { ModelSettings } from './Definition';
import express, { Router } from 'express';
import { BaseController } from '../Controller/BaseController';

export interface BaseModelProps {
  name: string;
  sequelize: Sequelize;
  settings: ModelSettings;
}

export class BaseModel {
  public name: string;
  public path: string;
  public router: Router;
  public sequelize: Sequelize;
  public service: typeof Service;
  public settings: ModelSettings;

  constructor(props: BaseModelProps) {
    this.name = props.name;
    this.router = Router({ mergeParams: true });
    this.sequelize = props.sequelize;
    this.settings = props.settings;

    this.path = this.getPath();
    this.service = this.getService();
  }

  private getController = () => {
    return new BaseController(this.service);
  };

  private getPath = () => `${this.settings.definition.plural || this.settings.definition.name + 's'}`;

  private getService = () => {
    return modelService({
      settings: this.settings,
      sequelize: this.sequelize,
      modelName: this.name,
    });
  };

  private initializeRoutes = () => {
    const controller = this.getController();

    this.router.route('/count').get(controller.count);
    this.router.route('/:id').get(controller.findById).put(controller.updateById).delete(controller.deleteById);

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
