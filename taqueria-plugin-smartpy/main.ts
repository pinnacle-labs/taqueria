import { SmartPyOpts, CompileOpts } from './common';

import { RequestArgs, sendAsyncErr } from '@taqueria/node-sdk';
import compile from './compile';
// import compileAll from './compileAll';
// import test from './test';

const main = (parsedArgs: RequestArgs.t): Promise<void> => {
	const unsafeArgs = parsedArgs as SmartPyOpts;
	switch (unsafeArgs.task) {
		case 'compile':
			return compile(unsafeArgs as unknown as CompileOpts);
		// case 'compile-all':
		// 	return compileAll(unsafeArgs);
		// case 'test':
		// 	return test(unsafeArgs);
		default:
			return sendAsyncErr(`${unsafeArgs.task} is not an understood task by the SmartPy plugin`);
	}
};

export default main;
