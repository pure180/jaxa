const { packageDefinition: pkg, App: Server } = require('./src');
const server = new Server();

server
  .start()
  .then(() => {
    console.log(`All set up, starting "${pkg.name}" API.`);
  })
  .catch((err: any) => console.error(err));
