import Nife from 'nife';
import { Arguments } from "./arguments";
import { GenericObject } from './common';
import { showHelp } from './help';
import { RootOptions } from "./root-options";

export declare type RunnerResult = Promise<boolean> | boolean;
export declare type Runner = {
  (context: RunnerContext, parsedResult: GenericObject, options: GenericObject): RunnerResult;
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

/// A RunnerContext instance is passed as the first argument
/// to all Runners. It assists with argument pattern matching,
/// exiting the program, showing the help, parsing, etc...
export class RunnerContext {
  declare private options: RunnerContextOptions;
  declare private matchCount: number;

  /// Construct a new RunnerContext
  ///
  /// Interface:
  ///   export interface RunnerContextOptions {
  ///     rootOptions: RootOptions; // The root options supplied to CMDed
  ///     context: object; // The user context where parsed argument values are being collected
  ///     args: Arguments; // The arguments provided to the command
  ///     runnerPath: string; // The path of the current Runner in "dot" notation, i.e. "some.path.for.a.runner"
  ///   }
  ///
  /// Arguments:
  ///   options: RunnerContextOptions
  ///     Options for the RunnerContext.
  constructor(options: RunnerContextOptions) {
    this.options = options;
    this.matchCount = 0;
  }

  /// The <see>RootOptions</see> provided to CMDed
  get rootOptions(): RootOptions {
    return this.options.rootOptions;
  }

  /// The <see>Arguments</see> provided to CMDed.
  /// By default the arguments will be `process.argv.slice(2)`.
  /// The <see>Arguments</see> interface is a simple wrapper
  /// around the provided arguments that tracks which arguments
  /// have been "consumed".
  get args(): Arguments {
    return this.options.args;
  }

  /// Get the "user context" where parsed
  /// argument values are being collected.
  /// This is where data is stored or fetched
  /// when you make a call to <see>RunnerContext.store</see>
  /// or <see>RunnerContext.fetch</see>.
  get context(): GenericObject {
    return this.options.context;
  }

  /// The current Runner path. This is
  /// updated every time a Runner is invoked.
  /// It will be added onto, using the name
  /// of the Runner. For example, if you have
  /// an argument matcher matching against
  /// `--name`, and this is the first argument
  /// at the "root" level, then this path will
  /// be `"name"`. If however you have a sub command
  /// named `sub-commend`, and its Runner is invoked,
  /// and then inside the sub-command Runner you parse
  /// the argument `--name`, then the path inside the
  /// "name" Runner inside the sub-command would be
  /// "sub-command.name".
  ///
  /// The entire idea behind `runnerPath` is only to
  /// assist CMDed (or the user) in finding the correct and
  /// current "path" to show the proper `help` for
  /// the given command or sub-command being parsed.
  /// For example, if you invoked <see>RunnerContext.showHelp</see>
  /// inside the `sub-command` Runner, then the help system would
  /// look for `help['sub-command']` to display the help.
  get runnerPath(): string {
    return this.options.runnerPath;
  }

  /// Clone this RunnerContext, optionally
  /// providing "option" overrides for the clone.
  ///
  /// Return: RunnerContext
  ///   A new instance of RunnerContext, cloned from
  ///   the instance this method was called upon.
  /// Arguments:
  ///   options: RunnerContextOptions
  ///     Any optional options to override. None need to be supplied.
  ///     Any property that isn't supplied will just be inherited
  ///     from the current RunnerContext that is being cloned.
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

  /// Fetch one or more properties from the "user context".
  /// The "user context" is <see>RunnerContext.context</see>,
  /// and is the current context object where parsed argument
  /// values are stored. The "user context" is also what is
  /// returned by <see>CMDed.CMDed</see>.
  ///
  /// Fetch has a few different call patterns. First, it can
  /// fetch a single property by name. For example, you could
  /// call it like so: `let myValue = fetch('myValue', defaultValue)`.
  /// You can also specify "deep" paths to fetch values, such as
  /// `let myValue = fetch('some.deep.key', defaultValue)`.
  ///
  /// The second call pattern is to supply an object, where each
  /// property key is the key name to fetch, and each property
  /// value is a "default value" if the specified key is not found,
  /// or whose value results in `undefined`. For example:
  /// `let { value1, value2 } = fetch({ value1: 'defaultFallback', value2: defaultValue })`.
  /// You can also specify "deep" keys using this call pattern, for
  /// example: `let { test } = fetch({ 'some.deep.key.test': defaultValue })`.
  /// When using the "deep" pattern, only the "last part" of the path is
  /// returned as a key. In this case, you can see that the resulting key
  /// is `test`, which is the final part of `some.deep.key.test`.
  ///
  /// Return: any
  /// Arguments:
  ///   scope: object | string
  ///     The "scope" to fetch. This can be a string to fetch a single property
  ///     from the context, or it can be an object with the shape `{ propertyName: defaultValueIfNotFound }`.
  ///   defaultValue: any
  ///     When the `scope` argument is a string, this specifies the default value
  ///     to fallback to if the lookup results in an `undefined` value. When
  ///     the `scope` argument is an object then this argument is ignored.
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

  /// Store one or more properties into the "user context".
  /// The "user context" is <see>RunnerContext.context</see>,
  /// and is the current context object where parsed argument
  /// values are stored. The "user context" is also what is
  /// returned by <see>CMDed.CMDed</see>.
  ///
  /// Store has a few different call patterns. First, it can
  /// store a single property by name. For example, you could
  /// call it like so: `store('myValue', value)`.
  /// You can also specify "deep" paths to store values, such as
  /// `store('some.deep.key', value)`.
  ///
  /// The second call pattern is to supply an object, where each
  /// property key is the key name to store, and each property
  /// value is the value to store. For example:
  /// `store({ value1: 'hello', value2: 'world' })`.
  /// You can also specify "deep" objects using this call pattern, for
  /// example: `fetch({ some: { deep: { key: value } } })`.
  /// This type of call will always result in a "deep merge" into
  /// the underlying "user context".
  ///
  /// Return: void
  /// Arguments:
  ///   scope: object | string
  ///     The "scope" to set. This can be a string to set a single property
  ///     into the context, or it can be an object with the shape `{ propertyName: value }`.
  ///     If an object is provided, then it will be "deep merged" into the underlying
  ///     "user context".
  ///   value: any
  ///     When the `scope` argument is a string, this specifies the value
  ///     to set onto the specified key. When the `scope` argument is
  ///     an object, then this argument is ignored.
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

  /// Create a new "sub scope" for <see>RunnerContext.fetch</see>
  /// and <see>RunnerContext.store</see>.
  ///
  /// This can be used to "scope" your parsed argument values.
  /// When this is called, it will created the named scope specified
  /// into the "user context" (<see>RunnerContext.context</see>), and
  /// then set this as the new "user context" for all Runners ran inside
  /// this scope. This allows you to partition your parsed argument values
  /// into "scopes".
  ///
  /// Example:
  ///   let userContext = CMDed(({ $ }) => {
  ///     return $('sub-command', ({ scope }) => {
  ///       return scope('subCommand', ({ $ }) => {
  ///         $('--enabled', Types.BOOLEAN);
  ///       });
  ///     });
  ///   });
  ///
  ///   console.log(userContext);
  ///   // output: { subCommand: { enabled: true } }
  ///
  /// Return: boolean
  ///   Return the result of the operation. `true` should be returned
  ///   upon success, or `false` upon failure. Commonly, `true` will
  ///   be returned if any of your pattern matchers succeeded. However,
  ///   you might always want to return `true` if all your argument
  ///   matchers are optional. Return `false` only if there was a failure.
  /// Arguments:
  ///   name: string
  ///     The name to give the new scope.
  ///   runner: Runner
  ///     The runner to call for this scope. The values collected
  ///     from all child Runners will be placed into this new
  ///     named scope.
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

    return runner(subContext, {}, {});
  }

  /// Parse some arguments using the provided
  /// parser. By default, CMDed will use the
  /// `defaultParser` provided internally. However,
  /// the user is free to define their own `parser`
  /// on the `rootOptions` of <see>CMDed.CMDed</see>,
  /// in which case the user defined parser will be
  /// called instead.
  ///
  /// This will "consume" as many arguments as the parser
  /// itself consumes. For the `defaultParser` internal parser,
  /// this could be up to two arguments.
  ///
  /// This should return a "parser result", which can be
  /// any object or value that the Runner accepts. For built-in
  /// Runners, they require an object for the "parsed result",
  /// and that object must at a minimum contain the `name` and
  /// `value` keys from the parsing operation.
  ///
  /// If the parsing operation in question has no argument name
  /// (for example, parsing a solo argument, like a number), then
  /// the `name` can be provided via the Runner options directly.
  ///
  /// By default, CMDed will call the parser with an option of
  /// `{ consume: false }` to prevent consuming the arguments.
  /// This is because the arguments are being "scanned", and
  /// it doesn't want to mark arguments as "consumed" until
  /// it actually finds a matching pattern. For this reason, the
  /// `defaultParser` also returns in the "parser results" two
  /// properties: `{ indexes: Array<number>, notConsumed: array<number> }`.
  /// If the parser returns a falsy value, then that is considered a
  /// non-match for the argument being tested, and argument scanning continues.
  /// If however the parser returns a truthy value, then this is considered
  /// a positive match for the argument being tested. When a positive match
  /// is encountered, then the `notConsumed` property is used to mark the parsed
  /// arguments as "consumed" before CMDed proceeds. For this reason,
  /// if you have a custom parser, then 1) Your parser needs to consume
  /// the arguments it is parsing, or 2) It needs to return a `notConsumed`
  /// array of argument indexes to let CMDed mark those arguments as "consumed".
  /// **DO NOT** just ignore this system. If you do not properly mark arguments
  /// as "consumed", then you will run into massive bugs and issues in your
  /// application.
  ///
  /// Return: any
  /// Arguments:
  ///   options: object
  ///     Any options you wish to provide to your parser. Internally,
  ///     CMDed will provide the following options to a parser call:
  ///     `{ consume: boolean, pattern: string, solo: boolean }`.
  ///   index: number
  ///     The argument index to start parsing at.
  parse = (options?: GenericObject, index?: number): GenericObject | undefined => {
    let parser = this.rootOptions.parser;
    if (!parser)
      throw new Error('RunnerContext:parse: "parser" not defined, but is required.');

    return parser(this, options, index);
  }

  /// Convert argument names to property names
  /// for storing the argument values into the
  /// "user context". By default, this will turn
  /// all property names into camelCase. For example,
  /// an argument named `--use-system-echo`, would
  /// be called `useSystemEcho` in the user context.
  ///
  /// You can override this behavior by providing your
  /// own `formatter` to the `rootOptions` of <see>CMDed.CMDed</see>.
  ///
  /// Return: string
  ///   The formatted argument name. By default, this will format
  ///   an argument name into camelCase.
  /// Arguments:
  ///   name: string
  ///     The argument name to format into a "user context" property name.
  formatName = (name: string): string => {
    let formatter = this.rootOptions.formatter;
    if (!formatter)
      throw new Error('RunnerContext:formatName: "formatter" not defined, but is required.');

    return formatter(name, this);
  }

  /// This is a convenience method to mark arguments
  /// as "consumed". It will accept an array of argument
  /// indexes, or a single index.
  ///
  /// Note:
  ///   You could also call `args.consume(index)` to consume
  ///   any arguments. `args.consume` only accepts a single
  ///   index however, so if you want to consume multiple
  ///   arguments at the same time you can use this method instead.
  /// Return: void
  /// Arguments:
  ///   indexes: Array<number> | number
  ///     Argument indexes to mark as "consumed".
  markConsumed = (_indexes: Array<number> | number): void => {
    let indexes = Nife.toArray(_indexes) as Array<number>;
    let args = this.args;

    for (let i = 0, il = indexes.length; i < il; i++) {
      let index = indexes[ i ];
      args.consume(index);
    }
  }

  /// Match against an argument pattern.
  ///
  /// This will scan all arguments one by one until a match
  /// is found. When a match is found, the parsed arguments
  /// will be marked as "consumed", and the Runner for the
  /// match will be invoked.
  ///
  /// If a `string` argument is supplied as the `pattern`
  /// argument, then the argument(s) parsed must match
  /// the pattern provided exactly. Any arguments parsed
  /// will be automatically consumed for you.
  ///
  /// If a `RegExp` argument is supplied as the `pattern`,
  /// then the regular expression will be used to find a
  /// match while scanning arguments. If a match is found,
  /// then the one argument that matched the RegExp pattern
  /// will be marked as consumed, and the Runner will be invoked.
  /// The "parser results" for this type of match will be
  /// the results from `regexp.match` itself. These parser
  /// results will not work for the built-in Runner types,
  /// so if you want to use the built-in Runners provided
  /// by CMDed, you will first need to re-format the results
  /// of `regexp.match` by providing a `formatParsedResult`
  /// option to the Runner itself. The supplied `parser` will
  /// not be invoked for this type of pattern, and only up to one
  /// argument will ever be consumed.
  ///
  /// If a `Function` argument is supplied as the `pattern`,
  /// then the user must parse the argument(s) they desire,
  /// and also mark those arguments as "consumed". **DO NOT**
  /// return a truthy result without marking the correct arguments
  /// as "consumed". CMDed will not mark any arguments as
  /// "consumed" for you, as it won't know which (or how many)
  /// arguments you parsed. The return value of this method can
  /// be anything you want, as long as it is truthy. Whatever
  /// is returned from this method will be passed directly to
  /// the Runner as the "parsed results". If you want to have
  /// inter-op with the built-in Runners provided by CMDed, then
  /// at a minimum you must return an object, and that object
  /// must have `name` and `value` properties. The signature for
  /// this method must be `Function(context: RunnerContext, options: object, index: number)`,
  /// where `context` is the current RunnerContext, `options` are the options
  /// provided to the Runner (if any), and the `index` is the current
  /// argument index being tested. Remember that CMDed is "scanning"
  /// arguments, so your method should also "test" for a positive
  /// match before it consumes any arguments. If a positive match is
  /// not found, then your method should return `false` to let CMDed
  /// know that it needs to continue scanning.
  ///
  /// Return: Promise<boolean> | boolean
  ///   Return a `Promise` from your Runner if you have asynchronous code.
  ///   Otherwise, simply return `true` if your runner succeeded, or `false`
  ///   if not.
  /// Arguments:
  ///   pattern: string | RegExp | Function(context: RunnerContext, options: object | undefined, index: number) | null | undefined
  ///     The pattern to match against. This can be a `string` for an exact match, a `RegExp`
  ///     for a pattern match, or a `Function` for a custom parser/matcher. If `null` or `undefined`
  ///     are provided, then CMDed will automatically force `solo` mode, and will demand that a `name`
  ///     be supplied to the Runner options. This can be useful for example if you know what argument
  ///     you are parsing, and just want to parse it without a name provided at the arguments level, for
  ///     example: `$(null, Types.INTEGER(), { name: 'myNumber' })`.
  ///   runner: Runner
  ///     The Runner to invoke upon successful match. The Runner method will be provided the
  ///     "parser results" as the second argument, after those results are passed through the
  ///     `formatParsedResult` Runner option... if any was supplied.
  ///   options: object
  ///     The options to pass to the parser and Runner. These will be passed as the second
  ///     argument to the parser, and as the third argument to the Runner. These can be any
  ///     user defined values needed for your parser/Runner. The built-in Runners can be
  ///     provided the `validate: Function(value: any, context: RunnerContext)` and `solo: boolean`
  ///     options. All Runners and parsers can be given the option
  ///     `formatParsedResult: Function(value: any, context: RunnerContext)` to format the
  ///     result of the parser before it is handed off to the Runner. Custom Runners and parsers
  ///     can be given any options you as the user define.
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
        _runner = runner(options);
      }

      let runnerResult = _runner(newContext, parsedResult, options || {});
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

  /// This is simply a short-hand alias for <see>RunnerContext.match</see>.
  get $(): (_pattern: string | RegExp | PatternMatcher | null | undefined, runner: Runner, options?: GenericObject) => Promise<boolean> | boolean {
    return this.match;
  }

  /// Show the help to the user.
  ///
  /// Unlike when `showHelp` is called globally,
  /// this doesn't need a `help` argument. It is
  /// provided the `help` via the `rootOptions`
  /// given to <see>CMDed.CMDed</see>.
  ///
  /// If a `path` argument is provided, then CMDed
  /// will attempt to look up that path inside the
  /// `help` object to find the correct help to show.
  /// The `path` should be in "dot notation", for example
  /// `sub-command.command`.
  ///
  /// Note:
  ///   `showHelp` will not exit the program. You must
  ///    manually shutdown your program, call <see>RunnerContext.exit</see>
  ///    or `process.exit` yourself.
  /// Note:
  ///   This deliberately has the same name as the global export `showHelp`,
  ///   because they accomplish the same thing. However, both methods have a
  ///   different signature, so pay attention when calling them.
  /// Return: void
  /// Arguments:
  ///   path: string
  ///     A "dot notation" path to lookup inside the `help` object
  ///     for showing the proper help. If none is provided, or
  ///     not found in the `help` object, then the entire `help`
  ///     object will be supplied to the `showHelp` internal method
  ///     instead.
  showHelp = (_path?: string): void => {
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

  /// Check to see if any matchers succeeded.
  ///
  /// If any matchers succeeded (in the current
  /// runner only), then return `true`, otherwise
  /// return `false`. This is a convenience method
  /// to help you quickly check if you got any matches
  /// on your arguments or not.
  ///
  /// Return: boolean
  hasMatches = (): boolean => {
    return (this.matchCount > 0);
  }

  /// Call `process.exit` with the provided `statusCode`.
  ///
  /// This is simply a convenience method to call
  /// `process.exit`.
  ///
  /// Arguments:
  ///   statusCode: number
  ///     The process status code to exit with. This should be `0` if your
  ///     command succeeded, or any non-zero value (usually `1`) upon
  ///     failure (i.e. if you show the help).
  exit = (statusCode: number): void => {
    process.exit(statusCode);
  }
}
