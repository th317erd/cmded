import { RunnerContext } from "./runner-context";

export function defaultFormatter(context: RunnerContext, name: string): string {
  return name;
}
