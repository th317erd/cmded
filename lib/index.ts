import Nife from 'nife';
import { Runner, RunnerContext } from './runner-context';
import { RootOptions } from './root-options';
import { Arguments } from './arguments';
import { defaultParser } from './default-parser';
import { defaultFormatter } from './default-formatter';

export declare type FinalResult = Promise<GenericObject | undefined> | GenericObject | undefined;

export function CMDed(runner: Runner, _options?: RootOptions): FinalResult {
  let rootOptions: RootOptions = {
    strict: false,
    argv: process.argv.slice(2),
    parser: defaultParser,
    formatter: defaultFormatter,
    ...(_options || {}),
  };

  let context: GenericObject = {};
  let runnerContext = new RunnerContext({
    rootOptions,
    context,
    args: new Arguments(rootOptions.argv || []),
    runnerPath: '',
  });

  Object.defineProperties(context, {
    '_runnerContext': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: runnerContext,
    },
  });

  const finalizeResult = (result: boolean, resolve?: (value: any) => void, reject?: (value: any) => void): FinalResult => {
    if (!result) {
      runnerContext.showHelp();

      if (typeof resolve === 'function')
        resolve(undefined);

      return;
    } else {
      let unconsumed = runnerContext.args.getUnconsumed();
      if (rootOptions.strict && unconsumed.length > 0) {
        runnerContext.showHelp();

        if (typeof resolve === 'function')
          resolve(undefined);

        return;
      }

      let remaining = unconsumed.map((index) => runnerContext.args.get(index));
      if (!Object.prototype.hasOwnProperty.call(runnerContext.context, '_remaining')) {
        Object.defineProperties(runnerContext.context, {
          '_remaining': {
            writable: true,
            enumerable: false,
            configurable: true,
            value: remaining,
          },
        });
      }

      let finalContext = runnerContext.fetch();
      if (typeof resolve === 'function')
        resolve(finalContext);

      return finalContext;
    }
  };

  let result = runner(runnerContext, {});
  if (Nife.instanceOf(result, 'promise')) {
    let promise = result as Promise<boolean>;

    return new Promise((resolve, reject) => {
      promise.then(
        (result) => {
          finalizeResult(result as boolean, resolve, reject);
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  return finalizeResult(result as boolean);
}

export * as Types from './types';
export * from './arguments';
export * from './default-formatter';
export * from './default-parser';
export * from './root-options';
export * from './runner-context';
