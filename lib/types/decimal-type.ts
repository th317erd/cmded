import Nife from 'nife';
import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

export function DECIMAL(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject, runnerOptions: GenericObject): boolean {
    let name = formatName(runnerOptions.name || parsedResult.name);
    if (!(/^[+-]?(\d*.\d+|\d+.\d*)(e[+-]?\d+)?$/).test(parsedResult.value))
      return false;

    let value = parseFloat(parsedResult.value);
    if (!isFinite(value))
      return false;

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

  if (options && options.solo != null)
    runner.parserOptions = { solo: !!options.solo };

  return runner;
}

DECIMAL.wrapper = true;
