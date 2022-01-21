
import BigNumber from 'bignumber.js';
import { MichelsonMap } from '@taquito/taquito';
type address = string;
type BigMap<K, T> = MichelsonMap<K, T>;
type bytes = string;
type MMap<K, T> = MichelsonMap<K, T>;
type nat = string | BigNumber | number;

type Storage = {
    admin?: {
        admin: address;
        paused: boolean;
        pending_admin?: address;
    };
    sales: BigMap<{
        sale_seller: address;
        tokens: {
            token_for_sale_address: address;
            token_for_sale_token_id: nat;
            money_token_address: address;
            money_token_token_id: nat;
        };
    }, nat>;
};

type Methods = {
    confirm_admin: () => Promise<void>;
    pause: (param: boolean) => Promise<void>;
    set_admin: (param: address) => Promise<void>;
    buy: (
        sale_seller: address,
        token_for_sale_address: address,
        token_for_sale_token_id: nat,
        money_token_address: address,
        money_token_token_id: nat,
    ) => Promise<void>;
    mint: (param: Array<{
            token_metadata: {
                token_id: nat;
                token_info: MMap<string, bytes>;
            };
            owner: address;
        }>) => Promise<void>;
    sell: (
        sale_price: nat,
        token_for_sale_address: address,
        token_for_sale_token_id: nat,
        money_token_address: address,
        money_token_token_id: nat,
    ) => Promise<void>;
};

type MethodsObject = {
    confirm_admin: () => Promise<void>;
    pause: (param: boolean) => Promise<void>;
    set_admin: (param: address) => Promise<void>;
    buy: (params: {
        sale_seller: address,
        token_for_sale_address: address,
        token_for_sale_token_id: nat,
        money_token_address: address,
        money_token_token_id: nat,
    }) => Promise<void>;
    mint: (param: Array<{
            token_metadata: {
                token_id: nat;
                token_info: MMap<string, bytes>;
            };
            owner: address;
        }>) => Promise<void>;
    sell: (params: {
        sale_price: nat,
        token_for_sale_address: address,
        token_for_sale_token_id: nat,
        money_token_address: address,
        money_token_token_id: nat,
    }) => Promise<void>;
};

export type ExampleContract7ContractType = { methods: Methods, methodsObject: MethodsObject, storage: Storage, code: { __type: 'ExampleContract7Code', protocol: string, code: object[] } };
