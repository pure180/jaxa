import sequelize from 'sequelize';
import { BaseModel } from '../../Model/BaseModel';
import Sequelizer from '../Sequelizer';

describe('Sequelizer should initialize without errors and create the models and it', () => {
  const sequelizer = new Sequelizer();

  it('should have the model attributes', () => {
    const attributes = sequelizer.attributes;
    expect.assertions(4);
    expect(attributes).toBeDefined();
    expect(attributes.Model).toBeDefined();
    expect(attributes.Model.definition).toBeDefined();
    expect(attributes.Model.definition.name).toBe('model');
  });

  it('should sequelize the model', async () => {
    expect.assertions(4);
    const models = await sequelizer.sequelizeModels();
    expect(models).toBeDefined();
    expect(models).toBeInstanceOf(Array);
    expect(models[0]).toBeDefined();
    expect(models[0]).toBeInstanceOf(BaseModel);
  });
});
