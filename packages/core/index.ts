const { packageDefinition: pkg, App: Server } = require('./src');
const { createHmac, randomUUID } = require('crypto');
const secret = createHmac('sha256', randomUUID()).digest('HEX');

const server = new Server({
  jwt: {
    secret,
  }
});

server
  .start()
  .then(() => {
    console.log(`All set up, starting "${pkg.name}" API.`);
  })
  .catch((err: any) => console.error(err));
