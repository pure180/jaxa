import { query } from 'express';
import { FindOptions, Model, ModelCtor } from 'sequelize/types';
import createError from 'http-errors';

export class Service<Model extends Object = {}> {
  private model: ModelCtor<any>;

  constructor(model: ModelCtor<any>) {
    this.model = model;
  }

  public count = async (query?: FindOptions) => {
    try {
      return await this.model.count(query);
    } catch (error) {
      throw new createError.UnprocessableEntity({ ...error });
    }
  };

  public create = async (body: Model) => {
    try {
      return await this.model.create(body);
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };

  public deleteById = async (id: string | number) => {
    try {
      return await this.model.destroy({ where: { id } });
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };

  public find = async (query?: FindOptions) => {
    try {
      return await this.model.findAll(query);
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };

  public findById = async (id: number | string) => {
    try {
      return await this.model.findOne({ where: { id } });
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };

  public findOne = async (query?: FindOptions) => {
    try {
      return await this.model.findOne(query);
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };

  public updateById = async (id: string | number, body: Model) => {
    try {
      const data = await this.model.findOne({ where: { id } });
      if (data) {
        Object.assign(data, body);
        await data.save();
      }
      return data;
    } catch (error) {
      throw new createError.BadRequest({ ...error });
    }
  };
}
