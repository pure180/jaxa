import {
  BelongsToManyOptions,
  BelongsToOptions,
  HasManyOptions,
  HasOneOptions,
} from 'sequelize/types';

export enum ModelType {
  Persisted = 'persisted',
}

export interface ModelDefinition {
  description?: string;
  name: string;
  plural?: string;
  type?: ModelType;
}

export interface ModelProperty {
  isId?: boolean;
  length?: number;
  required?: boolean;
  type: string;
}

export enum ModelRelationType {
  HasOne = 'hasOne',
  BelongsTo = 'belongsTo',
  HasMany = 'hasMany',
  BelongsToMany = 'belongsToMany',
}

export interface ModelRelation {
  foreignKey?: unknown;
  model: string;
  type: ModelRelationType;
  options?:
    | HasManyOptions
    | HasOneOptions
    | BelongsToOptions
    | BelongsToManyOptions;
}

export interface ModelSettings {
  definition: ModelDefinition;
  relations?: { [key: string]: ModelRelation };
  properties: { [key: string]: ModelProperty };
}
