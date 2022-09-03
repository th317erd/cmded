import { RunnerContext } from "../runner-context";

export function STRING({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
  let name = formatName(parsedResult.name);
  let value = parsedResult.value;
  if (value == null)
    return false;

  store({ [ name ]: value });

  return true;
}
