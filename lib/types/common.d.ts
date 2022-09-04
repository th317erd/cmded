import { RunnerContext } from "../runner-context";
export declare interface GenericRunnerOptionsInterface {
    validate?: (value: any, context: RunnerContext) => boolean;
    solo?: boolean;
}
export declare type GenericRunnerOptions = GenericRunnerOptionsInterface | undefined;
