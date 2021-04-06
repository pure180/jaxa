import pkg, { PackageDefinition } from '../Utils/PackageDefinition';
import swaggerUi from 'swagger-ui-express';

import express from 'express';
import { Sequelize } from 'sequelize';
import Sequelizer from '../Sequelizer/Sequelizer';
import { capitalizeFirstLetter } from '../Utils/ModelConfiguration';
import { BaseModel } from '../Model/BaseModel';

export interface SwaggerProps {
  app: express.Application;
  models: BaseModel[];
  path?: string;
  router: express.Router;
  sequelizer: Sequelizer;
}

export class Swagger {
  private app: express.Application;
  private models: BaseModel[];
  private packageInfo: PackageDefinition = pkg;
  private path: string;
  private router: express.Router;
  private sequelizer: Sequelizer;

  constructor({ app, models, path, router, sequelizer }: SwaggerProps) {
    this.app = app;
    this.path = path || '/swagger';
    this.router = router;
    this.sequelizer = sequelizer;
    this.models = models;
  }

  public initialize = () => {
    this.app.use(this.path, swaggerUi.serve, swaggerUi.setup(this.getSetup()));
  };

  private getSetup = (): swaggerUi.JsonObject => {
    return {
      // openapi: '3.0.0',
      swagger: '2.0',
      info: {
        description: this.packageInfo.description,
        version: this.packageInfo.version,
        termsOfService: '',
        contact: {
          email: 'info@daniel-pfisterer.de',
        },
        license: {
          name: this.packageInfo.license,
          url: '',
        },
      },
      host: 'localhost',
      basePath: this.app.mountpath,
      tags: this.getTags(),
      schemes: ['https', 'http'],
      paths: this.getPaths(),
      definitions: this.getDefinitions(),
    };
  };

  private getTags = (): { [key: string]: unknown }[] => {
    const models = this.sequelizer.attributes;
    return Object.keys(models).map((key) => {
      const { name, description } = models[key].definition;
      return {
        name: capitalizeFirstLetter(name),
        description,
      };
    });
  };

  private getPaths = () => {
    const path: { [key: string]: unknown } = {};
    this.models.forEach((model) => {
      const key = `${this.app.mountpath}/${model.path}`;
      const defaultDefinition: { [key: string]: unknown } = {
        post: {
          tags: [model.name],
          summary: `Add a new ${model.name} to the store`,
          description: '',
          operationId: 'create',
          consumes: ['application/json', 'application/xml'],
          produces: ['application/json'],
          parameters: [
            {
              in: 'body',
              name: 'body',
              description: `${model.name} object that needs to be added to the store`,
              required: true,
              schema: {
                $ref: `#/definitions/${model.name.toLowerCase()}`,
              },
            },
          ],
          responses: {
            '200': {
              description: 'Successful',
              schema: {
                $ref: `#/definitions/${model.name.toLowerCase()}`,
              },
            },
            '400': {
              description: 'Bad request',
            },
            '404': {
              description: 'Not found',
            },
            '405': {
              description: 'Invalid input',
            },
          },
        },
        get: {
          tags: [model.name],
          summary: `Find ${model.path}`,
          description: '',
          operationId: 'find',
          consumes: ['application/json', 'application/xml'],
          produces: ['application/json'],
          parameters: [...this.getQueries()],
          responses: {
            '200': {
              description: 'Successful',
              schema: {
                type: 'array',
                items: {
                  $ref: `#/definitions/${model.name.toLowerCase()}`,
                },
              },
            },
            '400': {
              description: 'Bad request',
            },
            '404': {
              description: 'Not found',
            },
          },
        },
      };

      if (!(key in path)) {
        path[key] = defaultDefinition;
      } else {
        Object.assign(path[key], defaultDefinition);
      }
    });
    return path;
  };

  private getDefinitions = () => {
    const definitions: { [key: string]: unknown } = {};
    this.models.forEach((model) => {
      const properties = {};
      Object.keys(model.settings.properties).forEach((propKey) =>
        Object.assign(properties, {
          [propKey]: {
            type: model.settings.properties[propKey].type,
          },
        }),
      );

      const definition = {
        type: 'object',
        properties,
      };

      if (!(model.name in definitions)) {
        definitions[model.name.toLowerCase()] = definition;
      } else {
        Object.assign(definitions[model.name.toLowerCase()], definition);
      }
    });
    return definitions;
  };

  private getQueries = () => {
    return [
      this.queryTemplate({
        allowReserved: false,
        description: 'Maximum number of results possible',
        name: '_limit',
        required: false,
        type: 'integer',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Sort according to a specific field.',
        name: '_sort',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description:
          'Skip a specific number of entries (especially useful for pagination)',
        name: '_start',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get entries that matches exactly your input',
        name: '=',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that are not equals to something',
        name: '_ne',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get record that are lower than a value',
        name: '_lt',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that are lower than or equal to a value',
        name: '_lte',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that are greater than a value',
        name: '_gt',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that are greater than or equal a value',
        name: '_gte',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that contains a value',
        name: '_contains',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description: 'Get records that contains (case sensitive) a value',
        name: '_containss',
        required: false,
        type: 'string',
      }),
      this.queryTemplate({
        allowReserved: false,
        description:
          'Get records that matches any value in the array of values',
        name: '_in',
        required: false,
        type: 'array[string]',
      }),
      this.queryTemplate({
        allowReserved: false,
        description:
          "Get records that doesn't match any value in the array of values",
        name: '_nin',
        required: false,
        type: 'array[string]',
      }),
    ];
  };

  private queryTemplate = ({
    allowReserved,
    description,
    name,
    required,
    type,
  }: {
    allowReserved: boolean;
    description: string;
    name: string;
    required: boolean;
    type: 'integer' | 'string' | 'array[string]';
  }) => ({
    allowReserved,
    description,
    in: 'query',
    name,
    required,
    schema: { type },
  });
}
