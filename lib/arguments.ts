declare interface ArgumentsIterateContext {
  value: string;
  index: number;
  consumed: boolean;
  stop: () => void;
}

export class Arguments {
  declare private _args: Array<string>;
  declare private _consumed: Array<boolean>;
  declare private _currentIndex: number;

  get currentIndex(): number {
    return this._currentIndex;
  }

  constructor(args: Array<string>, consumed?: Array<boolean>) {
    this._args = args;
    this._consumed = (consumed) ? consumed : args.map(() => false);
    this._currentIndex = 0;
  }

  get(_index?: number): string | undefined {
    let index = (_index == null) ? this.currentIndex : _index;
    if (index > this._args.length)
      return;

    return this._args[ index ];
  }

  consume(_index?: number): string | undefined {
    let index = (_index == null) ? this.currentIndex : _index;
    if (index > this._args.length)
      return;

    if (this._consumed[ index ])
      return;

    let value = this.get(index);
    this._consumed[ index ] = true;

    if (_index == null || _index === this._currentIndex) {
      this._currentIndex = this._consumed.indexOf(true, this._currentIndex);
      if (this._currentIndex < 0)
        this._currentIndex = this._args.length;
    }

    return value;
  }

  unconsume(index: number): string | undefined {
    if (index > this._args.length)
      return;

    this._consumed[ index ] = false;

    if (index < this._currentIndex)
      this._currentIndex = index;

    return this.get(index);
  }

  slice(start: number, end: number): Arguments {
    return new Arguments(
      this._args.slice(start, end),
      this._consumed.slice(start, end),
    );
  }

  resetConsumed(): Arguments {
    this._consumed = this._args.map(() => false);
    return this;
  }

  resetIndex(): Arguments {
    this._currentIndex = 0;
    return this;
  }

  reset() {
    this.resetConsumed();
    this.resetIndex();
    return this;
  }

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

  getConsumed() {
    let consumed = this._consumed;
    let consumedIndexes = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (consumed[ i ])
        consumedIndexes.push(i);
    }

    return consumedIndexes;
  }

  getUnconsumed() {
    let consumed = this._consumed;
    let unconsumedIndexes = [];

    for (let i = 0, il = consumed.length; i < il; i++) {
      if (!consumed[ i ])
        unconsumedIndexes.push(i);
    }

    return unconsumedIndexes;
  }
}
