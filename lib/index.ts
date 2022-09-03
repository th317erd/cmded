import Nife from 'nife';
import { Runner, RunnerContext } from './runner-context';
import { RootOptions } from './root-options';
import { Arguments } from './arguments';

export function defaultArgumentParser(context: RunnerContext, options: GenericObject = {}, _index: number | undefined): GenericObject | undefined {
  let doConsume = (options.consume !== false) ? true : false;
  let args = context.args;
  let index = (_index == null) ? args.currentIndex : _index;
  let arg = (doConsume) ? args.consume(index) : args.get(index);
  if (typeof arg !== 'string')
    return;

  let prefix;
  let name;
  let rawName;
  let value;
  let notConsumed = (doConsume) ? [] : [ index ];
  let indexes = [ index ];

  arg.replace(/^([\W]*)([\w-]+)(?:=(.*))?$/, (m, _prefix, _name, _value) => {
    prefix = _prefix || undefined;
    name = _name;
    value = _value || undefined;

    return m;
  });

  if (prefix && !value && options.singleton !== true) {
    arg = (doConsume) ? args.consume(index + 1) : args.get(index + 1);

    if (typeof arg === 'string') {
      if (!doConsume) {
        notConsumed.push(index + 1);
        indexes.push(index + 1);
      } else {
        indexes.push(index + 1);
      }

      value = arg;
    }
  }

  return {
    rawName: `${prefix || ''}${name}`,
    prefix,
    name,
    value,
    notConsumed,
    indexes,
  };
}

export function defaultFormatter(context: RunnerContext, name: string): string {
  return name;
}

export function CMDed(runner: Runner, _options?: RootOptions): Promise<GenericObject | undefined> | GenericObject | undefined {
  let rootOptions: RootOptions = {
    strict: false,
    argv: process.argv.slice(2),
    parser: defaultArgumentParser,
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

  let result = runner(runnerContext, {});
  if (Nife.instanceOf(result, 'promise')) {
    let promise = result as Promise<boolean>;

    return new Promise((resolve, reject) => {
      promise.then(
        (result) => {
          if (!result) {
            runnerContext.showHelp();
            resolve(undefined);
          } else {
            if (rootOptions.strict && runnerContext.args.getUnconsumed().length > 0) {
              runnerContext.showHelp();
              resolve(undefined);
              return;
            }

            resolve(runnerContext.fetch());
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  if (!result) {
    runnerContext.showHelp();
    return;
  } else {
    if (rootOptions.strict && runnerContext.args.getUnconsumed().length > 0) {
      runnerContext.showHelp();
      return;
    }
  }

  return runnerContext.fetch();
}

export * from './root-options';
export * from './runner-context';
export * as Types from './types';
