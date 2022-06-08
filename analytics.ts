import * as Settings from '@taqueria/protocol/Settings';
import * as TaqError from '@taqueria/protocol/TaqError';
import { attemptP, chain, chainRej, FutureInstance as Future, map, resolve } from 'fluture';
import { pipe } from 'https://deno.land/x/fun@v1.0.0/fns.ts';
import { getMachineId } from 'https://deno.land/x/machine_id@v0.3.0/mod.ts';
import { i18n } from './taqueria-protocol/taqueria-protocol-types.ts';
import type { DenoArgs } from './taqueria-types.ts';
import * as utils from './taqueria-utils/taqueria-utils.ts';

const {
	mkdir,
	doesPathExist,
	readJsonFile,
	writeJsonFile,
	taqResolve,
} = utils.inject({
	stdout: Deno.stdout,
	stderr: Deno.stderr,
});

type Consent = 'opt_in' | 'opt_out';

const consentPrompt =
	'Help improve Taqueria by sharing anonymous usage statistics in accordance with the privacy policy? [y/yes] or [n/no]';
const optInConfirmationPrompt = consentPrompt;
const optOutConfirmationPrompt = 'Are you sure you want to turn off usage statistic reporting? [y/yes] or [n/no]';
export const settingsFolder = Deno.env.get('HOME') + '/.taq-settings';
export const settingsFilePath = settingsFolder + '/taq-settings.json';
export const OPT_IN = 'opt_in';
export const OPT_OUT = 'opt_out';

export const optInAnalyticsFirstTime = () => createSettingsFileWithConsent(OPT_IN);

export const optOutAnalyticsFirstTime = () => createSettingsFileWithConsent(OPT_OUT);

const createSettingsFileWithConsent = (option: Consent) =>
	pipe(
		Settings.make({ consent: option }),
		chain(writeJsonFile(settingsFilePath)),
	);

export const optInAnalytics = () => writeConsentValueToSettings(OPT_IN);

export const optOutAnalytics = () => writeConsentValueToSettings(OPT_OUT);

const writeConsentValueToSettings = (option: Consent) => {
	const input = prompt(option === OPT_IN ? optInConfirmationPrompt : optOutConfirmationPrompt);
	if (input && /^y(es)?$/i.test(input)) {
		return pipe(
			readJsonFile<Settings.t>(settingsFilePath),
			map((settingsContent: Settings.t) => {
				settingsContent.consent = option;
				return settingsContent;
			}),
			chain(writeJsonFile(settingsFilePath)),
			map(() =>
				option === OPT_IN
					? 'You have successfully opted-in to sharing anonymous usage analytics'
					: 'You have successfully opted-out from sharing anonymous usage analytics'
			),
		);
	} else {
		return taqResolve('');
	}
};

const isCIRun = () => Deno.env.get('CI') !== undefined;

const isTestRun = () => Deno.env.get('TEST') !== undefined;

const promptForConsent = (): Future<TaqError.t, string> => {
	const input = prompt(consentPrompt);
	const option = input && /^y(es)?$/i.test(input) ? optInAnalyticsFirstTime : optOutAnalyticsFirstTime;
	return pipe(
		mkdir(settingsFolder),
		chain(() => option()),
	);
};

const allowTracking = (inputArgs: DenoArgs): Future<TaqError.t, boolean> => {
	if (
		isCIRun()
		|| isTestRun()
		|| inputArgs.includes('--version')
		|| inputArgs.includes('--build')
		|| inputArgs.includes('testFromVsCode')
	) {
		return taqResolve(false);
	}
	return pipe(
		// If path/file exists,
		// then the key 'consent' will be present because this is the 1st iteration of the settings file,
		// and the taq settings directory in home will exist as well.
		doesPathExist(settingsFilePath),
		chainRej(() => promptForConsent()),
		chain(() => readJsonFile<Settings.t>(settingsFilePath)),
		map((settings: Settings.t) => settings.consent === OPT_IN),
	);
};

export const sendEvent = (
	inputArgs: DenoArgs,
	taq_version: string,
	taq_ui: 'CLI' | 'VSCode',
	i18n: i18n.t,
): Future<TaqError.t, void> => {
	const noop = () => {};
	if (taq_ui === 'VSCode') return resolve(noop()); // Disable for VSCode for now
	return pipe(
		allowTracking(inputArgs),
		chain((allowTracking: boolean) => {
			if (!allowTracking) {
				return resolve(noop());
			}

			const measurement_id = 'G-8LSQ6J7P0Q';
			const api_secret = '3aHoMp2USE21ZPmAVTI1Lg';

			const currentTime = new Date();
			const taq_timestamp = currentTime.toDateString() + ', ' + currentTime.toTimeString();

			return pipe(
				attemptP<TaqError.t, string>(() => getMachineId()),
				chain(client_id =>
					attemptP<TaqError.t, void>(() =>
						fetch(
							`https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`,
							{
								method: 'POST',
								body: JSON.stringify({
									client_id,
									events: [{
										name: 'taq_task_executed',
										params: {
											taq_version,
											taq_ui,
											taq_timestamp,
											taq_os: Deno.build.os,
										},
									}],
								}),
							},
						)
							.then(noop)
							.catch(noop)
					)
				),
			);
		}),
	);
};
