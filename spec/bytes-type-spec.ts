import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('BYTES', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.BYTES());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.BYTES());
    $('--bytes', Types.BYTES());
    $('--count', Types.BYTES());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '10k' ] });
    expect(result).toEqual({ 'size': 10240 });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--size', Types.BYTES({
        validate: (value: any) => {
          if (value > 1000)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--size', '1k' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--size', '1000b' ] });
    expect(result).toEqual({ 'size': 1000 });

    result = CMDed(validationRunner, { argv: [ '--size', '100' ] });
    expect(result).toEqual({ 'size': 100 });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.BYTES(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '10m' ] });
    expect(result).toEqual({ 'size': 10485760 });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.BYTES(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '1.5m' ] });
    expect(result).toEqual({ 'size': 1572864 });
  });

  test('can parse equals=123 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=123' ] });
    expect(result).toEqual({ 'size': 123 });
  });

  test('can parse equals=54gb argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=54gb' ] });
    expect(result).toEqual({ 'size': 57982058496 });
  });

  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '64k', 'test1' ] });
    expect(result).toEqual({ 'size': 65536 });
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
    let result = CMDed(multiRunner, { argv: [ '--size', '10b', '--bytes=12k', '--count', '16mb' ] });
    expect(result).toEqual({ 'size': 10, 'bytes': 12288, 'count': 16777216 });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '1024', '--bytes=1m', 'hello', '--count', '1g', 'world' ] });
    expect(result).toEqual({ 'size': 1024, 'bytes': 1048576, 'count': 1073741824 });
  });
});
