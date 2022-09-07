import Nife from 'nife';
import { GenericObject } from "../common";
import { Runner, RunnerContext } from "../runner-context";
import { GenericRunnerOptions } from "./common";

const KILOBYTES = 1024;
const MEGABYTES = KILOBYTES * 1024;
const GIGABYTES = MEGABYTES * 1024;
const TERABYTES = GIGABYTES * 1024;

const SCALAR_MAP: GenericObject = {
  'b': 1,
  'k': KILOBYTES,
  'm': MEGABYTES,
  'g': GIGABYTES,
  't': TERABYTES,
};

export function BYTES(options?: GenericRunnerOptions): Runner {
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject, runnerOptions: GenericObject): boolean {
    let name = formatName(runnerOptions.name || parsedResult.name);
    if (!(/^\+?[\d.]+(b|k|kb|m|mb|g|gb|t|tb)?$/i).test(parsedResult.value))
      return false;

    let size: string = '';
    let scalar: string = 'b';

    parsedResult.value.replace(/^\+?([\d.]+)(b|k|m|g|t)?/i, (m: string, _size: string, _scalar: string | undefined) => {
      size = _size;
      scalar = (_scalar || 'b').toLowerCase();

      return m;
    });

    if (!size)
      return false;

    let value = parseFloat(size);
    if (!isFinite(value))
      return false;

    let scalarN: number = SCALAR_MAP[ scalar ] || 1;
    value = Math.round(value * scalarN);

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

BYTES.wrapper = true;
