import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('HEX', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.HEX());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.HEX());
    $('--bytes', Types.HEX());
    $('--count', Types.HEX());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', '0xF' ] });
    expect(result).toEqual({ 'size': 15 });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--size', Types.HEX({
        validate: (value: any) => {
          if (value > 10)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--size', '0xF' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--size', '0xA' ] });
    expect(result).toEqual({ 'size': 10 });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.HEX(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '0xFF' ] });
    expect(result).toEqual({ 'size': 255 });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.HEX(), { name: 'size' });
    };

    let result = CMDed(validationRunner, { argv: [ '-0xF' ] });
    expect(result).toEqual({ 'size': -15 });
  });

  test('can parse equals=345 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=0xB' ] });
    expect(result).toEqual({ 'size': 11 });
  });

  test('can parse equals=-543 argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size=-0x5' ] });
    expect(result).toEqual({ 'size': -5 });
  });

  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '0xF', 'test1' ] });
    expect(result).toEqual({ 'size': 15 });
  });

  test('should show help in strict mode', () => {
    let showHelp = jest.fn();

    CMDed(
      integerHandler,
      {
        argv: [ 'test1', '--size', '0x0' ],
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
        argv: [ 'test1', '--bad', '0x0' ],
        strict: true,
        showHelp,
      }
    );

    expect(showHelp).toHaveBeenCalled();
  });

  test('can parse multiple arguments', () => {
    let result = CMDed(multiRunner, { argv: [ '--size', '0x05', '--bytes=0xFF', '--count', '-0x06' ] });
    expect(result).toEqual({ 'size': 5, 'bytes': 255, 'count': -6 });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '0xAF', '--bytes=0xAA', 'hello', '--count', '-0x10', 'world' ] });
    expect(result).toEqual({ 'size': 175, 'bytes': 170, 'count': -16 });
  });
});
