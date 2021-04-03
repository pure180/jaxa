import { DataTypes, InitOptions, Model, ModelAttributes, Sequelize } from 'sequelize';
import { ModelSettings } from '../Model/Definition';
import { capitalizeFirstLetter } from '../Utils/ModelConfig';

export interface BaseServiceProps {
  sequelize: Sequelize;
  modelName: string;
  settings: ModelSettings;
}

export class BaseService<M extends Model = Model> {
  public props: BaseServiceProps;

  constructor(props: BaseServiceProps) {
    this.props = props;
  }

  public getModelAttributes(): ModelAttributes<M> {
    const attributes: ModelAttributes = {};

    Object.keys(this.props.settings.properties).forEach((key) => {
      const { type, required, isId } = this.props.settings.properties[key];

      Object.assign(attributes, {
        [key]: {
          type: this.resolveAttributeType(type),
          allowNull: required ? false : true,
          primaryKey: isId ? true : false,
          autoIncrement: (isId && true) || false,
        },
      });
    });

    return attributes;
  }

  public initOptions(): InitOptions {
    return {
      sequelize: this.props.sequelize,
      modelName: capitalizeFirstLetter(this.props.modelName),
    };
  }

  private resolveAttributeType(type: string): ModelAttributes['type'] {
    switch (type) {
      case 'boolean':
        return DataTypes.BOOLEAN;
      case 'number':
        return DataTypes.NUMBER;
      default:
        return DataTypes.STRING;
    }
  }
}

export class Service extends Model {}

export const modelService = (props: BaseServiceProps) => {
  const baseService = new BaseService(props);

  Service.init(baseService.getModelAttributes(), baseService.initOptions());

  return Service;
};

export default BaseService;
