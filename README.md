# CMDed

CMDed is a command line argument parser made for humans.

CMDed makes it easy to build CLI tools, or any command that needs arguments. Unlike other command argument parsers, CMDed aims at keeping the interface straight forward and simple, while also remaining very simple (and small) in nature.

## Install

npm:
```bash
$ npm i --save cmded
```

yarn:
```bash
$ yarn add cmded
```

## Documentation

The full documentation can be found [here](https://github.com/th317erd/cmded/wiki).

## How it works

The core concept that makes CMDed works is "consuming" arguments combined with argument "scanning".

Any arguments that are validly parsed against a matching pattern are "consumed". Being consumed, they are then ignored by further processing. This makes parsing complex combinations straight forward and simple.

Take for example the following command:

`./my-echo hello world --use-system-echo --duplicate`

All arguments are scanned (in the order you specify) and marked as "consumed". So, when specifying the "boolean" arguments `--use-system-echo` and `--duplicate` in our code first, the arguments would be scanned, and the "boolean" arguments would be marked as "consumed" (visualized with `.....`):

`./my-echo hello world ................. ...........`

Now, inside your argument "context" there are the values `{ 'useSystemEcho': true, 'duplicate': true }`, and then the remaining arguments are up for parsing next. This makes it straight forward for the parser to figure out what is going on, even if the argument order is changed. For example, if we place the "boolean" flags first, nothing changes:

`./my-echo --duplicate --use-system-echo hello world`

...when looking at the consumed arguments:

`./my-echo ........... ................. hello world`

In this case, we want all remaining arguments to be echoed to the user. CMDed has a special context property named `_remaining` which are all remaining "unconsumed" arguments after parsing has completed.

With all of this in mind, we can create the above example using CMDed:

```javascript
const { CMDed, Types, showHelp } = require('../');
const { spawn } = require('child_process');

// Define our help for this command
const help = {
  '@usage': 'my-echo [options] ...arg1 ...arg2 ...argN',
  '@examples': [
    './my-echo hello world',
    './my-echo --duplicate hello world',
    './my-echo hello world --use-system-echo --duplicate',
  ],
  '--use-system-echo': 'Spawn system "echo", handing off arguments to the child process',
  '--duplicate': 'Duplicate all provided arguments',
};

// Parse our arguments.
// All remaining arguments will be placed into `args._remaining`.
let args = CMDed(({ $, store }) => {
  // Runners should always return `true` if they succeed,
  // so the `|| store(...)` syntax is one way for us to
  // set "default values" for each of our options. If they
  // fail for example (because no such argument was provided),
  // then the `|| store(...)` path will be followed, and the
  // value will be set to `false` (the default).
  $('--use-system-echo', Types.BOOLEAN()) || store({ 'useSystemEcho': false });
  $('--duplicate', Types.BOOLEAN()) || store({ 'duplicate': false });

  // This informs CMDed that everything went okay.
  // If a "Runner" ever returns `false`, then CMDed
  // will know that the Runner has failed... this isn't
  // always a bad thing, but it generally means that it
  // is time to show the help. In this case however,
  // both our arguments are optional, so if they weren't
  // parsed, then that is okay.
  return true;
}, { help });

// If no arguments were provided, then show the help
let remainingArgs = args._remaining;
if (remainingArgs.length === 0) {
  showHelp(help);
  process.exit(1);
}

// Duplicate args if requested
if (args.duplicate)
  remainingArgs = Array.prototype.concat.apply([], remainingArgs.map((arg) => [ arg, arg ]));

// Now let's echo
if (args.useSystemEcho) {
  spawn('echo', remainingArgs, { stdio: 'inherit' });
} else {
  console.log(remainingArgs.join(' '));
}
```

## Examples

Check out the [examples](https://github.com/th317erd/cmded/tree/main/examples) directory in the repository to see other examples for CMDed.

## Runners

CMDed calls argument "handlers" Runners. There is a few built-in default Runners, such as `BOOLEAN`, `INTEGER`, `DECIMAL`, `OCTAL`, `BYTES`, and `STRING`. These can be accessed from the `Types` import.

### Match and $

The `$` dollar sign is an alias for `match`. `match` is the core of CMDed. It will match against the argument patterns specified, in combination with the parser, and will "consume" any matches found. It does so by scanning all the arguments. For example, if we specify a `'--size'` argument, it will scan *all* provided arguments until it finds this match, and once found, it will mark that argument as "consumed", and call the Runner, passing the parsed results to the Runner as the second argument.

There are a number of different ways `match` can be used. First, `match` can simply provided a string for a pattern to match against. If it is provided a string, then the match must be exact.

You can also supply a regular expression (`RegExp`) to the Runner as the first argument (the "pattern"). If a `RegExp` is supplied, then the results of the matching regular expression will be passed as the second argument (the parser results) to the Runner. All of the built-in Runners won't know what to do with this "RegExp result", so if you are passing it into a built-in or non-custom Runner, then you will need to format the parser results first. You can use the `formatParsedResult` option callback to do this. Whatever this method returns will be what is passed directly to the Runner. In order to be compatible with the default and built-in Runner interface, this must be an object, and it must have at least the keys `name` and `value` for the argument parsed. For `RegExp` patterns, only one argument will ever be "consumed" upon match. If you need to match against/parse more than a single argument, then you will need to create a Runner, or use a `Function` pattern instead.

You can also supply a `Function` to the Runner as a pattern matcher. It is then up to the this pattern matcher to parse and consume as many arguments as it wants. This pattern matcher must consume all arguments positively matched. The underlying system can not know what was parsed, and therefor can not mark parsed arguments. Don't forget to consume each argument positively matched, or you will have some strange bugs later on down the line. A `Function` pattern matcher will be considered a successful match if a truthy value is returned. If this is the case, then the Runner will be called with the truthy result (after being passed through `formatParsedResult` if any was specified). As with all matchers, the minimum requirement to work with the default and built-in Runners is to provide an object with at least `name` and `value` properties.

### Runner parameters

All Runners by default need no parameters. You can however optionally supply parameters to Runners. Here are the parameters that can be passed to all built-in Runners.

*Note: Custom Runners might have different parameters that can be supplied*.

```javascript
{
  validate: (value: any, context: RunnerContext): boolean => {
    // validate the parsed "value"
  },
  formatParsedResult: (value: any, context: RunnerContext, options: object) => {
    // Format the result returned by the parser, the RegExp pattern matcher, or the function pattern matcher. "options" are the options supplied to the Runner.
  },
  solo: true, // Solo forces the parser to only parse a single argument
}
```

 For example,
any Runner can have a `validate` method supplied to it, like so:

```javascript
CMDed(({ $ }) => {
  $('--size', Types.INTEGER({
    validate: (value, { showHelp, exit }) => {
      if (value < 0) {
        console.error('"--size" must be positive');
        showHelp();
        exit(1);
      }

      return true;
    },
  }));
});
```

As you can see, the `validate` method will allow you to validate a parsed argument, and if a bad value was provided, do something about it. The `exit` method will simply call `process.exit` with the provided status code. If `showHelp` is called from the `RunnerContext` provided, then it need not be provided the `help` object.

Or, maybe you want to use your own custom RegExp pattern matcher, and format the matching results with `formatParsedResult`:

```javascript
CMDed(({ $ }) => {
  $(
    (/(\d+),?/g), // Parse an array of numbers
    ({ store }, { name, value }) => {
      // Did we get a valid array?
      if (!Array.isArray(value) || value.length === 0)
        return false;

      // Are all numbers parsed finite values?
      let allFinite = value.some((number) => !isFinite(number));
      if (!allFinite)
        return false;

      // Our Runner will store the final result
      store({ [name]: value });

      // Success
      return true;
    },
    {
      // Format our parsed results
      formatParsedResult: (value, _context, options) => {
        return {
          name: options.name || 'numbers',
          value: value.map((numberStr) => parseInt(numberStr, 10)),
        };
      },
    }
  );
});
```

All Runners by default (except for `BOOLEAN`) will parse two arguments if they need to. The default parser will parse arguments with the following patterns `name=value` or `name value`. Arguments can include prefixes (but they don't need to). A `prefix` is any non-word character that comes first. For example, `--name` would have the prefix `--`.

To turn off this default behavior of parsing two different formats, and up to two arguments, you can pass the `{ solo: true }` parameter to a Runner. Doing so will force the parser to only parse and consume a single argument. For example, if you wanted to parse a single argument that you knew was an integer, then you could `Types.INTEGER({ solo: true })`, and this would parse an integer argument like `10`, or `10e4`, or `-10`. It would also parse something like `name=10`, or `name=10e4`, or `name=-10`. It wouldn't however parse something like `name 10`. This would need to parse and consume two arguments, which is disallowed when in `solo` mode.

There are many instances when `solo` mode is useful. For example, if you wanted to parse an array of arguments, you could use a built-in parser such as `Types.INTEGER`, and simple match against it as many times as needed while in `solo` mode.

### RunnerContext

Each Runner is passed a `RunnerContext`, and many other methods are also provide this context. This context gives a handful of useful methods you can use to interact with the current argument context, for example `store`, and `fetch` to update the user context, `exit` to exit the program immediately, `hasMatch` to see if anything matched in the current Runner, the `rootOptions` provided to the command parser, and `args` if you need to access the arguments directly.

#### `store` and `fetch`

`store` and `fetch` allow you to interact with the user context. The "user context" is where the parsed argument values are being stored. Both methods support deep paths. For example you can fetch a value like `fetch('some.deep.property')`, or `fetch({ 'some.deep.property': defaultValue })`. You can set deep values like `store({ some: { deep: { value: value } } })`, or `store('some.deep.property', value)`.

When `fetch` is in object form, then each property value is the "default value" if the context key being requested is `undefined`. For example `fetch({ hello: 'world' })` would return `{ hello: internalValue || 'world' }`, where `'world'` would only be the value if `internalValue` is `undefined`. This is useful to get a few context variables at the same time via destructuring, while still providing default values if one or more is not present.

#### `exit`

Calling `exit` will call `process.exit` and terminate the program immediately. You can supply a process exit code (status code) as the first argument to `exit`.

#### `hasMatch`

Calling `hasMatch` will return `true` if any of the matchers inside the current Runner had a successful match, or `false` otherwise. This is useful to call as the return value of your Runner.

#### `rootOptions`

`rootOptions` are the root options provided to `CMDed` when it was called.

#### `args`

All provided command line arguments via the `Arguments` interface. The `Arguments` interface tracks which arguments have been consumed.

#### `context`

Get the raw "user context".

#### `scope`

You can at any time spawn a new sub scope in the "user context" by calling `scope`. It will create a sub scope within the user context, under the name you provide, and then all Runners under this scope will place their parsed values into this sub scope. For example:

```javascript
const { CMDed, Types } = require('cmded');

let userContext = CMDed(({ $, scope }) => {
  return $('sub-command', ({ scope }) => {
    return scope('subCommand', ({ $ }) => {
      return $('--enabled', Types.BOOLEAN());
    });
  });
});

console.log(userContext);
// output: { subCommand: { enabled: true } }
```

#### `parse`

`parse` can be used at any time to manually invoke the configured parser.

#### `$` and `match`

Match against a specified argument pattern, and place results into the "user context".

#### `formatName`

Call the configured property name formatter manually on a specified value.

#### `markConsumed`

Mark a specified array of argument indexes as consumed. An argument can be manually marked as "consumed" or "unconsumed" through the `args` interface.

#### `showHelp`

Output to `stdout` the help defined for the current command, or current Runner. By default, if this is called inside a Runner, it will try to find the "sub section" of the defined `help` for the Runner it was called from. If not matching "sub section" is found, then it will simply show the full help. The output of any `showHelp` call can be overloaded by providing your own `showHelp` method as a `rootOption` to your `CMDed` call.

## Help

Help has a nice output formatter built-in for you, but must be manually defined. In the design process for CMDed, it was decided to sacrifice "auto help" or "easy help" generation for interface simplicity. However, this doesn't mean that it is difficult to specify help for your command. Simply use the `help` parameter on the `CMDed` call to provide help for your command. If you format this `help` object correctly, then `CMDed` will give you nice help when you ask for it. See the [examples](https://github.com/th317erd/cmded/tree/main/examples) directory in the repository for more examples.

### `@usage`

If an `@usage` key is specified in a scope or sub scope of the `help`, then it will be use to show the `Usage: ` title of the help output.

### `@examples`

An `@examples` key, with a value that is an array of strings, will show a list of examples at the end of your help output.

### `@notes`

An `@notes` key, with a value that is an array of strings, will show a list of notes at the end of your help output.

### `@title`

Used for sub commands. This specifies some short title to show for the sub command. The sub command will then have its own `help` sub scope to fully describe the usage of the sub command. If not provided, this will just fallback to some sane default, showing the user how to invoke the sub command.

### `@see`

Used for sub commands. This specifies some short example on how to show more help for the sub command. If not provided, this will just fallback to some sane default, letting the user know to invoke `--help` on the sub command itself for more help.

### all other keys

All other keys in the `help` scope will be listed as arguments to the command. The property value for each key will be used as the description for the command. For example: `{ '--enable': 'Enable a powerful feature.' }`.

You can provide aliases or alternate formats by using the vertical pipe character `|`. For example: `{ '--enable=true|enable=false|--enable': 'Enable a powerful feature.' }`.

If a `help` property has an object as a value, then it will be treated as a "sub scope", and will have a short description listed for it. For more information you will need to specifically request so by asking for help with the `--help` argument on the scope. For example, if your sub scope (or sub command) was named `run`, and you wanted more help on it, you would execute `my-command run --help`, or `my-command --help run`. This would then show the full `run` sub scope of the `help`.

### The `--help` argument and `helpArgPattern`

By default, the internal "help" request for your command will be triggered with a `--help` argument. You can however change this to whatever you want by specifying the `helpArgPattern` parameter as a `rootOption` to your `CMDed` call.  Right now this only supports a single pattern.

*Note: if you want aliases for your `--help` argument, then you can always specify them yourself as Runners that will call `showHelp`, or you can submit a PR or issue request informing the CMDed team that you would like such a feature.*

### Async Runners

Asynchronous runners are supported. All you have to do is use the `async`/`await` syntax everywhere, and away you go! Nothing changes, you just need to `await` on all matchers/runners, `scope` calls, and the call to `CMDed` itself.

## CMDed

`CMDed` is the main entry point for parsing your arguments. It takes two arguments, an entry point function (this is not a Runner, it is just the entry point to start invoking matchers/Runners), and a `rootOptions` object, specifying the root options for the process.

The `rootOptions` has the following shape:

```javascript
{
  strict?: boolean;
  argv?: Array<string> | null;
  parser?: (context: RunnerContext, options?: object, index?: number) => object | undefined;
  formatter?: (name: string, context?: RunnerContext) => string;
  showHelp?: (subHelp: object | undefined, help: object | undefined, helpPath: string, context: RunnerContext) => void;
  help?: object | null;
  helpArgPattern?: string | null;
}
```

### Parameters

#### `strict` = `false`

The `strict` parameter, if `true`, will "panic", and show the help for the command if any arguments are remaining that are unconsumed when the process has completed.

#### `argv` = `process.argv.slice(2)`

Specify the arguments to parse. By default this will be `process.argv.slice(2)`, but can be any array of strings you wish to provide.

#### `parser` = `defaultParser`

Specify a parser for parsing all arguments. By default, this is the `defaultParser` provided by CMDed, that will parse the following argument patterns: `{prefix}{name}={value}` (one argument) or `{prefix}{name} {value}` (two arguments). This parser will not be invoked for `RegExp` and custom `Function` pattern matchers.

#### `formatter` = `defaultFormatter`

The default formatter to apply to argument `name`s to convert them into "user context" key names. For example, the argument named `--use-system-echo` will be converted into camel case `useSystemEcho`. You can provide any formatter you want to format the name of your arguments and turn them in to user context key names.

### `showHelp` = `undefined`

A custom `--help` output function that will write the command's help to stdout. This is a complete replacement of the built-in `showHelp` method. If you supply this, you must output all the help for your command. However, the `help` object will be provided to this call, so you will have something to work with to output the help.

#### `context` = `{}`

The default "user context" to supply. This can be any object... but it should be an object.

#### `help` = `undefined`

The help to provide for your command. This should be an object, where each key is an argument pattern, and each value a description of what that argument does.

*Note: See the [Help](https://github.com/th317erd/cmded#help) section and check out the [examples](https://github.com/th317erd/cmded/tree/main/examples) for more information.*

#### `helpArgPattern` = `'--help'`

The pattern that will trigger the internal help path for the command. This can be anything you want it to be. By default it is `--help`.

## Types

CMDed comes with the following built-in types:

### `Types.BOOLEAN` (solo = only consumes at most one argument)

A boolean type. This is a `solo` type by default, meaning it won't ever parse more than a single argument. However, it is valid to use the `name=value` syntax for your arguments, allowing you to set the boolean to any value. By default, a "no value" argument will be assumed to be `true`, such as `--enabled`. You can specifically set the value like so: `--enabled=false`, or `--enabled=0`, or `--enabled=true`, or `--enabled=1`.

### `Types.INTEGER` (multi = consumes at most two arguments)

An integer type. This will parse a non-decimal, non-real number... an "integer" value. It will fail if there is a decimal place in the number provided. It does however support exponential notation, and can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=10`, or `--size=10e4`, or `--size=-5`, or `--size 10`, or `--size 10e4`, or `--size -5`.

### `Types.DECIMAL` (multi = consumes at most two arguments)

A "floating point" type. This will parse a "real" number... and "decimal" floating point number. It supports exponential notation, and can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=10.55`, or `--size=10.5e4`, or `--size=-5.123`, or `--size 10.55`, or `--size 10.5e4`, or `--size -5.123`.

### `Types.HEX` (multi = consumes at most two arguments)

A hex type. This will parse an integer value in hexadecimal notation. The hex value can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=0xF`, or `--size=-0xAF`, or `--size 0xF`, or `--size -0xAF`.

### `Types.OCTAL` (multi = consumes at most two arguments)

An octal type. This will parse an integer value in octal notation. The octal value can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=0o777`, or `--size=-66`, or `--size 777`, or `--size -0o66`.

### `Types.BYTES` (multi = consumes at most two arguments)

A size in bytes. This will parse an a size in the number of bytes. This value must be positive, or the match will fail. You can use the `b`, `k`, `kb`, `m`, `mb`, `g`, `gb`, `t`, and `tb` postfixes to specify the absolute size in bytes (case insensitive). Floating point or decimal values can be used. For example, `1.5mb` is valid. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--bytes=10mb`, or `--bytes=32kb`, or `--bytes 1gb`, or `--bytes 1.5tb`.

### `Types.STRING` (multi = consumes at most two arguments)

A string type. This will parse any string value. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--name=Bob`, or `--name Bob`.
