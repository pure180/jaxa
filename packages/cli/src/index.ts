import minimist, { ParsedArgs } from 'minimist';
import prompt from 'prompt';

import createProject from './createProject';
import cliSelect from 'cli-select';

const pkg = require('../package.json');

export enum CliArguments {
  Project = 'project',
  Model = 'model',
}

interface ResolvedValue<T> {
  id: number | string;
  value: T;
}

interface MinimistParameter extends ParsedArgs {
  _: string[];
  h?: boolean;
  help?: boolean;
  name?: string;
  v?: boolean;
  version?: boolean;
}

export const cli = async (args: string[]) => {
  const {
    _: arg,
    h,
    help,
    name: nameObj,
    v,
    version,
  }: MinimistParameter = minimist(args.slice(2)) as MinimistParameter;

  if (v || version) {
    console.log(`${pkg.name} ${pkg.version}\n`);
    return;
  }

  if (h || help) {
    console.log('Print Help');
    return;
  }

  let command = arg && arg[0];
  let name = nameObj;

  if (!command) {
    // Should return
    let select: ResolvedValue<string>;
    try {
      select = await cliSelect({
        defaultValue: 0,
        selected: '(x)',
        unselected: '( )',
        values: ['Create a new Project', 'Create a JAXA Model'],
      });
    } catch (error) {
      throw new Error(error);
    }

    switch (select.id) {
      case 0:
        command = CliArguments.Project;
        break;
      case 1:
        command = CliArguments.Model;
        break;
    }
  }

  if (!name) {
    prompt.start();
    const schema: prompt.Schema[] = [
      {
        properties: {
          name: {
            description: `Choose a ${command} name`,
            type: 'string',
            required: true,
          },
        },
      },
    ];

    const promptResult = await prompt.get(schema);

    if (!promptResult.name) {
      throw new Error('Something went wrong');
    }

    name = promptResult.name as string;
  }

  switch (command) {
    case CliArguments.Project:
      return await createProject(name);
    case CliArguments.Model:
      return 'Model';
    default:
      prompt.start();

      const { username, email } = await prompt.get(['username', 'email']);

      console.log('  username: ' + username);
      console.log('  email: ' + email);
  }
};
