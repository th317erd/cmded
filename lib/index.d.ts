import { Runner } from './runner-context';
import { RootOptions } from './root-options';
import { GenericObject } from './common';
export declare type FinalResult = Promise<GenericObject | undefined> | GenericObject | undefined;
export declare function CMDed(runner: Runner, _options?: RootOptions): FinalResult;
export * as Types from './types';
export * from './arguments';
export * from './default-formatter';
export * from './default-parser';
export * from './root-options';
export * from './runner-context';
export * from './common';
