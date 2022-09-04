import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('OCTAL', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.OCTAL());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.OCTAL());
    $('--bytes', Types.OCTAL());
    $('--count', Types.OCTAL());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '0o7' ] });
    expect(result).toEqual({ 'size': 7 });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--size', Types.OCTAL({
        validate: (value: any) => {
          if (value > 10)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--size', '13' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--size', '0o12' ] });
    expect(result).toEqual({ 'size': 10 });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.OCTAL(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '77' ] });
    expect(result).toEqual({ 'size': 63 });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.OCTAL(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '-11' ] });
    expect(result).toEqual({ 'size': -9 });
  });

  test('can parse equals=345 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=0xB' ] });
    expect(result).toEqual({ 'size': 11 });
  });

  test('can parse equals=-543 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=-666' ] });
    expect(result).toEqual({ 'size': -438 });
  });

  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '5', 'test1' ] });
    expect(result).toEqual({ 'size': 5 });
  });

  test.only('should show help in strict mode', () => {
    let showHelp = jest.fn();

    CMDed(
      integerHandler,
      {
        argv: [ 'test1', '--size', '0' ],
        strict: true,
        showHelp,
      }
    );

    expect(showHelp).toHaveBeenCalled();
  });

  test('should show help on failure', () => {
    let showHelp = jest.fn();

    CMDed(
      integerHandler,
      {
        argv: [ 'test1', '--bad', '0' ],
        strict: true,
        showHelp,
      }
    );

    expect(showHelp).toHaveBeenCalled();
  });

  test('can parse multiple arguments', () => {
    let result = CMDed(multiRunner, { argv: [ '--size', '0o67', '--bytes=55', '--count', '-06' ] });
    expect(result).toEqual({ 'size': 55, 'bytes': 45, 'count': -6 });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '66', '--bytes=0', 'hello', '--count', '-0o7', 'world' ] });
    expect(result).toEqual({ 'size': 54, 'bytes': 0, 'count': -7 });
  });
});
