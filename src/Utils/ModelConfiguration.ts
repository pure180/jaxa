import YAML from 'yaml';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';

import { ModelSettings } from '../Model/Definition';
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

  constructor(props?: ModelConfigurationProps) {
    this.pathToConfig = join(
      this.baseDir,
      props?.pathToConfig || env.JAXA_CONFIGURATION_PATH || 'config',
    );
  }

  private getConfigFiles() {
    if (!existsSync(this.pathToConfig)) {
      return undefined;
    }

    const files = readdirSync(this.pathToConfig);

    if (!files || files.length === 0) {
      return undefined;
    }

    return files
      .filter((file) => ['yml, yaml'].indexOf(extname(file).toLowerCase()))
      .map((file) => join(this.pathToConfig, file));
  }

  private parseConfig(): { [key: string]: ModelSettings } | undefined {
    const files = this.getConfigFiles();

    if (!files || files.length === 0) {
      return;
    }

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
