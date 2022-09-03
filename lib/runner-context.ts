import Nife from 'nife';
import { Arguments } from "./arguments";
import { RootOptions } from "./root-options";

export declare type RunnerResult = Promise<boolean> | boolean;
export declare type Runner = {
  (context: RunnerContext, parsedResult: GenericObject): RunnerResult;
  parserOptions?: GenericObject;
};

export declare type PatternMatcher = (context?: RunnerContext) => GenericObject | undefined;

export interface RunnerContextOptions {
  rootOptions: RootOptions;
  context: GenericObject;
  args: Arguments;
  runnerPath: string;
}

export class RunnerContext {
  declare private options: RunnerContextOptions;

  constructor(options: RunnerContextOptions) {
    this.options = options;
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
      return Nife.get(context, scope, defaultValue);
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
      let keys = Object.keys(scope);

      for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[ i ];
        let thisValue = scope[ key ];

        Nife.set(context, key, thisValue);
      }
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

    return formatter(this, name);
  }

  markConsumed = (_indexes: Array<number> | number): void => {
    let indexes = Nife.toArray(_indexes) as Array<number>;
    let args = this.args;

    for (let i = 0, il = indexes.length; i < il; i++) {
      let index = indexes[ i ];
      args.consume(index);
    }
  }

  match = (_pattern: string | RegExp | PatternMatcher, runner: Runner, options?: GenericObject): Promise<boolean> | boolean => {
    let finalResult: Promise<boolean> | boolean = false;

    const wrappedRunner = (context: RunnerContext, parsedResult: GenericObject) => {
      let runnerPath = this.runnerPath;
      if (parsedResult && parsedResult.name)
        runnerPath = (runnerPath) ? `${runnerPath}/${parsedResult.name}` : parsedResult.name;

      let newContext = this.clone({
        runnerPath,
      });

      return runner(newContext, parsedResult);
    };

    this.args.iterate(({ index, stop }) => {
      if (Nife.instanceOf(_pattern, 'string')) {
        let pattern = _pattern as string;
        let result = this.parse(
          {
            ...(runner.parserOptions || {}),
            ...(options || {}),
            consume: false,
          },
          index,
        );

        if (result && result.rawName === pattern) {
          this.markConsumed(result.notConsumed);
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
            finalResult = wrappedRunner(this, result);
            stop();
          }
        }
      } else {
        let pattern = _pattern as PatternMatcher;
        let result = pattern(this);
        if (result) {
          finalResult = wrappedRunner(this, result);
          stop();
        }
      }
    });

    return finalResult;
  }

  get $(): (_pattern: string | RegExp | PatternMatcher, runner: Runner, options?: GenericObject) => Promise<boolean> | boolean {
    return this.match;
  }

  showHelp = () => {
    let showHelpFunc = this.rootOptions.showHelp;
    let help = this.rootOptions.help;
    let subHelp = Nife.get(help, this.runnerPath, help);
    if (showHelpFunc) {
      showHelpFunc(subHelp, help, this.runnerPath);
      return;
    }

    if (subHelp)
      console.log(subHelp);
  };

  hasMatches = (): boolean => {
    return (Object.keys(this.context).length > 0);
  }
}
