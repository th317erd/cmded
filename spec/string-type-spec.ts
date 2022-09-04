import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../lib';

describe('STRING', () => {
  const integerHandler = ({ $ }: RunnerContext) => {
    return $('--size', Types.STRING());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--size', Types.STRING());
    $('--bytes', Types.STRING());
    $('--count', Types.STRING());

    return hasMatches();
  };

  test('should fail without an argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);
  });

  test('can parse argument', () => {
    let result = CMDed(integerHandler, { argv: [ '--size', 'test' ] });
    expect(result).toEqual({ 'size': 'test' });
  });

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--word', Types.STRING({
        validate: (value: any) => {
          if (value !== 'test')
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--word', 'derp' ], showHelp: jest.fn() });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--word', 'test' ] });
    expect(result).toEqual({ 'word': 'test' });
  });

  test('can parse solo argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.STRING(), { name: 'word' });
    };

    let result = CMDed(validationRunner, { argv: [ 'hello' ] });
    expect(result).toEqual({ 'word': 'hello' });
  });

  test('can parse solo argument beginning with a hyphen', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $(null, Types.STRING(), { name: 'statement' });
    };

    let result = CMDed(validationRunner, { argv: [ '-11' ] });
    expect(result).toEqual({ 'statement': '-11' });
  });


  test('can parse inside multiple arguments', () => {
    let result = CMDed(integerHandler, { argv: [ 'test2', '--size', '123', 'test1' ] });
    expect(result).toEqual({ 'size': '123' });
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
    expect(result).toEqual({ 'size': '123', 'bytes': '1024', 'count': '-10' });

    result = CMDed(multiRunner, { argv: [ 'test', '--size', '123', '--bytes=1024', 'hello', '--count', '-10', 'world' ] });
    expect(result).toEqual({ 'size': '123', 'bytes': '1024', 'count': '-10' });
  });
});
