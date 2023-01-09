import * as rxjs from 'rxjs';
import * as signalR from '../../../../signalr';
import { notNullish } from '../../GeneralHelperFunctions';
import { VsCodeHelper } from '../../helpers';
import { OutputLevels } from '../../LogHelper';
import { SandboxState } from '../CachedSandboxState';
import { getAccountsByTaqueriaConfig, getContractsByTaqueriaConfig } from '.././helpers/SandboxDataHelpers';
import {
	findAccountInTzKT,
	findContractEntrypointsInTzKT,
	findContractInTzkt,
	findOperationsInTzKT,
	TzKTAccountData,
	TzKTContractEntrypointData,
	TzKtHeadData,
	TzKTOperationData as TzKTOperationData,
} from '.././helpers/TzKTFetcher';
import { ObservableConfig } from '.././ObservableConfig';

export type SandboxTzKTAccount = TzKTAccountData & {
	address: NonNullable<TzKTAccountData['address']>;
	alias: NonNullable<TzKTAccountData['alias']>;
};

export class CachedTzKTDataProvider {
	private currentTzKtBaseAddress: string | undefined;
	private currentSandboxState: SandboxState;
	private tzktAccountsCache = new Map<string, TzKTAccountData>();
	private tzktContractsCache = new Map<string, TzKTAccountData>();
	private tzktOperationsCache = new Map<string, TzKTOperationData[]>();
	private tzktContractEntrypointsCache = new Map<string, TzKTContractEntrypointData[]>();

	readonly headFromTzKt = new rxjs.BehaviorSubject<TzKtHeadData | undefined>(undefined);
	readonly accountsFromTzKt = new rxjs.BehaviorSubject<TzKTAccountData | undefined>(undefined);
	readonly contractsFromTzKt = new rxjs.BehaviorSubject<TzKTAccountData | undefined>(undefined);
	connection: signalR.HubConnection | undefined;

	constructor(
		private readonly helper: VsCodeHelper,
		private readonly sandboxName: string,
		private readonly observableConfig: ObservableConfig,
		initialSandboxState: SandboxState,
	) {
		this.currentSandboxState = initialSandboxState;
		this.observableConfig.configObservable.subscribe(async _configInfo => await this.onConfigUpdate());
	}

	private onHeadFromTzKt(data: { type: number; data: TzKtHeadData }): void {
		this.helper.logHelper.showLog(OutputLevels.debug, 'onHeadFromTzKt ' + JSON.stringify(data));
		if (data.type === 1) {
			this.headFromTzKt.next(data.data);
		}
	}

	private onAccountsFromTzKt(data: { type: number; data: TzKTAccountData[] }): void {
		this.helper.logHelper.showLog(OutputLevels.debug, 'onAccountsFromTzKt ' + JSON.stringify(data));
		if (data.type === 1) {
			for (const account of data.data) {
				if (account.address) {
					switch (account.type) {
						case 'contract': {
							this.tzktContractsCache.set(account.address, account);
							this.contractsFromTzKt.next(account);
							this.helper.logHelper.showLog(OutputLevels.debug, 'onAccountsFromTzKt > contract ' + account.address);
							break;
						}
						case 'delegate': {
							this.tzktAccountsCache.set(account.address, account);
							this.accountsFromTzKt.next(account);
							this.helper.logHelper.showLog(OutputLevels.debug, 'onAccountsFromTzKt > delegate ' + account.address);
							break;
						}
						default: {
							this.helper.logHelper.showLog(
								OutputLevels.debug,
								'onAccountsFromTzKt > unknown account.type ' + JSON.stringify(account),
							);
							break;
						}
					}
				}
			}
		}
	}

	private async onConfigUpdate(): Promise<void> {
		const tzKtBaseAddress = this.findTzKtBaseUrl(this.sandboxName);
		if (this.currentTzKtBaseAddress === tzKtBaseAddress) {
			return;
		}

		this.helper.logHelper.showLog(
			OutputLevels.debug,
			`TzKt address changed from ${this.currentTzKtBaseAddress} to ${tzKtBaseAddress}`,
		);
		this.currentTzKtBaseAddress = tzKtBaseAddress;

		if (this.connection) {
			await this.connection.stop();
		}

		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(`${tzKtBaseAddress}/v1/events`, {
				skipNegotiation: true,
				transport: signalR.HttpTransportType.WebSockets,
			})
			.configureLogging(signalR.LogLevel.Information)
			.build();

		this.connection.onclose(async () => {
			await this.startConnection();
		});

		this.connection.on('head', payload => this.onHeadFromTzKt(payload));
		this.connection.on('accounts', payload => this.onAccountsFromTzKt(payload));
	}

	async setSandboxState(newState: SandboxState) {
		if (this.currentSandboxState === newState) {
			return;
		}
		this.currentSandboxState = newState;

		if (newState === 'running') {
			await this.startConnection();
		} else {
			this.connection?.stop();
		}
	}

	findTzKtBaseUrl(sandboxName: string): string | undefined {
		const sandbox = this.observableConfig.currentConfig.config?.config.sandbox?.[sandboxName];
		if (!sandbox || typeof sandbox === 'string') {
			return undefined;
		}
		let port = sandbox.tzkt?.apiPort ?? 5000;
		return `http://127.0.0.1:${port}`;
	}

	async startConnection() {
		if (!this.connection) {
			return;
		}

		try {
			await this.connection.start();
			await this.connection.invoke('SubscribeToHead');

			const taqueriaAccounts = getAccountsByTaqueriaConfig(this.observableConfig.currentConfig, this.sandboxName);
			const taqueriaContracts = getContractsByTaqueriaConfig(this.observableConfig.currentConfig, this.sandboxName);
			await this.connection.invoke('SubscribeToAccounts', {
				addresses: [
					...taqueriaContracts.map(contract => contract.config.address),
					...taqueriaAccounts.map(account => account.address),
				],
			});

			this.helper.logHelper.showLog(OutputLevels.debug, 'SignalR Connected');
		} catch (err) {
			this.helper.logHelper.showLog(OutputLevels.debug, 'Error while connecting SignalR');
			this.helper.logAllNestedErrors(err, true);
			setTimeout(() => {
				this.startConnection();
			}, 5000);
		}
	}

	async getAccounts(): Promise<SandboxTzKTAccount[]> {
		const tzktBaseUrl = this.findTzKtBaseUrl(this.sandboxName);
		if (!tzktBaseUrl) return [];

		const taqueriaAccounts = getAccountsByTaqueriaConfig(this.observableConfig.currentConfig, this.sandboxName);
		if (taqueriaAccounts.length === 0) return [];

		const tzktAccounts = await Promise.all(
			taqueriaAccounts.map(async account => {
				const data = this.tzktAccountsCache.get(account.address)
					?? await findAccountInTzKT(tzktBaseUrl, account.address);
				if (!data) return;

				const tzktAccount: SandboxTzKTAccount = {
					...data,
					address: data.address ?? account.address,
					alias: data.alias ?? account.alias,
				};
				this.tzktAccountsCache.set(account.address, tzktAccount);
				return tzktAccount;
			}),
		);

		return tzktAccounts.filter(notNullish) as SandboxTzKTAccount[];
	}

	async getContracts(): Promise<SandboxTzKTAccount[]> {
		const tzktBaseUrl = this.findTzKtBaseUrl(this.sandboxName);
		if (!tzktBaseUrl) return [];

		const taqueriaContracts = getContractsByTaqueriaConfig(this.observableConfig.currentConfig, this.sandboxName);
		if (taqueriaContracts.length === 0) return [];

		const tzktContracts = await Promise.all(
			taqueriaContracts
				.map(async contract => {
					const contractAddress = contract.config.address;
					const data = this.tzktContractsCache.get(contractAddress)
						?? await findContractInTzkt(tzktBaseUrl, contractAddress);
					if (!data) return;

					const tzktContract: SandboxTzKTAccount = {
						...data,
						address: data.address ?? contractAddress,
						alias: data.alias ?? contract.alias,
					};
					this.tzktAccountsCache.set(contractAddress, tzktContract);
					return tzktContract;
				}),
		);

		return tzktContracts.filter(notNullish) as SandboxTzKTAccount[];
	}

	async getContractEntrypoints(contractAddress: string): Promise<TzKTContractEntrypointData[]> {
		const tzktBaseUrl = this.findTzKtBaseUrl(this.sandboxName);
		if (!tzktBaseUrl) return [];

		const contract = this.tzktContractsCache.get(contractAddress);
		if (!contract) return [];

		const tzktEntrypoints = this.tzktContractEntrypointsCache.get(contractAddress)
			?? await findContractEntrypointsInTzKT(tzktBaseUrl, contractAddress);
		if (!tzktEntrypoints) return [];

		this.tzktContractEntrypointsCache.set(contractAddress, tzktEntrypoints);
		return tzktEntrypoints;
	}

	async getAccountOperations(accountAddress: string): Promise<TzKTOperationData[]> {
		const tzktBaseUrl = this.findTzKtBaseUrl(this.sandboxName);
		if (!tzktBaseUrl) return [];

		const contract = this.tzktContractsCache.get(accountAddress);
		const account = this.tzktAccountsCache.get(accountAddress);
		if (!contract && !account) return [];

		const tzktOperations = this.tzktOperationsCache.get(accountAddress)
			?? await findOperationsInTzKT(tzktBaseUrl, accountAddress);
		if (!tzktOperations) return [];

		this.tzktOperationsCache.set(accountAddress, tzktOperations);
		return tzktOperations;
	}
}
