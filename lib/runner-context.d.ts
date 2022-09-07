import { Arguments } from './arguments';
import { GenericObject } from './common';
import { RootOptions } from './root-options';
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
    types?: {
        [key: string]: Function;
    };
}
export declare class RunnerContext {
    private options;
    private matchCount;
    constructor(options: RunnerContextOptions);
    get rootOptions(): RootOptions;
    get args(): Arguments;
    get context(): GenericObject;
    get runnerPath(): string;
    get Types(): {
        [key: string]: Function;
    };
    clone: (options?: {
        rootOptions?: RootOptions | undefined;
        context?: GenericObject | undefined;
        args?: Arguments | undefined;
        runnerPath?: string | undefined;
        types?: {
            [key: string]: Function;
        } | undefined;
    } | undefined) => RunnerContext;
    fetch: (_scope?: GenericObject | string, defaultValue?: any) => any;
    store: (_scope: GenericObject | string, value?: any) => void;
    scope: (name: string, runner: Runner) => Promise<boolean> | boolean;
    parse: (options?: GenericObject, index?: number) => GenericObject | undefined;
    formatName: (name: string) => string;
    markConsumed: (_indexes: Array<number> | number) => void;
    match: (_pattern: string | RegExp | PatternMatcher | null | undefined, runner: Runner, options?: GenericObject) => Promise<boolean> | boolean;
    get $(): (_pattern: string | RegExp | PatternMatcher | null | undefined, runner: Runner, options?: GenericObject) => Promise<boolean> | boolean;
    showHelp: (_path?: string) => void;
    hasMatches: () => boolean;
    exit: (statusCode: number) => void;
}
