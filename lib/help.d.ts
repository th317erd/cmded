import { RunnerContext } from './runner-context';
export declare interface HelpInterface {
    [key: string]: HelpInterface | Array<HelpInterface> | string | Array<string>;
}
export declare function showHelp(help: HelpInterface, fullHelp?: HelpInterface, helpPath?: string, context?: RunnerContext): void;
