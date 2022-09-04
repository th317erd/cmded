import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('INTEGER', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.INTEGER());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.INTEGER());
    $('--bytes', Types.INTEGER());
    $('--count', Types.INTEGER());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ] });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '345' ] });
    expect(result).toEqual({ 'size': 345 });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--size', Types.INTEGER({
        validate: (value: any) => {
          if (value > 10)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--size', '11' ] });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--size', '10' ] });
    expect(result).toEqual({ 'size': 10 });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.INTEGER(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '11' ] });
    expect(result).toEqual({ 'size': 11 });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.INTEGER(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '-11' ] });
    expect(result).toEqual({ 'size': -11 });
  });

  test('can parse 543e4 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '543e4' ] });
    expect(result).toEqual({ 'size': 5430000 });
  });

  test('can parse equals=345 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=345' ] });
    expect(result).toEqual({ 'size': 345 });
  });

  test('can parse equals=-543 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=-543' ] });
    expect(result).toEqual({ 'size': -543 });
  });

  test('can parse equals=543e4 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=543e4' ] });
    expect(result).toEqual({ 'size': 5430000 });
  });

  test('can parse equals=+543e3 exponential argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=+543e3' ] });
    expect(result).toEqual({ 'size': 543000 });
  });

  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '123', 'test1' ] });
    expect(result).toEqual({ 'size': 123 });
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
    let result = CMDed(multiRunner, { argv: [ '--size', '123', '--bytes=1024', '--count', '-10' ] });
    expect(result).toEqual({ 'size': 123, 'bytes': 1024, 'count': -10 });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '123', '--bytes=1024', 'hello', '--count', '-10', 'world' ] });
    expect(result).toEqual({ 'size': 123, 'bytes': 1024, 'count': -10 });
  });
});
