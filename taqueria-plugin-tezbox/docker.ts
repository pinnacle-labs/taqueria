import { getDockerImage } from '@taqueria/node-sdk';
import { Opts } from './types';

export const TAQ_TEZBOX_IMAGE_ENV_VAR = 'TAQ_TEZBOX_IMAGE';

export const getDefaultDockerImage = (opts: Opts) => `ghcr.io/tez-capital/tezbox:tezos-v20.0-rc1.20240417`;

export const getImage = (opts: Opts) => getDockerImage(getDefaultDockerImage(opts), TAQ_TEZBOX_IMAGE_ENV_VAR);
