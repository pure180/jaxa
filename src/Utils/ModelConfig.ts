import YAML from 'yaml';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { ModelSettings } from '../Model/Definition';

export interface ModelConfigProps {
  pathToConfig?: string;
}

export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export class ModelConfig {
  protected baseDir: string = process.cwd();
  protected pathToConfig: string;

  constructor(props?: ModelConfigProps) {
    this.pathToConfig = join(this.baseDir, props?.pathToConfig || 'config');
  }

  private getConfigFiles() {
    if (!existsSync(this.pathToConfig)) {
      return undefined;
    }

    const files = readdirSync(this.pathToConfig);

    if (!files || files.length === 0) {
      return undefined;
    }

    return files.filter((file) => ['yml, yaml'].indexOf(extname(file).toLowerCase())).map((file) => join(this.pathToConfig, file));
  }

  private parseConfig() {
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

  private validateConfig(): { [key: string]: ModelSettings } {
    const parsedConfig = this.parseConfig();

    if (!parsedConfig) {
      return {};
    }

    // TODO Validate Configurations

    return parsedConfig;
  }

  public getModelConfigurations() {
    return this.validateConfig();
  }
}

export default ModelConfig;
