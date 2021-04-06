import { IRouter, NextFunction, Request, Response, Router } from 'express';
import httpError from 'http-errors';
import { Model, ModelCtor, BaseError } from 'sequelize';
import { Service } from '../Service/Service';

export class BaseController {
  private service: Service;

  constructor(model: ModelCtor<Model<any, any>>) {
    this.service = new Service(model);
  }

  public count = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req;
      const count = await this.service.count(query);
      res.send({ count });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    try {
      const data = await this.service.create(body);
      res.send(data);
    } catch (error) {
      res.status(error.status).send({ ...error });
    }
  };

  public deleteById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = req.params;
    try {
      const data = await this.service.deleteById(id);
      res.send({ count: data, id });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;
    try {
      const data = await this.service.find(query);
      res.send(data);
    } catch (error) {
      next(error);
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const data = await this.service.findById(id);
      res.send(data);
    } catch (error) {
      next(error);
    }
  };

  public updateById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { body } = req;
    const { id } = req.params;
    try {
      const data = await this.service.updateById(id, body);
      res.send(data);
    } catch (error) {
      next(error);
    }
  };
}
