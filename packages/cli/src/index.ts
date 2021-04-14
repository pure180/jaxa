import prompt from 'prompt';

export const cli = async (args: string[]) => {
  console.log(args);
  prompt.start();

  const { username, email } = await prompt.get(['username', 'email']);

  console.log('  username: ' + username);
  console.log('  email: ' + email);
};
