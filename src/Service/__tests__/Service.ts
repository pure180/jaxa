import httpError from 'http-errors';
import { BaseModel } from '../../Model/BaseModel';
import { Sequelizer } from '../../Sequelizer/Sequelizer';
import { Service } from '../Service';

describe('Service should be initialized and a connection a database established and it', () => {
  const sequelizer = new Sequelizer();
  let models: BaseModel[] = [];

  beforeAll(async () => {
    models = await sequelizer.sequelizeModels();
    const model = models[0];
    await model.initialize({ force: true });
  });

  it('should successfully create a dataset of the model defined in the fixture with valid data', async () => {
    const service = new Service(models[0].service);
    const testData = {
      name: 'Name',
      number: 123,
      boolean: true,
      bigInt: 123456789,
    };

    const data = await service.create(testData);

    expect.assertions(3);
    expect(data).toBeDefined();
    expect(data.name).toBe(testData.name);
    expect(data.id).toBeDefined();
  });

  it('should throw an error, because of invalid data', async () => {
    const service = new Service(models[0].service);
    const testData = {
      name: 'Name',
      boolean: true,
      bigInt: 123456789,
    };

    await expect(() => service.create(testData)).rejects.toThrow();
  });

  it('should successfully get all entries', async () => {
    const service = new Service(models[0].service);
    const data = await service.find();

    expect(data).toBeDefined();
    expect(data.length).toBe(1);
  });

  // TODO - Add more Tests to check the sequelize instance.

  afterAll(async () => {
    await models[0].service.sequelize?.close();
  });
});
