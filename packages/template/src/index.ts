import { App as Application } from '@jaexa/core';

const apiDemo = async () =>
  new Application({
    jwt: {
      secret: 'HardcoreSecret',
    },
  }).start();

apiDemo()
  .then(() => {
    // console.dir(test);
  })
  .catch((err) => console.log(err));

module.exports = apiDemo;
