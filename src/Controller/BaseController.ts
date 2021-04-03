import { IRouter, Router, Response, Request, NextFunction } from 'express';
import express from 'express';

import { Service } from '../Services/BaseService';

export class BaseController {
  private service: typeof Service;

  constructor(service: typeof Service) {
    this.service = service;
  }

  public count = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.service.count();
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
      next(error);
    }
  };

  public deleteById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const data = await this.service.destroy({ where: { id } });
      res.send({ count: data, id });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findAll();
      res.send(data);
    } catch (error) {
      next(error);
    }
  };

  public findById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const data = await this.service.findOne({ where: { id } });
      res.send(data);
    } catch (error) {
      next(error);
    }
  };

  public updateById = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    const { id } = req.params;
    try {
      const data = await this.service.findOne({ where: { id } });
      if (data) {
        Object.assign(data, body);
        await data.save();
      }
      res.send(data);
    } catch (error) {
      next(error);
    }
  };
}
