declare interface ArgumentsIterateContext {
    value: string;
    index: number;
    consumed: boolean;
    stop: () => void;
}
export declare class Arguments {
    private _args;
    private _consumed;
    private _currentIndex;
    get args(): Array<string>;
    get currentIndex(): number;
    constructor(args: Array<string>, consumed?: Array<boolean>);
    get(_index?: number): string | undefined;
    consume(_index?: number): string | undefined;
    unconsume(index: number): string | undefined;
    slice(...args: Array<number>): Arguments;
    resetConsumed(): Arguments;
    resetIndex(): Arguments;
    reset(): this;
    iterate(callback: (context: ArgumentsIterateContext) => void, includeConsumed?: boolean): void;
    getConsumedIndexes(): number[];
    getConsumed(): (string | undefined)[];
    getUnconsumedIndexes(): number[];
    getUnconsumed(): (string | undefined)[];
}
export {};
