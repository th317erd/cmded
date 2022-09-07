import { GenericObject } from "./common";
import { HelpInterface } from "./help";
import { RunnerContext } from "./runner-context";
export declare interface RootOptions {
    strict?: boolean;
    argv?: Array<string> | null;
    parser?: (context: RunnerContext, options?: GenericObject, index?: number) => GenericObject | undefined;
    formatter?: (name: string, context?: RunnerContext) => string;
    showHelp?: (subHelp: HelpInterface | undefined, help: HelpInterface | undefined, helpPath: string, context: RunnerContext) => void;
    help?: HelpInterface | null;
    helpArgPattern?: string | null;
    types?: {
        [key: string]: Function;
    };
}
