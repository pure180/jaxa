import { BelongsToManyOptions, Sequelize } from 'sequelize';
import { BaseModel } from '../Model/BaseModel';
import { ModelRelation, ModelRelationType } from '../Model/Definition';
import {
  ModelConfiguration,
  ModelAttributes,
  capitalizeFirstLetter,
  lowerCaseFirstLetter,
} from '../Utils/ModelConfiguration';
import { SQLiteSettings } from '../Utils/SQLite';
import BaseService from './BaseSequelize';

export class Sequelizer {
  public attributes: ModelAttributes;
  public sequelize: Sequelize;
  public modelConfigurations: ModelConfiguration;

  constructor() {
    this.modelConfigurations = new ModelConfiguration();
    this.attributes = this.modelConfigurations.getAttributes();

    const {
      database,
      user,
      password,
      host,
      dialect,
      storage,
    } = SQLiteSettings();

    this.sequelize = new Sequelize(database, user, password, {
      logging: false,
      host,
      dialect,
      storage,
    });
  }

  public defineModels = () => {
    Object.keys(this.attributes).forEach((key) => {
      const configuration = this.attributes[key];
      const service = new BaseService({
        modelName: capitalizeFirstLetter(configuration.definition.name),
        sequelize: this.sequelize,
        settings: this.attributes[key],
      });
      this.sequelize = service.defineModel();
    });
  };

  public defineModelRelations = () => {
    Object.keys(this.attributes).forEach((key) => {
      const { relations, definition } = this.attributes[key];
      console.log(definition);

      if (relations) {
        this.sequelizeRelationalModels(
          relations,
          capitalizeFirstLetter(definition.name),
        );
      }
    });
  };

  public async sequelizeModels() {
    try {
      await this.sequelize.authenticate();
    } catch (error) {
      throw error;
    }

    this.defineModels();

    return Object.keys(this.attributes).map((key) => {
      const configuration = this.attributes[key];
      const model = new BaseModel({
        name: capitalizeFirstLetter(configuration.definition.name),
        service: this.sequelize.models[
          capitalizeFirstLetter(configuration.definition.name)
        ],
        settings: this.attributes[key],
      });

      return model;
    });
  }

  private sequelizeRelationalModels = (
    relations: { [key: string]: ModelRelation },
    modelName: string,
  ) => {
    for (const [key, { model, type, options }] of Object.entries(relations)) {
      const settings = {
        foreignKey:
          options?.foreignKey || `${lowerCaseFirstLetter(modelName)}Id`,
        ...(options || {}),
      };

      const relationalModelName = capitalizeFirstLetter(model);
      const relationalModel = this.sequelize.models[relationalModelName];
      if (relationalModel && this.sequelize.models[modelName]) {
        switch (type) {
          case ModelRelationType.HasMany:
            this.sequelize.models[modelName].hasMany(
              relationalModel,
              settings || {},
            );
            break;
          case ModelRelationType.HasOne:
            this.sequelize.models[modelName].hasOne(
              relationalModel,
              settings || {},
            );
            break;
          case ModelRelationType.BelongsTo:
            this.sequelize.models[modelName].belongsTo(
              relationalModel,
              options || {},
            );
            break;
          case ModelRelationType.BelongsToMany:
            this.sequelize.models[modelName].belongsToMany(
              relationalModel,
              (settings as BelongsToManyOptions) || {},
            );
            break;
        }
      }
    }
  };
}

export default Sequelizer;
