
import { ContractAbstractionFromContractType, WalletContractAbstractionFromContractType } from '../type-utils';
import { int, unit } from '../type-aliases';

export type Storage = int;

type Methods = {
    decrement: (param: int) => Promise<void>;
    increment: (param: int) => Promise<void>;
    reset: () => Promise<void>;
};

export type DecrementParams = int
export type IncrementParams = int
export type ResetParams = unit

type MethodsObject = {
    decrement: (param: int) => Promise<void>;
    increment: (param: int) => Promise<void>;
    reset: () => Promise<void>;
};

type contractTypes = { methods: Methods, methodsObject: MethodsObject, storage: Storage, code: { __type: 'SubdirExampleContract0Code', protocol: string, code: object[] } };
export type SubdirExampleContract0ContractType = ContractAbstractionFromContractType<contractTypes>;
export type SubdirExampleContract0WalletType = WalletContractAbstractionFromContractType<contractTypes>;
