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
  const runner = function ({ formatName, store }: RunnerContext, parsedResult: GenericObject): boolean {
    let name = formatName(parsedResult.name);
    if (!(/^\d+(b|k|kb|m|mb|g|gb|t|tb)?$/i).test(parsedResult.value))
      return false;

    let size: string = '';
    let scalar: string = 'b';

    parsedResult.value.replace(/^(\d+)(b|k|m|g|t)?/, (m: string, _size: string, _scalar: string | undefined) => {
      size = _size;
      scalar = (_scalar || 'b').toLowerCase();

      return m;
    });

    if (!size)
      return false;

    let value = parseInt(size, 10);
    if (!isFinite(value))
      return false;

    let scalarN: number = SCALAR_MAP[ scalar ] || 1;
    value *= scalarN;

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

BYTES.wrapper = true;
