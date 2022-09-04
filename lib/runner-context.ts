import Nife from 'nife';
import { Arguments } from "./arguments";
import { GenericObject } from './common';
import { showHelp } from './help';
import { RootOptions } from "./root-options";

export declare type RunnerResult = Promise<boolean> | boolean;
export declare type Runner = {
  (context: RunnerContext, parsedResult: GenericObject): RunnerResult;
  parserOptions?: GenericObject;
  wrapper?: boolean;
};

export declare type PatternMatcher = (context: RunnerContext, options: GenericObject, index: number) => GenericObject | undefined;

export interface RunnerContextOptions {
  rootOptions: RootOptions;
  context: GenericObject;
  args: Arguments;
  runnerPath: string;
}

export class RunnerContext {
  declare private options: RunnerContextOptions;
  declare private matchCount: number;

  constructor(options: RunnerContextOptions) {
    this.options = options;
    this.matchCount = 0;
  }

  get rootOptions(): RootOptions {
    return this.options.rootOptions;
  }

  get args(): Arguments {
    return this.options.args;
  }

  get context(): GenericObject {
    return this.options.context;
  }

  get runnerPath(): string {
    return this.options.runnerPath;
  }

  clone = (options?: {
    rootOptions?: RootOptions;
    context?: GenericObject;
    args?: Arguments;
    runnerPath?: string;
  }): RunnerContext => {
    return new RunnerContext({
      rootOptions: this.rootOptions,
      context: this.context,
      args: this.args,
      runnerPath: this.runnerPath,
      ...(options || {}),
    });
  }

  fetch = (_scope?: GenericObject | string, defaultValue?: any): any => {
    let context = this.context;
    if (_scope == null)
      return context;

    if (Nife.instanceOf(_scope, 'string')) {
      let scope = _scope as string;
      let value = Nife.get(context, scope);
      if (value === undefined)
        value = defaultValue;

      return value;
    } else {
      let scope = _scope as GenericObject;
      let keys = Object.keys(scope);
      let result: GenericObject = {};

      for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[ i ];
        let thisDefaultValue = scope[ key ];

        let value = Nife.get(context, key);
        if (value === undefined)
          value = thisDefaultValue;

        let keysParts = key
          .replace(/[\[\]]/g, '.') // Replace square brackets with '.'
          .replace(/[^\w\d.]/g, '') // Replace any non-word, non-digit, non-'.' with nothing
          .replace(/\.+/g, '.') // Combine multiple consecutive '.' into one '.'
          .replace(/^[^\w\d]+/g, '') // Strip any non-word non-digits from the beginning
          .replace(/[^\w\d]+$/g, '') // Strip any non-word non-digits from the end
          .split(/\./g); // Split by '.'

        // Take the last part
        let sanitizedKey = keysParts[ keysParts.length - 1 ];

        result[ sanitizedKey ] = value;
      }

      return result;
    }
  }

  store = (_scope: GenericObject | string, value?: any): void => {
    let context = this.context;

    if (Nife.instanceOf(_scope, 'string')) {
      let scope = _scope as string;
      Nife.set(context, scope, value);
    } else {
      let scope = _scope as GenericObject;
      if (!scope)
        return;

      Nife.extend(true, context, scope);
    }
  }

  scope = (name: string, runner: Runner): Promise<boolean> | boolean => {
    let context = this.context;
    let subScope: GenericObject = context[ name ] = {};

    Object.defineProperties(subScope, {
      '_super': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: context,
      },
    });

    let subContext = this.clone({
      context: subScope,
    });

    return runner(subContext, {});
  }

  parse = (options?: GenericObject, index?: number): GenericObject | undefined => {
    let parser = this.rootOptions.parser;
    if (!parser)
      throw new Error('RunnerContext:parse: "parser" not defined, but is required.');

    return parser(this, options, index);
  }

  formatName = (name: string): string => {
    let formatter = this.rootOptions.formatter;
    if (!formatter)
      throw new Error('RunnerContext:formatName: "formatter" not defined, but is required.');

    return formatter(name, this);
  }

  markConsumed = (_indexes: Array<number> | number): void => {
    let indexes = Nife.toArray(_indexes) as Array<number>;
    let args = this.args;

    for (let i = 0, il = indexes.length; i < il; i++) {
      let index = indexes[ i ];
      args.consume(index);
    }
  }

  match = (
    _pattern: string | RegExp | PatternMatcher | null | undefined,
    runner: Runner,
    options?: GenericObject,
  ): Promise<boolean> | boolean => {
    let finalResult: Promise<boolean> | boolean = false;

    const wrappedRunner = (context: RunnerContext, parsedResult: GenericObject) => {
      let runnerPath = this.runnerPath;
      if (parsedResult && parsedResult.name)
        runnerPath = (runnerPath) ? `${runnerPath}.${parsedResult.name}` : parsedResult.name;

      let newContext = this.clone({
        runnerPath,
      });

      let _runner = runner;
      if (typeof runner === 'function' && runner.wrapper) {
        // "wrapper" is set to true when the runner
        // should be called to provide options. If
        // the user forgot to call it, then "wrapper"
        // will be `true`. So let's call it now, providing
        // no options.

        // @ts-ignore
        _runner = runner();
      }

      let runnerResult = _runner(newContext, parsedResult);
      if (Nife.instanceOf(runnerResult, 'promise')) {
        (runnerResult as Promise<boolean>).then((result) => {
          if (result)
            this.matchCount++;
        });
      } else if (runnerResult) {
        this.matchCount++;
      }

      return runnerResult;
    };

    this.args.iterate(({ index, stop }) => {
      if (_pattern == null || Nife.instanceOf(_pattern, 'string')) {
        let pattern = _pattern as string;
        if (!pattern && !(options && options.name))
          throw new Error('RunnerContext::match: "name" option must be supplied if you have specified a "null" pattern.');

        let parserOptions: GenericObject = {
          ...(runner.parserOptions || {}),
          ...(options || {}),
          consume: false,
          pattern,
        };

        if (!pattern)
          parserOptions.solo = true;

        let result = this.parse(
          parserOptions,
          index,
        );

        if (result && (!pattern || (pattern && result.rawName === pattern))) {
          this.markConsumed(result.notConsumed);

          result.notConsumed = [];

          if (options && typeof options.formatParsedResult === 'function') {
            // @ts-ignore
            result = options.formatParsedResult(result, this, options) as GenericObject;
          }

          finalResult = wrappedRunner(this, result);

          stop();
        }
      } else if (Nife.instanceOf(_pattern, RegExp)) {
        let pattern = _pattern as RegExp;
        let arg = this.args.get();
        if (typeof arg === 'string') {
          let result = arg.match(pattern);
          if (result) {
            this.markConsumed(this.args.currentIndex);

            if (options && typeof options.formatParsedResult === 'function') {
              // @ts-ignore
              result = options.formatParsedResult(result, this, options) as GenericObject;
            }

            // @ts-ignore
            finalResult = wrappedRunner(this, result);

            stop();
          }
        }
      } else {
        let pattern = _pattern as PatternMatcher;
        let result = pattern(this, options || {}, index);
        if (result) {
          if (options && typeof options.formatParsedResult === 'function') {
            // @ts-ignore
            result = options.formatParsedResult(result, this, options) as GenericObject;
          }

          finalResult = wrappedRunner(this, result);
          stop();
        }
      }
    });

    return finalResult;
  }

  get $(): (_pattern: string | RegExp | PatternMatcher | null | undefined, runner: Runner, options?: GenericObject) => Promise<boolean> | boolean {
    return this.match;
  }

  showHelp = (_path?: string) => {
    let showHelpFunc = this.rootOptions.showHelp;
    let help = this.rootOptions.help || {};
    let path = (_path != null) ? _path : this.runnerPath;

    let subHelp = (path) ? Nife.get(help, path, help) : help;
    if (showHelpFunc) {
      showHelpFunc(subHelp, help, path, this);
      return;
    }

    if (subHelp)
      showHelp(subHelp, help, path, this);
  };

  hasMatches = (): boolean => {
    return (this.matchCount > 0);
  }

  exit = (statusCode: number): void => {
    process.exit(statusCode);
  }
}
