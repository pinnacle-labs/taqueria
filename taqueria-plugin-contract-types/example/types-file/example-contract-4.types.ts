
import { ContractAbstractionFromContractType, WalletContractAbstractionFromContractType } from './type-utils';
import { address, BigMap, int, nat, timestamp } from './type-aliases';

export type Storage = {
    pauseable_admin?: {
        admin: address;
        paused: boolean;
        pending_admin?: address;
    };
    current_id: nat;
    max_auction_time: nat;
    max_config_to_start_time: nat;
    bid_currency: {
        fa2_address: address;
        token_id: nat;
    };
    auctions: BigMap<nat, {
        seller: address;
        current_bid: nat;
        start_time: timestamp;
        last_bid_time: timestamp;
        round_time: int;
        extend_time: int;
        asset: Array<{
            fa2_address: address;
            fa2_batch: Array<{
                token_id: nat;
                amount: nat;
            }>;
        }>;
        min_raise_percent: nat;
        min_raise: nat;
        end_time: timestamp;
        highest_bidder: address;
    }>;
};

type Methods = {
    confirm_admin: () => Promise<void>;
    pause: (param: boolean) => Promise<void>;
    set_admin: (param: address) => Promise<void>;
    bid: (
        asset_id: nat,
        bid_amount: nat,
    ) => Promise<void>;
    cancel: (param: nat) => Promise<void>;
    configure: (
        opening_price: nat,
        min_raise_percent: nat,
        min_raise: nat,
        round_time: nat,
        extend_time: nat,
        asset: Array<{
            fa2_address: address;
            fa2_batch: Array<{
                token_id: nat;
                amount: nat;
            }>;
        }>,
        start_time: timestamp,
        end_time: timestamp,
    ) => Promise<void>;
    resolve: (param: nat) => Promise<void>;
};

type MethodsObject = {
    confirm_admin: () => Promise<void>;
    pause: (param: boolean) => Promise<void>;
    set_admin: (param: address) => Promise<void>;
    bid: (params: {
        asset_id: nat,
        bid_amount: nat,
    }) => Promise<void>;
    cancel: (param: nat) => Promise<void>;
    configure: (params: {
        opening_price: nat,
        min_raise_percent: nat,
        min_raise: nat,
        round_time: nat,
        extend_time: nat,
        asset: Array<{
            fa2_address: address;
            fa2_batch: Array<{
                token_id: nat;
                amount: nat;
            }>;
        }>,
        start_time: timestamp,
        end_time: timestamp,
    }) => Promise<void>;
    resolve: (param: nat) => Promise<void>;
};

type contractTypes = { methods: Methods, methodsObject: MethodsObject, storage: Storage, code: { __type: 'ExampleContract4Code', protocol: string, code: object[] } };
export type ExampleContract4ContractType = ContractAbstractionFromContractType<contractTypes>;
export type ExampleContract4WalletType = WalletContractAbstractionFromContractType<contractTypes>;
