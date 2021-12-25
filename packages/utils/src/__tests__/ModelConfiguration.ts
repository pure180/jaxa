import { join } from 'path';

import { env } from '../env';

import { ModelConfiguration } from '../ModelConfiguration';

describe('Model configuration should be found and rendered correctly and it', () => {
  const modelConfigurations = new ModelConfiguration({
    pathToConfig: env.JAXA_CONFIGURATION_PATH || join(__dirname, 'fixtures'),
  });

  const attributes = modelConfigurations.getAttributes();

  it('should find the configuration fixture file with defined attributes', () => {
    expect(attributes).toBeDefined();
  });

  it('should find the model base settings', () => {
    expect(attributes.Model).toBeDefined();
  });

  it('should find the model definitions', () => {
    expect(attributes.Model.definition).toBeDefined();
  });

  it('should define a model singular / plural name and the model type', () => {
    expect(attributes.Model.definition.name).toBe('model');
    expect(attributes.Model.definition.plural).toBe('models');
    expect(attributes.Model.definition.type).toBe('persisted');
  });

  it('should define the model properties', () => {
    expect(attributes.Model.properties).toBeDefined();
  });

  // TODO - Add tests for Properties and relations
});
