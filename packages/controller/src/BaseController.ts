import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { Model, ModelCtor } from 'sequelize';
import { ModelSettings, Service } from '@jaexa/core';
// import { ModelSettings } from '@jaexa/model';
// import { Service } from '@jaexa/service';

const santanizeEntity = <M extends { [key: string]: unknown }>(
  settings: ModelSettings,
  entity: M,
) => {
  Object.keys(settings.properties).forEach((key) => {
    const property = settings.properties[key];
    if ((property as any).hidden && key in entity) {
      // eslint-disable-next-line no-param-reassign
      delete entity[key];
    }
  });
  return entity;
};
export class BaseController<M extends { [key: string]: unknown }> {
  private service?: Service<any>;

  private settings?: ModelSettings;

  constructor(settings?: ModelSettings, model?: ModelCtor<Model<M, any>>) {
    this.service = model && new Service<M>(model);
    this.settings = settings;
  }

  private noServiceError = () => {
    throw new Error(
      `Controller can't be initialized, properly model is missing`,
    );
  };

  public count = async (req: Request, res: Response, next: NextFunction) => {
    if (!this.service) {
      return this.noServiceError();
    }

    try {
      const { query } = req;
      const count = await this.service.count(query);
      res.send({ count });
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      next(error);
    }
  };

  public create = async (req: Request, res: Response) => {
    if (!this.service) {
      return this.noServiceError();
    }

    const { body } = req;
    try {
      const entity = await this.service.create(body);
      res.send(
        (this.settings &&
          santanizeEntity<M>(this.settings, entity.toJSON() as M)) ||
          entity,
      );
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      res.status(error.status).send({ ...error });
    }
  };

  public deleteById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!this.service) {
      return this.noServiceError();
    }

    const { id } = req.params;
    try {
      const data = await this.service.deleteById(id);
      res.send({ count: data, id });
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      next(error);
    }
  };

  public findAll = async (req: Request, res: Response) => {
    if (!this.service) {
      return this.noServiceError();
    }

    const { query } = req;
    try {
      const entities = await this.service.find(query);
      res.send(
        (this.settings &&
          entities.map(
            (entity) =>
              this.settings &&
              santanizeEntity<M>(this.settings, entity.toJSON() as M),
          )) ||
          entities,
      );
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      res.status(error.status).send({ ...error });
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    if (!this.service) {
      return this.noServiceError();
    }

    const { id } = req.params;
    try {
      const entity = await this.service.findById(id);
      res.send(
        (this.settings &&
          entity &&
          santanizeEntity<M>(this.settings, entity.toJSON() as M)) ||
          entity,
      );
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      next(error);
    }
  };

  public updateById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!this.service) {
      return this.noServiceError();
    }

    const { body } = req;
    const { id } = req.params;
    try {
      const data = await this.service.updateById(id, body);
      res.send(data);
    } catch (err) {
      const error = new createHttpError.HttpError(err as string);
      next(error);
    }
  };
}

export default BaseController;
