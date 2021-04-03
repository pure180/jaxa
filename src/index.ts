import Server from './App';

const pkg = require('../package.json');

const server = new Server();

server
  .start()
  .then(() => {
    console.log(`Starting ${pkg.name} is starting.`);
  })
  .catch((err) => console.error(err));
