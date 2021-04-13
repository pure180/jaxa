import pkg, { PackageDefinition } from '../Utils/PackageDefinition';
import swaggerUi from 'swagger-ui-express';

import express from 'express';
import Sequelizer from '../Sequelizer/Sequelizer';
import { capitalizeFirstLetter } from '../Utils/ModelConfiguration';
import { BaseModel } from '../Model/BaseModel';
import { BaseController } from '../Controller';
import { OpenAPIV3 } from 'openapi-types';

export interface SwaggerProps {
  app: express.Application;
  models: BaseModel[];
  path?: string;
  sequelizer: Sequelizer;
}

export class Swagger {
  private app: express.Application;
  private models: BaseModel[];
  private packageInfo: PackageDefinition = pkg;
  private path: string;
  private sequelizer: Sequelizer;

  constructor({ app, models, path, sequelizer }: SwaggerProps) {
    this.app = app;
    this.path = path || '/swagger';
    this.sequelizer = sequelizer;
    this.models = models;
  }

  public initialize = () => {
    this.app.use(this.path, swaggerUi.serve, swaggerUi.setup(this.getSetup()));
  };

  private getComponents = (): OpenAPIV3.ComponentsObject => ({
    schemas: this.getSchemas(),
  });

  private getSetup = (): OpenAPIV3.Document => ({
    openapi: '3.0.0',
    // swagger: '2.0',
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
      title: this.packageInfo.name,
    },
    servers: [
      {
        url: '{protocol}://localhost:{port}{basePath}', // TODO - User real data
        description: 'Local development Server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http',
          },
          basePath: {
            default: this.app.mountpath.toString(),
          },
          port: {
            enum: ['80', '443'],
            default: '1337',
          },
        },
      },
    ],
    // basePath: this.app.mountpath,
    tags: this.getTags(),
    // schemes: ['https', 'http'],
    paths: this.getPaths(),
    components: this.getComponents(),
  });

  private getTags = (): OpenAPIV3.TagObject[] => {
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
    const paths: { [key: string]: any } = {};
    this.models.forEach((model) => {
      const routes = model.baseRoutes();
      routes.forEach((baseRoute) => {
        const route =
          baseRoute.route.length > 0 && /\/\:/.test(baseRoute.route)
            ? `/{${baseRoute.route.replace('/:', '')}}`
            : (baseRoute.route.length > 1 && baseRoute.route) || '';

        const key = `/${model.path}${route}`;
        const handler = baseRoute.handler;

        if (!(key in paths)) {
          paths[key] = {};
        }

        paths[key][handler] = {
          tags: [model.name],
          summary: '', // TODO - Add Summary
          operationId: baseRoute.method,
          consumes: ['application/json', 'application/xml'],
          produces: ['application/json'],
          parameters: this.getParameters(baseRoute.method, model.name), // TODO - Add parameters
          responses: this.getResponses(baseRoute.method, model.name),
        };
      });
    });

    return paths;
  };

  private getParameters = (method: keyof BaseController, modelName: string) => {
    const parameters: { [key: string]: any }[] = [];
    switch (method) {
      case 'findById':
      case 'deleteById':
      case 'updateById':
        parameters.push({
          in: 'path',
          name: 'id',
          required: true,
          type: 'string',
        });

      case 'create':
        if (method !== 'deleteById' && method !== 'findById') {
          parameters.push({
            in: 'body',
            name: 'body',
            description: `${modelName} object that needs to be added to the store`,
            required: true,
            schema: {
              $ref: `#/components/schemas/${modelName}`,
            },
          });
        }
        break;
      case 'count':
      case 'findAll':
        parameters.push(...this.getQueries());
        break;
    }

    return parameters;
  };

  private getResponses = (method: keyof BaseController, modelName: string) => {
    const responses: { [key: number]: any } = {};
    switch (method) {
      case 'create':
      case 'updateById':
      case 'findById':
      case 'findAll':
        Object.assign(responses, {
          200: {
            description: 'Successful',
            content: {
              'application/json': {
                schema:
                  method === 'findAll'
                    ? {
                        type: 'array',
                        items: {
                          $ref: `#/components/schemas/${modelName}`,
                        },
                      }
                    : {
                        type: 'object',
                        $ref: `#/components/schemas/${modelName}`,
                      },
              },
            },
          },
        });
        break;
      default:
        break;
    }

    return Object.assign(responses, {
      400: {
        description: 'Bad request',
      },
      404: {
        description: 'Not found',
      },
    });
  };

  private getSchemas = () => {
    const schemas: OpenAPIV3.ComponentsObject['schemas'] = {};

    this.models.forEach((model) => {
      const sequelizeModel = this.sequelizer.sequelize.models[model.name];
      const properties: OpenAPIV3.BaseSchemaObject['properties'] = {};

      Object.keys(sequelizeModel.rawAttributes).forEach((key) => {
        const rawAttribute = sequelizeModel.rawAttributes[key];
        const fieldName = rawAttribute.field || key;
        if (!(fieldName in properties)) {
          const type = this.getDataType(rawAttribute.type.toString({}));

          properties[fieldName] = {
            ...(type || {}),
            nullable: rawAttribute.allowNull,
          };
        }
      });

      const associations = sequelizeModel.associations;

      Object.keys(associations).forEach((associationKey) => {
        const association = associations[associationKey];
        const associationType = association.associationType;
        const isArray =
          associationType === 'HasMany' || associationType === 'BelongsToMany'
            ? true
            : false;
        const associationName = capitalizeFirstLetter(
          (association as any).options.name.singular,
        );
        const as = isArray
          ? (association as any).options.name.plural
          : (association as any).options.name.singular;

        // if (isArray) {
        //   properties[association.foreignKey] = {
        //     $ref: `#/components/schemas/${associationName}/${association.source.primaryKeyAttribute}`,
        //   };
        // }
        properties[as] = isArray
          ? {
              items: { $ref: `#/components/schemas/${associationName}` },
              type: 'array',
            }
          : {
              $ref: `#/components/schemas/${associationName}`,
            };
      });

      const schema: OpenAPIV3.NonArraySchemaObject = {
        type: 'object',
        properties,
      };

      if (!(model.name in schemas)) {
        schemas[model.name] = schema;
      } else {
        Object.assign(schemas[model.name], schema);
      }
    });

    return schemas;
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

  private getDataType = (
    type: string,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined => {
    const match = type.match(/(\D*)\((\d*)\)|(\D*)/);
    if (!match) {
      return undefined;
    }

    const definition = match[1] || match[0];
    const maxLength = (match[2] && Number(match[2])) || undefined;

    if (!definition) {
      return undefined;
    }

    switch (definition) {
      case 'TEXT':
      case 'CITETEXT':
      case 'VARCHAR':
        return {
          type: 'string',
          maxLength,
        };
      case 'BIGINT':
      case 'INTEGER':
        return {
          type: 'integer',
          maxLength,
        };
      case 'DATE':
      case 'DATEONLY':
      case 'DATETIME':
        return {
          type: 'string',
          format: 'date-time',
        };
      default:
        return undefined;
    }
  };
}

export default Swagger;
