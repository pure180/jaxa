import { App as Application } from '@jaexa/core';

const apiDemo = async () => {
  const server = new Application({
    jwt: {
      secret: 'HardcoreSecret',
    },
  });
  // console.log(server);
  return server.start();
};

apiDemo()
  .then(() => {
    // console.dir(test);
  })
  .catch((err) => console.log(err));

module.exports = apiDemo;
