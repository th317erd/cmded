import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

export function STRING(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
    let name = formatName(parsedResult.name);
    let value = parsedResult.value;
    if (value == null)
      return false;

    if (options && typeof options.validate === 'function') {
      let result = options.validate(value, arguments[ 0 ]);
      if (!result)
        return false;
    }

    store({ [ name ]: value });

    return true;
  };

  if (options && options.solo != null)
    runner.parserOptions = { solo: !!options.solo };

  return runner;
}

STRING.wrapper = true;
