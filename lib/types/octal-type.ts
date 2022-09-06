import Nife from 'nife';
import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

export function OCTAL(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject, runnerOptions: GenericObject): boolean {
    let name = formatName(runnerOptions.name || parsedResult.name);
    if (!(/^[+-]?(0o)?[0-7]+$/i).test(parsedResult.value))
      return false;

    let value = parseInt(parsedResult.value.replace(/^([+-]?)(0o)?/, '$1'), 8);
    if (!isFinite(value))
      return false;

    let validate = Nife.get(runnerOptions, 'validate', Nife.get(options, 'validate'));
    if (typeof validate === 'function') {
      let result = validate(value, arguments[ 0 ]);
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

OCTAL.wrapper = true;
