///! DocScope: CMDed

import Nife from 'nife';
import { Runner, RunnerContext } from './runner-context';
import { RootOptions } from './root-options';
import { Arguments } from './arguments';
import { defaultParser } from './default-parser';
import { defaultFormatter } from './default-formatter';
import { GenericObject } from './common';
import * as Types from './types';

export declare type FinalResult = Promise<GenericObject | undefined> | GenericObject | undefined;

/// Invoke command line argument parsing.
///
/// The first argument is NOT a Runner, even though it has the signature
/// of one. This method is simply an entry point to start executing matchers/Runners.
///
/// The return value from this method can either be a `Promise<object | undefined>` if
/// you are running asynchronous code, or a simple `object | undefined` if you have no
/// asynchronous code. An `undefined` return value means there was a failure in parsing.
/// At this point, you should show the help via a `showHelp(help)` call, and exit your
/// application.
///
/// Interface:
///   export declare interface RootOptions {
///     // If `true`, then CMDed will fail if every argument is not consumed.
///     strict?: boolean;
///
///     // Specify the input arguments, defaults to `process.argv.slice(2)`.
///     argv?: Array<string> | null;
///
///     // Specify a custom parser for all argument parsing.
///     parser?: (context: RunnerContext, options?: object, index?: number) => object | undefined;
///
///     // Specify a "user context" property name formatter.
///     formatter?: (name: string, context?: RunnerContext) => string;
///
///     // Specify a custom "showHelp" method.
///     showHelp?: (subHelp: HelpInterface, help: HelpInterface, helpPath: string, context: RunnerContext) => void;
///
///     // Specify the "help" object for your command.
///     help?: HelpInterface | null;
///
///     // Specify the pattern of the argument that will trigger the help, default is `"--help"`.
///     helpArgPattern?: string | null;
///
///     // Specify extra types to pass through to the "Types" context variable
///     types?: {
///       [ key: string ]: Function,
///     };
///   }
///
/// Return: Promise<object | undefined> | boolean | undefined
///
/// Arguments:
///   entryMethod: ((context: RunnerContext) => Promise<boolean> | boolean)
///     Specify entry point to start executing matchers and Runners.
///   options?: RootOptions
///     Specify `rootOptions` for parsing.
export function CMDed(entryMethod: Runner, _options?: RootOptions): FinalResult {
  let rootOptions: RootOptions = {
    strict: false,
    argv: process.argv.slice(2),
    parser: defaultParser,
    formatter: defaultFormatter,
    helpArgPattern: '--help',
    ...(_options || {}),
  };

  rootOptions.types = { ...Types, ...(rootOptions.types || {}) };

  let context: GenericObject = {};
  let runnerContext = new RunnerContext({
    rootOptions,
    context,
    args: new Arguments(rootOptions.argv || []),
    runnerPath: '',
    types: rootOptions.types,
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
      let unconsumed = runnerContext.args.getUnconsumedIndexes();
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

  // Help runner
  if (rootOptions.helpArgPattern && rootOptions.help) {
    let result = runnerContext.match(rootOptions.helpArgPattern, () => {
      let unconsumedArgs = runnerContext.args.getUnconsumed();
      if (Nife.isEmpty(unconsumedArgs))
        runnerContext.showHelp('');
      else
        runnerContext.showHelp(unconsumedArgs.join('.'));

      return true;
    }, { solo: true });

    if (result)
      return;
  }

  let result = entryMethod(runnerContext, {}, {});
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
export * from './common';
export * from './default-formatter';
export * from './default-parser';
export * from './help';
export * from './root-options';
export * from './runner-context';
