import { FindOptions, Model, ModelCtor } from 'sequelize/types';
import createError from 'http-errors';

interface Base {
  id?: string | number;
}

export class Service<M extends Base> {
  public model?: ModelCtor<Model<M>>;

  constructor(model?: ModelCtor<Model<M>>) {
    this.model = model;
  }

  private noModelError = () => {
    throw new Error(`Service can't be initialized, properly model is missing`);
  };

  public count = async (query?: FindOptions) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.count(query);
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };

  public create = async (body: M): Promise<Model<M>> => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.create(body);
    } catch (error) {
      throw new createError.UnprocessableEntity(JSON.stringify(error));
    }
  };

  public deleteById = async (id: string | number) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.destroy({ where: { id } });
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };

  public find = async (query?: FindOptions) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.findAll(query);
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };

  public findById = async (id: number | string) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.findOne({ where: { id } });
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };

  public findOne = async (query?: FindOptions) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      return await this.model.findOne(query);
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };

  public updateById = async (id: string | number, body: M) => {
    if (!this.model) {
      return this.noModelError();
    }
    try {
      const data = await this.model.findOne({ where: { id } });
      if (data) {
        Object.assign(data, body);
        await data.save();
      }
      return data;
    } catch (error) {
      throw new createError.BadRequest(JSON.stringify(error));
    }
  };
}

export default Service;
