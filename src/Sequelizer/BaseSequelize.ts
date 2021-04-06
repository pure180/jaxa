import {
  DataTypes,
  InitOptions,
  Model,
  ModelAttributes,
  Sequelize,
} from 'sequelize';

import {
  ModelDefinition,
  ModelProperty,
  ModelSettings,
} from '../Model/Definition';
import { capitalizeFirstLetter } from '../Utils/ModelConfiguration';

export interface BaseSequelizeProps {
  sequelize: Sequelize;
  modelName: string;
  settings: ModelSettings;
}

export class BaseSequelize<M extends Model = Model> {
  private name: string;
  private props: BaseSequelizeProps;
  private sequelize: Sequelize;

  constructor(props: BaseSequelizeProps) {
    this.name = capitalizeFirstLetter(props.modelName);
    this.props = props;
    this.sequelize = props.sequelize;
  }

  public getModelAttributes(): ModelAttributes<M> {
    const attributes: ModelAttributes = {};

    Object.keys(this.props.settings.properties).forEach((key) => {
      const { type, required, isId, length } = this.props.settings.properties[
        key
      ];
      Object.assign(attributes, {
        [key]: {
          type: this.resolveAttributeType(type, length),
          allowNull: required ? false : true,
          primaryKey: isId ? true : false,
          autoIncrement: (isId && true) || false,
        },
      });
    });

    return attributes;
  }

  public getSequelizeOptions(): InitOptions {
    return {
      sequelize: this.props.sequelize,
      modelName: capitalizeFirstLetter(this.props.modelName),
    };
  }

  private resolveAttributeType(
    type: ModelProperty['type'],
    length?: ModelProperty['length'],
  ): ModelAttributes['type'] {
    switch (type.toLowerCase()) {
      case 'boolean':
        return DataTypes.BOOLEAN;
      case 'number':
        return DataTypes.NUMBER;
      case 'string':
        if (typeof length === 'number') {
          return DataTypes.STRING(length);
        }
        return DataTypes.STRING(length);
      default:
        return DataTypes.STRING;
    }
  }

  public defineModel = () => {
    const attributes = this.getModelAttributes();
    const options = this.getSequelizeOptions();
    this.sequelize.define(this.name, attributes, options);

    return this.sequelize;
  };
}

export default BaseSequelize;
