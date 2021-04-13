export * from './App';
export * from './Controller';
export * from './Model';
// export * from './Routes';
export * from './Sequelizer';
export * from './Service';
export * from './Swagger';
export * from './Utils';

import Server from './App';

import pkg from './Utils/PackageDefinition';

const server = new Server();

server
  .start()
  .then(() => {
    console.log(`All set up, starting "${pkg.name}" API.`);
  })
  .catch((err) => console.error(err));
