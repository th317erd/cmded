import Nife from 'nife';
import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

export function BOOLEAN(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject, runnerOptions: GenericObject): boolean {
    let name = formatName(runnerOptions.name || parsedResult.name);
    let value = (parsedResult.value == null || (/^true|1$/i).test(parsedResult.value));

    let validate = Nife.get(runnerOptions, 'validate', Nife.get(options, 'validate'));
    if (typeof validate === 'function') {
      let result = validate(value, arguments[ 0 ]);
      if (!result)
        return false;
    }

    let format = Nife.get(runnerOptions, 'format', Nife.get(options, 'format'));
    if (typeof format === 'function')
      value = format(value);

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
