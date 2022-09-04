import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

export function BOOLEAN(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
    let name = formatName(parsedResult.name);
    let value = (parsedResult.value == null || (/^true|1$/i).test(parsedResult.value));

    if (options && typeof options.validate === 'function') {
      let result = options.validate(value, arguments[ 0 ]);
      if (!result)
        return false;
    }

    store({ [ name ]: value });

    return true;
  };

  runner.parserOptions = { solo: true };
  if (options && options.solo != null)
    runner.parserOptions.solo = !!options.solo;

  return runner;
}

BOOLEAN.wrapper = true;
BOOLEAN.parserOptions = { solo: true };
