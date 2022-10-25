import { getCurrentEnvironmentConfig, sendAsyncErr, sendJsonRes, sendWarn } from '@taqueria/node-sdk';
import {
	generateAccountKeys,
	getDeclaredAccounts,
	getInstantiatedAccounts,
	getNetworkWithChecks,
	InstantiateAccountOpts as Opts,
} from './common';

const instantiate_account = async (parsedArgs: Opts): Promise<void> => {
	const env = getCurrentEnvironmentConfig(parsedArgs);
	if (!env) return sendAsyncErr(`There is no environment called ${parsedArgs.env} in your config.json.`);
	try {
		const networkConfig = await getNetworkWithChecks(parsedArgs, env);
		const declaredAccountNames = Object.keys(getDeclaredAccounts(parsedArgs));
		const instantiatedAccountNames = getInstantiatedAccounts(networkConfig).map(instantiatedAccounts =>
			instantiatedAccounts[0]
		);
		let accountsInstantiated = [];
		for (const declaredAccountName of declaredAccountNames) {
			if (!instantiatedAccountNames.includes(declaredAccountName)) {
				await generateAccountKeys(parsedArgs, networkConfig, declaredAccountName);
				accountsInstantiated.push(declaredAccountName);
			} else {
				sendWarn(
					`Note: ${declaredAccountName} is already instantiated in the current environment, "${parsedArgs.env}".`,
				);
			}
		}
		if (accountsInstantiated.length !== 0) {
			return sendJsonRes(
				`Accounts instantiated: ${
					accountsInstantiated.join(', ')
				}.\nPlease execute "taq fund" targeting the same environment to fund these accounts.`,
			);
		}
	} catch {
		return sendAsyncErr('No operations performed.');
	}
};

export default instantiate_account;
