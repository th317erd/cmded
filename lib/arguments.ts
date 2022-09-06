declare interface ArgumentsIterateContext {
  value: string;
  index: number;
  consumed: boolean;
  stop: () => void;
}

/// Arguments interface class. This type
/// wraps around an `Array<string>` and
/// keeps track of which arguments have
/// been "consumed" or not.
///
/// Properties:
///   args: Array<string>
///     Get a copy of the raw arguments as provided to <see>CMDed.CMDed</see>.
///   currentIndex: number
///     The current index into the arguments being parsed. This is updated
///     any time an argument is <see name="consumed">Arguments.consume</see>
///     or <see name="unconsumed">Arguments.unconsume</see>. On an <see name="unconsumed">Arguments.unconsume</see>
///     call, this will be "rewound" if the `index` of the argument that
///     is "unconsumed" is less than the current value of `currentIndex`.
export class Arguments {
  declare private _args: Array<string>;
  declare private _consumed: Array<boolean>;
  declare private _currentIndex: number;

  get args(): Array<string> {
    return this._args.slice();
  }

  get currentIndex(): number {
    return this._currentIndex;
  }

  /// Construct a new instance of Arguments.
  ///
  /// Arguments:
  ///   args: Array<string>
  ///     An array of string arguments.
  ///   consumed?: Array<boolean>
  ///     The "consumed" status of each argument. If provided, this
  ///     must exactly match the length of the provided `args`.
  ///     Any `true` value in this array means the corresponding
  ///     argument has been consumed.
  constructor(args: Array<string>, consumed?: Array<boolean>) {
    this._args = args;
    this._consumed = (consumed) ? consumed : args.map(() => false);
    this._currentIndex = 0;
  }

  /// Get an argument without consuming it.
  ///
  /// This might be known as a "peek" in other similar systems.
  /// It allows you to fetch any argument without consuming it,
  /// and it will fetch the argument even if it is consumed.
  ///
  /// Return: string | undefined
  ///   Return the argument requested, or `undefined` if the `index`
  ///   is out of bounds.
  ///
  /// Arguments:
  ///   index?: number
  ///     The argument index to get. If `null` or `undefined`, then
  ///     the `currentIndex` argument will be returned.
  get(_index?: number): string | undefined {
    let index = (_index == null) ? this.currentIndex : _index;
    if (index < 0 || index > this._args.length)
      return;

    return this._args[ index ];
  }

  /// Get an argument and also consume it.
  ///
  /// Call this and ignore the return value to mark any
  /// argument as "consumed". This will return `undefined`
  /// if the requested argument has already been "consumed".
  ///
  /// Return: string | undefined
  ///   Return the argument requested, or `undefined` if the `index`
  ///   is out of bounds, or if the argument has already been "consumed".
  ///
  /// Arguments:
  ///   index?: number
  ///     The argument index to consume. If `null` or `undefined`, then
  ///     the `currentIndex` argument will be returned.
  consume(_index?: number): string | undefined {
    let index = (_index == null) ? this.currentIndex : _index;
    if (index < 0 || index > this._args.length)
      return;

    if (this._consumed[ index ])
      return;

    let value = this.get(index);
    this._consumed[ index ] = true;

    if (_index == null || _index === this._currentIndex) {
      this._currentIndex = this._consumed.indexOf(false, this._currentIndex);
      if (this._currentIndex < 0)
        this._currentIndex = this._args.length;
    }

    return value;
  }

  /// Un-consume an argument and return its value.
  ///
  /// Call this to mark any argument as NOT "consumed" (unconsumed).
  ///
  /// Return: string | undefined
  ///   Return the argument requested, or `undefined` if the `index`
  ///   is out of bounds.
  ///
  /// Arguments:
  ///   index: number
  ///     The argument index to unconsume.
  unconsume(index: number): string | undefined {
    if (index < 0 || index > this._args.length)
      return;

    this._consumed[ index ] = false;

    if (index < this._currentIndex)
      this._currentIndex = index;

    return this.get(index);
  }

  /// Create a copy of this Arguments instance.
  ///
  /// This works exactly like [Array.slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)
  /// and will make a copy of this Arguments instance.
  /// Simply provide a `start` and `end` arguments like you
  /// would with [Array.slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice). Negative indexes are supported
  /// just like with [Array.slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice).
  slice(...args: Array<number>): Arguments {
    return new Arguments(
      this._args.slice(...args),
      this._consumed.slice(...args),
    );
  }

  /// Reset all consumed values.
  ///
  /// This resets the "consumed" status of all arguments,
  /// marking all arguments as "unconsumed".
  resetConsumed(): Arguments {
    this._consumed = this._args.map(() => false);
    return this;
  }

  /// Reset the `currentIndex` back to zero.
  resetIndex(): Arguments {
    this._currentIndex = 0;
    return this;
  }

  /// Reset everything.
  ///
  /// This will reset all arguments consumed status
  /// so that no arguments are consumed, and will
  /// also reset the `currentIndex` back to `0`.
  reset() {
    this.resetConsumed();
    this.resetIndex();
    return this;
  }

  /// Iterate all arguments.
  ///
  /// By default, this will skip consumed arguments,
  /// unless you set the second argument to `true`.
  ///
  /// Interface:
  ///   interface ArgumentsIterateContext {
  ///     value: string; // The argument.
  ///     index: number; // The index of this argument.
  ///     consumed: boolean; // `true` if the argument is consumed.
  ///     stop: () => void; // Call this to immediately stop iterating.
  ///   }
  ///
  /// Arguments:
  ///   callback: (context: ArgumentsIterateContext) => void
  ///     Called for each argument iterated. If `stop` is called from the provided
  ///     context, then iteration will immediately halt.
  ///   includeConsumed?: boolean = false
  ///     If `true`, then also iterate consumed arguments.
  iterate(callback: (context: ArgumentsIterateContext) => void, includeConsumed?: boolean) {
    let _stop = false;
    let stop = () => _stop = true;

    for (let index = 0, il = this._args.length; index < il; index++) {
      if (_stop)
        break;

      let value = this._args[ index ];
      let consumed = this._consumed[ index ];
      if (consumed && !includeConsumed)
        continue;

      callback({
        value,
        index,
        consumed,
        stop,
      });
    }
  }

  /// Return an array of indexes that have been consumed.
  /// This array will be empty if no arguments have been consumed.
  ///
  /// Return: Array<number>
  ///   All consumed argument indexes.
  getConsumedIndexes(): Array<number> {
    let consumed = this._consumed;
    let consumedIndexes = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (consumed[ i ])
        consumedIndexes.push(i);
    }

    return consumedIndexes;
  }

  /// Return an array of arguments that have been consumed.
  /// This array will be empty if no arguments have been consumed.
  ///
  /// Return: Array<string>
  ///   All consumed arguments.
  getConsumed() {
    let consumed = this._consumed;
    let consumedArgs = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (consumed[ i ])
        consumedArgs.push(this.get(i));
    }

    return consumedArgs;
  }

  /// Return an array of indexes that have NOT been consumed.
  /// This array will be empty if all arguments have been consumed.
  ///
  /// Return: Array<number>
  ///   All unconsumed argument indexes.
  getUnconsumedIndexes() {
    let consumed = this._consumed;
    let unconsumedIndexes = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (!consumed[ i ])
        unconsumedIndexes.push(i);
    }

    return unconsumedIndexes;
  }

  /// Return an array of arguments that have NOT been consumed.
  /// This array will be empty if all arguments have been consumed.
  ///
  /// Return: Array<string>
  ///   All unconsumed arguments.
  getUnconsumed() {
    let consumed = this._consumed;
    let unconsumedArgs = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (!consumed[ i ])
        unconsumedArgs.push(this.get(i));
    }

    return unconsumedArgs;
  }
}
