import Nife from 'nife';
import { RunnerContext } from "./runner-context";

export function defaultFormatter(name: string, context?: RunnerContext): string {
  return Nife.snakeCaseToCamelCase(name.replace(/\W+/g, '_'));
}
