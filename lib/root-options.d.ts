import { GenericObject } from "./common";
import { RunnerContext } from "./runner-context";
export declare interface HelpInterface {
    [key: string]: HelpInterface | string;
}
export declare interface RootOptions {
    strict?: boolean;
    argv?: Array<string> | null;
    parser?: (context: RunnerContext, options?: GenericObject, index?: number) => GenericObject | undefined;
    formatter?: (context: RunnerContext, name: string) => string;
    showHelp?: (subHelp: HelpInterface | undefined, help: HelpInterface | undefined, helpPath: string) => void;
    help?: HelpInterface;
}
