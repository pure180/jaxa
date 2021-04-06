import pkg from '../../package.json';

const getPackageDefinition = () => pkg;
export type PackageDefinition = ReturnType<typeof getPackageDefinition>;
export const packageDefinition = getPackageDefinition();

export default packageDefinition;
