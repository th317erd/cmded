import { RunnerContext } from "../runner-context";

export function BOOLEAN({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
  let name = formatName(parsedResult.name);
  let value = (parsedResult.value == null || (/^true|1$/i).test(parsedResult.value));

  store({ [ name ]: value });

  return true;
}

BOOLEAN.parserOptions = { singleton: true };
