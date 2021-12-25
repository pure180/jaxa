import YAML from 'yaml';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';

import { ModelSettings } from '@jaexa/model';
import { env } from './env';

export interface ModelConfigurationProps {
  pathToConfig?: string;
}

export type ModelAttributes = { [key: string]: ModelSettings };

export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const lowerCaseFirstLetter = (string: string) => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

export class ModelConfiguration {
  protected baseDir: string = process.cwd();

  protected pathToConfig: string;

  protected pathToDefaultConfig: string;

  constructor(props?: ModelConfigurationProps) {
    this.pathToConfig =
      props?.pathToConfig ||
      join(this.baseDir, env.JAXA_CONFIGURATION_PATH || 'config');

    this.pathToDefaultConfig = join(__dirname, '..', '..', 'config');
  }

  private getConfigFiles(pathToConfig?: string) {
    const path = pathToConfig || this.pathToConfig;
    if (!existsSync(path)) {
      return undefined;
    }

    const files = readdirSync(path);

    if (!files || files.length === 0) {
      return undefined;
    }

    return files
      .filter((file) => ['yml, yaml'].indexOf(extname(file).toLowerCase()))
      .map((file) => join(path, file));
  }

  private parseConfig(): { [key: string]: ModelSettings } | undefined {
    const defaultConfigFiles =
      this.getConfigFiles(this.pathToDefaultConfig) || [];

    const customFiles = this.getConfigFiles() || [];

    const files = customFiles.concat(defaultConfigFiles);

    const config: { [key: string]: ModelSettings } = {};

    files.forEach((file) => {
      const fileContent = readFileSync(file, 'utf8');
      const key = capitalizeFirstLetter(basename(file, extname(file)));
      Object.assign(config, {
        [key]: YAML.parse(fileContent),
      });
    });

    return config;
  }

  private validateConfig(): ModelAttributes {
    const parsedConfig = this.parseConfig();

    if (!parsedConfig) {
      return {};
    }

    // TODO Validate Configurations

    return parsedConfig;
  }

  public getAttributes(): ModelAttributes {
    return this.validateConfig();
  }
}

export default ModelConfiguration;
