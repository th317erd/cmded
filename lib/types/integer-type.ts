import { RunnerContext } from "../runner-context";

export function INTEGER({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
  let name = formatName(parsedResult.name);
  let value = parseInt(parsedResult.value, 10);
  if (!isFinite(value))
    return false;

  store({ [ name ]: value });

  return true;
}
