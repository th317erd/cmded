import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('DECIMAL', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.DECIMAL());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.DECIMAL());
    $('--bytes', Types.DECIMAL());
    $('--count', Types.DECIMAL());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '345.654' ] });
    expect(result).toEqual({ 'size': 345.654 });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--size', Types.DECIMAL({
        validate: (value: any) => {
          if (value > 10)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--size', '11.12' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--size', '9.65' ] });
    expect(result).toEqual({ 'size': 9.65 });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.DECIMAL(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '11.99' ] });
    expect(result).toEqual({ 'size': 11.99 });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.DECIMAL(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '-11.65' ] });
    expect(result).toEqual({ 'size': -11.65 });
  });

  test('can parse 543e4 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '543.45e4' ] });
    expect(result).toEqual({ 'size': 5434500 });
  });

  test('can parse equals=345 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=345.12' ] });
    expect(result).toEqual({ 'size': 345.12 });
  });

  test('can parse equals=-543 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=-543.55' ] });
    expect(result).toEqual({ 'size': -543.55 });
  });

  test('can parse equals=543e-4 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=543e-4' ] });
    expect(result).toEqual({ 'size': 0.0543 });
  });

  test('can parse equals=+543e3 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=+543.77e-3' ] });
    expect(result).toEqual({ 'size': 0.54377 });
  });

  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '123.987', 'test1' ] });
    expect(result).toEqual({ 'size': 123.987 });
  });

  test('should show help in strict mode', () => {
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
    let result = CMDed(multiRunner, { argv: [ '--size', '123.78', '--bytes=1024.56', '--count', '-10.666' ] });
    expect(result).toEqual({ 'size': 123.78, 'bytes': 1024.56, 'count': -10.666 });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '123', '--bytes=1024.00', 'hello', '--count', '-10', 'world' ] });
    expect(result).toEqual({ 'size': 123, 'bytes': 1024.00, 'count': -10 });
  });
});
