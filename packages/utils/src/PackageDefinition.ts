// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json');

const getPackageDefinition = () => pkg;
export type PackageDefinition = ReturnType<typeof getPackageDefinition>;
export const packageDefinition = getPackageDefinition();

export default packageDefinition;