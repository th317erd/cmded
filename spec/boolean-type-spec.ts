import { describe, expect, test, jest } from '@jest/globals';
import { CMDed, RunnerContext, RunnerResult, Types } from '../';

describe('BOOLEAN', () => {
  const booleanHandler = ({ $ }: RunnerContext) => {
    return $('--enable', Types.BOOLEAN());
  };

  const multiRunner = ({ $, hasMatches }: RunnerContext): RunnerResult => {
    $('--enable', Types.BOOLEAN());
    $('--test', Types.BOOLEAN());
    $('--hello', Types.BOOLEAN());

    return hasMatches();
  };

  test('can parse and validate argument', () => {
    const validationRunner = ({ $ }: RunnerContext) => {
      return $('--enable', Types.BOOLEAN({
        validate: (value: any) => {
          if (!value)
            return false;

          return true;
        },
      }));
    };

    let result = CMDed(validationRunner, { argv: [ '--enable=false' ] });
    expect(result).toEqual(undefined);

    result = CMDed(validationRunner, { argv: [ '--enable' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('should work with async runner', async () => {
    let result = await CMDed(async (context: RunnerContext) => booleanHandler(context), { argv: [ '--enable' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('can parse standalone boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('can parse equals=false boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable=false' ] });
    expect(result).toEqual({ 'enable': false });
  });

  test('can parse equals=0 boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable=0' ] });
    expect(result).toEqual({ 'enable': false });
  });

  test('can parse equals=true boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable=true' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('can parse equals=TRUE boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable=TRUE' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('can parse equals=1 boolean flags', () => {
    let result = CMDed(booleanHandler, { argv: [ '--enable=1' ] });
    expect(result).toEqual({ 'enable': true });
  });

  test('should show help in strict mode', () => {
    let showHelp = jest.fn();

    CMDed(
      booleanHandler,
      {
        argv: [ 'test1', '--enable', '0' ],
        strict: true,
        showHelp,
      }
    );

    expect(showHelp).toHaveBeenCalled();
  });

  test('should show help on failure', () => {
    let showHelp = jest.fn();

    CMDed(
      booleanHandler,
      {
        argv: [ 'test1', '--bad', '0' ],
        strict: true,
        showHelp,
      }
    );

    expect(showHelp).toHaveBeenCalled();
  });

  test('can parse multiple flags', () => {
    let result = CMDed(multiRunner, { argv: [ '--enable' ] });
    expect(result).toEqual({ 'enable': true });

    result = CMDed(multiRunner, { argv: [ '--enable=true', '--test', '--hello=false' ] });
    expect(result).toEqual({ 'enable': true, 'test': true, 'hello': false });
  });
});
