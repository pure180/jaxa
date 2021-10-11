import { BelongsToManyOptions, Sequelize } from 'sequelize';
import {
  BaseModel,
  ModelRelation,
  ModelRelationType,
  ModelConfiguration,
  ModelAttributes,
  capitalizeFirstLetter,
  lowerCaseFirstLetter,
  SQLiteSettings,
} from '@jaexa/core';
import BaseService from './BaseSequelize';

export class Sequelizer {
  private secret?: string;

  public attributes: ModelAttributes;

  public sequelize: Sequelize;

  public modelConfigurations: ModelConfiguration;

  constructor(props?: { pathToConfig?: string; secret?: string }) {
    this.modelConfigurations = new ModelConfiguration({
      pathToConfig: props?.pathToConfig,
    });

    this.secret = props?.secret;

    this.attributes = this.modelConfigurations.getAttributes();

    const { database, user, password, host, dialect, storage } =
      SQLiteSettings();

    if (database === 'sqlite::memory:') {
      this.sequelize = new Sequelize(database, {
        logging: true,
      });
    } else {
      this.sequelize = new Sequelize(database, user, password, {
        logging: true,
        host,
        dialect,
        storage,
      });
    }
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

      if (relations) {
        this.sequelizeRelationalModels(
          relations,
          capitalizeFirstLetter(definition.name),
        );
      }
    });
  };

  public async sequelizeModels() {
    await this.sequelize.authenticate();

    this.defineModels();

    return Object.keys(this.attributes).map((key) => {
      const configuration = this.attributes[key];
      const model = new BaseModel(
        {
          name: capitalizeFirstLetter(configuration.definition.name),
          service:
            this.sequelize.models[
              capitalizeFirstLetter(configuration.definition.name)
            ],
          settings: this.attributes[key],
        },
        this.secret,
      );

      return model;
    });
  }

  private sequelizeRelationalModels = (
    relations: { [key: string]: ModelRelation },
    modelName: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, { model, type, options }] of Object.entries(relations)) {
      const settings = {
        foreignKey:
          options?.foreignKey || `${lowerCaseFirstLetter(modelName)}Id`,
        ...(options || {}),
      };

      const relationalModelName = capitalizeFirstLetter(model);
      const relationalModel = this.sequelize.models[relationalModelName];
      if (relationalModel && this.sequelize.models[modelName]) {
        // eslint-disable-next-line default-case
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
