import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import prompt from 'prompt';

const workingDir = process.cwd();

export const createProject = async (name?: string) => {
  if (!name) {
    return;
  }

  const projectDir = join(workingDir, name);

  if (existsSync(projectDir)) {
    return console.info('Project already exists');
  }

  try {
    await mkdirSync(projectDir);
  } catch (error) {
    throw error;
  }

  prompt.start();

  const schema: prompt.Schema = {
    properties: {
      description: {
        description: `Add a project description`,
        type: 'string',
        required: false,
      },
      keywords: {
        description: `Add some keywords`,
        type: 'array',
        required: false,
      },
      author: {
        description: `Add an author name`,
        type: 'string',
        required: false,
      },
    },
  };

  const promptResult = await prompt.get(schema as any);

  console.log(promptResult);
};

export default createProject;
