export enum ModelType {
  Persisted = 'persisted',
}

export interface ModelDefinition {
  name: string;
  plural?: string;
  type?: ModelType;
}

export interface ModelProperties {
  type: string;
  required?: boolean;
  isId?: boolean;
}

export interface ModelSettings {
  definition: ModelDefinition;
  properties: { [key: string]: ModelProperties };
}
