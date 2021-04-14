import { BaseController } from './BaseController';

const baseController = () => new BaseController();

type BaseControllerKeys = ReturnType<typeof baseController>;

export type BaseControllerMethods = Omit<
  Omit<BaseControllerKeys, 'service'>,
  'noServiceError'
>;

export type KeysOfBaseController = keyof BaseControllerMethods;
