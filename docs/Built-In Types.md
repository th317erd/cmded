# Built-In Types

## How to access built-in types

Built-in types can be accessed via the `Types` import.

```javascript
const { CMDed, Types } = require('cmded);
```

## Built-in type `options`

All built-in types have the following options that can be provided:

```typescript
interface RunnerOptions {
  // Validate the argument's value after parsing.
  // If this returns `false` then the Runner will
  // return `false`, reporting it has "failed".
  validate?: (value: any, context: RunnerContext) => boolean;

  // Format the results returned from the parser.
  // This is often useful, and needed if you are
  // using a `RegExp` pattern matcher.
  formatParsedResult?: (value: any, context: RunnerContext, parsedResult) => object;

  // If `true`, then this informs the parser to only ever
  // parse a single argument.
  solo?: boolean;
}
```

## Default parser behavior

The default parser will parse two different types of argument patterns.

First, it will attempt to stick to consuming a single argument, and parse
the argument pattern `{prefix}{name}={value}`. If that fails, then it will
attempt to parse using the second pattern, which consumes two arguments: `{prefix}{name} {value}`. If both patterns fail to parse, then the parser will report a failure, and CMDed will continue scanning the arguments until it finds a match.

## Types

### `Types.BOOLEAN(options?: RunnerOptions)` (solo = only consumes at most one argument)

A boolean type. This is a `solo` type by default, meaning it won't ever parse more than a single argument. However, it is valid to use the `name=value` syntax for your arguments, allowing you to set the boolean to any value. By default, a "no value" argument will be assumed to be `true`, such as `--enabled`. You can specifically set the value like so: `--enabled=false`, or `--enabled=0`, or `--enabled=true`, or `--enabled=1`.

### `Types.INTEGER(options?: RunnerOptions)` (multi = consumes at most two arguments)

An integer type. This will parse a non-decimal, non-real number... an "integer" value. It will fail if there is a decimal place in the number provided. It does however support exponential notation, and can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=10`, or `--size=10e4`, or `--size=-5`, or `--size 10`, or `--size 10e4`, or `--size -5`.

### `Types.DECIMAL(options?: RunnerOptions)` (multi = consumes at most two arguments)

A "floating point" type. This will parse a "real" number... and "decimal" floating point number. It supports exponential notation, and can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=10.55`, or `--size=10.5e4`, or `--size=-5.123`, or `--size 10.55`, or `--size 10.5e4`, or `--size -5.123`.

### `Types.HEX(options?: RunnerOptions)` (multi = consumes at most two arguments)

A hex type. This will parse an integer value in hexadecimal notation. The hex value can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=0xF`, or `--size=-0xAF`, or `--size 0xF`, or `--size -0xAF`.

### `Types.OCTAL(options?: RunnerOptions)` (multi = consumes at most two arguments)

An octal type. This will parse an integer value in octal notation. The octal value can be either negative or positive. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--size=0o777`, or `--size=-66`, or `--size 777`, or `--size -0o66`.

### `Types.BYTES(options?: RunnerOptions)` (multi = consumes at most two arguments)

A size in bytes. This will parse an a size in the number of bytes. This value must be positive, or the match will fail. You can use the `b`, `k`, `kb`, `m`, `mb`, `g`, `gb`, `t`, and `tb` postfixes to specify the absolute size in bytes (case insensitive). Floating point or decimal values can be used. For example, `1.5mb` is valid. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--bytes=10mb`, or `--bytes=32kb`, or `--bytes 1gb`, or `--bytes 1.5tb`.

### `Types.STRING(options?: RunnerOptions)` (multi = consumes at most two arguments)

A string type. This will parse any string value. By default this is a `multi` command, so it *can* parse up to two arguments. It will however only parse a single argument if the "name=value" format is used for the argument. Examples: `--name=Bob`, or `--name Bob`.
