/* eslint-disable import/no-dynamic-require */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`);

export const getPackageDefinition = () => pkg;
export type PackageDefinition = ReturnType<typeof getPackageDefinition>;
export const packageDefinition = getPackageDefinition();

export default packageDefinition;
