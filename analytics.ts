import * as Settings from '@taqueria/protocol/Settings';
import * as TaqError from '@taqueria/protocol/TaqError';
import { attemptP, chain, chainRej, FutureInstance as Future, map, mapRej, resolve } from 'fluture';
import { pipe } from 'https://deno.land/x/fun@v1.0.0/fns.ts';
import { getMachineId } from 'https://deno.land/x/machine_id@v0.3.0/mod.ts';
import type { UsageAnalyticsDeps } from './taqueria-types.ts';
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
	'Help improve Taqueria by sharing anonymous usage statistics in accordance with the privacy policy? (Y/n)';
const optInConfirmationPrompt = consentPrompt;
const optOutConfirmationPrompt = 'Are you sure you want to turn off usage statistic reporting? (Y/n)';

const OPT_IN = 'opt_in';
const OPT_OUT = 'opt_out';

export const inject = (deps: UsageAnalyticsDeps) => {
	const { env, inputArgs, build } = deps;

	const settingsFolder = env.get('HOME') + '/.taq-settings';
	const settingsFilePath = settingsFolder + '/taq-settings.json';

	const didUserChooseYes = (input: string | null) => input === null || /^y(es)?$/i.test(input);

	const optInAnalyticsFirstTime = () => createSettingsFileWithConsent(OPT_IN);
	const optOutAnalyticsFirstTime = () => createSettingsFileWithConsent(OPT_OUT);
	const createSettingsFileWithConsent = (option: Consent) =>
		pipe(
			Settings.make({ consent: option }),
			chain(writeJsonFile(settingsFilePath)),
		);

	const optInAnalytics = () => writeConsentValueToSettings(OPT_IN);
	const optOutAnalytics = () => writeConsentValueToSettings(OPT_OUT);
	const writeConsentValueToSettings = (option: Consent) =>
		pipe(
			doesPathExist(settingsFilePath),
			chain(() => {
				const input = prompt(option === OPT_IN ? optInConfirmationPrompt : optOutConfirmationPrompt);
				if (didUserChooseYes(input)) {
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
			}),
			mapRej(previous =>
				TaqError.create({
					kind: 'E_OPT_IN_WARNING',
					msg: option === OPT_IN
						? 'The command "taq opt-in" is ignored as this might be the first time running Taqueria...'
						: 'The command "taq opt-out" is ignored as this might be the first time running Taqueria...',
					previous,
					context: option,
				})
			),
		);

	const isCIRun = () => env.get('CI') !== undefined;

	const isTestRun = () => env.get('TEST') !== undefined;

	const promptForConsent = (): Future<TaqError.t, string> => {
		const input = prompt(consentPrompt);
		const consentOption = didUserChooseYes(input) ? optInAnalyticsFirstTime : optOutAnalyticsFirstTime;
		return pipe(
			mkdir(settingsFolder),
			chain(() => consentOption()),
		);
	};

	const allowTracking = (): Future<TaqError.t, boolean> => {
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

	// No-operation
	// noop: () -> void
	const noop = () => {};

	const sendEvent = (
		taq_args: string,
		taq_version: string,
		taqError: boolean,
	): Future<TaqError.t, void> => {
		const taq_ui = inputArgs.includes('--fromVsCode') ? 'VSCode' : 'CLI';
		if (taq_ui === 'VSCode') return resolve(noop()); // Disable for VSCode for now
		return pipe(
			allowTracking(),
			chain((allowTracking: boolean) => {
				if (!allowTracking) {
					return resolve(noop());
				}

				const measurement_id = 'G-8LSQ6J7P0Q';
				const api_secret = Deno.env.get('GOOGLE_ANALYTICS_TOKEN');

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
												taq_os: build.os,
												taq_args,
												taq_error: taqError === true ? 'yes' : 'no',
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

	return {
		optInAnalytics,
		optOutAnalytics,
		sendEvent,
	};
};
