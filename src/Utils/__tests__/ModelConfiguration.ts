import { ModelConfiguration } from '../ModelConfiguration';
import path from 'path';

describe('Model configuration should be found and rendered correctly and it', () => {
  const modelConfigurations = new ModelConfiguration({
    pathToConfig: path.join('src', 'Utils', '__tests__', 'fixtures'),
  });

  const attributes = modelConfigurations.getAttributes();

  it('should find the configuration fixture file with defined attributes', () => {
    expect(attributes).toBeDefined();
  });

  it('should find the model base definition', () => {
    expect(attributes.Model).toBeDefined();
  });

  it('should find the Model definition', () => {
    expect(attributes.Model.definition).toBeDefined();
  });

  it('should define a model singular / plural name and the model type', () => {
    expect(attributes.Model.definition.name).toBe('model');
    expect(attributes.Model.definition.plural).toBe('models');
    expect(attributes.Model.definition.type).toBe('persisted');
  });

  it('should define model properties', () => {
    expect(attributes.Model.properties).toBeDefined();
  });
});
