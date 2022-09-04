import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Arguments, defaultParser, defaultFormatter, RunnerContext, RunnerResult, Types, GenericObject } from '../lib';

describe('RunnerContext', () => {
  let runnerContext: RunnerContext;
  let rootOptions = {
    help: { dude: 'test', subHelp: { hello: 'world' } },
    parser: defaultParser,
    formatter: defaultFormatter,
  };

  beforeEach(() => {
    runnerContext = new RunnerContext({
      rootOptions: rootOptions,
      context: { hello: 'world', empty: null, subContext: { test: true } },
      args: new Arguments([ '--test', 'test2' ]),
      runnerPath: 'a.path',
    });
  });

  describe('rootOptions', () => {
    test('should be able to fetch "rootOptions"', () => {
      expect(runnerContext.rootOptions).toEqual(rootOptions);
    });
  });

  describe('args', () => {
    test('should be able to fetch "args"', () => {
      expect(runnerContext.args.args).toEqual([ '--test', 'test2' ]);
    });
  });

  describe('context', () => {
    test('should be able to fetch "context"', () => {
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, subContext: { test: true } });
    });
  });

  describe('runnerPath', () => {
    test('should be able to fetch "runnerPath"', () => {
      expect(runnerContext.runnerPath).toEqual('a.path');
    });

    test('"runnerPath" should update inside a matcher', () => {
      expect(runnerContext.runnerPath).toEqual('a.path');

      let internalPath: string = '';

      runnerContext.match('--test', (context: RunnerContext): RunnerResult => {
        internalPath = context.runnerPath;
        return true;
      });

      expect(internalPath).toEqual('a.path.test');
    });
  });

  describe('clone', () => {
    test('should be able to clone context without arguments', () => {
      let cloned = runnerContext.clone();
      expect(cloned).not.toBe(runnerContext);
      expect(cloned.rootOptions).toBe(runnerContext.rootOptions);
      expect(cloned.context).toBe(runnerContext.context);
      expect(cloned.args).toBe(runnerContext.args);
      expect(cloned.runnerPath).toBe(runnerContext.runnerPath);
    });

    test('should be able to clone context with arguments', () => {
      let thisRootOptions = {};
      let thisContext = {};
      let thisArgs = runnerContext.args.slice();
      let thisRunnerPath = 'derp';

      let cloned = runnerContext.clone({
        rootOptions: thisRootOptions,
        context: thisContext,
        args: thisArgs,
        runnerPath: thisRunnerPath,
      });

      expect(cloned).not.toBe(runnerContext);
      expect(cloned.rootOptions).toBe(thisRootOptions);
      expect(cloned.context).toBe(thisContext);
      expect(cloned.args).toBe(thisArgs);
      expect(cloned.runnerPath).toBe(thisRunnerPath);
    });
  });

  describe('fetch', () => {
    test('should be able to fetch from the internal context', () => {
      expect(runnerContext.fetch({ hello: 'stuff', derp: 10, empty: true })).toEqual({ hello: 'world', derp: 10, empty: null });
      expect(runnerContext.fetch({ 'subContext.test': false })).toEqual({ test: true });
    });

    test('should be able to fetch single values from the internal context', () => {
      expect(runnerContext.fetch('hello')).toEqual('world');
      expect(runnerContext.fetch('derp')).toEqual(undefined);
      expect(runnerContext.fetch('derp', 10)).toEqual(10);
      expect(runnerContext.fetch('empty')).toEqual(null);
      expect(runnerContext.fetch('empty', true)).toEqual(null);
      expect(runnerContext.fetch('subContext.test', false)).toEqual(true);
    });
  });

  describe('store', () => {
    test('should be able to store to the internal context', () => {
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, subContext: { test: true } });
      runnerContext.store({ derp: true });
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, derp: true, subContext: { test: true } });
      runnerContext.store({ subContext: { deep: 'merging' } });
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, derp: true, subContext: { test: true, deep: 'merging' } });
    });

    test('should be able to store single values to the internal context', () => {
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, subContext: { test: true } });
      runnerContext.store('derp', true);
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, derp: true, subContext: { test: true } });
      runnerContext.store('subContext.deep', 'merging');
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, derp: true, subContext: { test: true, deep: 'merging' } });
    });
  });

  describe('scope', () => {
    test('should be able to create a new scope', () => {
      expect(runnerContext.context).toEqual({ hello: 'world', empty: null, subContext: { test: true } });
      runnerContext.scope('testScope', ({ store }): boolean => {
        store({ derp: true });
        store({ subContext: { deep: 'merging' } });

        return true;
      });

      expect(runnerContext.context).toEqual({
        hello: 'world',
        empty: null,
        subContext: {
          test: true
        },
        testScope: {
          derp: true,
          subContext: { deep: 'merging' },
        },
      });
    });
  });

  describe('parse', () => {
    test('should be able to parse arguments (consuming)', () => {
      let result = runnerContext.parse({
        solo: true,
        consume: true,
        pattern: '--test',
      });

      expect(result).toEqual({
        rawName: '--test',
        name: 'test',
        prefix: '--',
        value: undefined,
        indexes: [ 0 ],
        notConsumed: [],
      });

      expect(runnerContext.args.getUnconsumed()).toEqual([ 1 ]);
    });

    test('should be able to parse arguments (not consuming)', () => {
      let result = runnerContext.parse({
        solo: true,
        consume: false,
        pattern: '--test',
      });

      expect(result).toEqual({
        rawName: '--test',
        name: 'test',
        prefix: '--',
        value: undefined,
        indexes: [ 0 ],
        notConsumed: [ 0 ],
      });

      expect(runnerContext.args.getUnconsumed()).toEqual([ 0, 1 ]);
    });
  });

  describe('match', () => {
    test('should be able to use a wrapped function directly', () => {
      expect(runnerContext.context.test).toEqual(undefined);

      // @ts-ignore
      runnerContext.match('--test', Types.BOOLEAN);

      expect(runnerContext.context.test).toEqual(true);
    });

    test('should be able match against a pattern', () => {
      let result: GenericObject = {};

      runnerContext.match('--test', (context: RunnerContext, parsedResult: GenericObject) => {
        result = parsedResult;
        return true;
      }, { solo: true });

      expect(result).toEqual({
        rawName: '--test',
        name: 'test',
        prefix: '--',
        value: undefined,
        indexes: [ 0 ],
        notConsumed: [],
      });
    });

    test('should be able match against a pattern and format parsed results', () => {
      let result: GenericObject = {};

      runnerContext.match(
        '--test',
        (context: RunnerContext, parsedResult: GenericObject) => {
          result = parsedResult;
          return true;
        },
        {
          solo: true,
          formatParsedResult: (result: GenericObject) => {
            return {
              name: 'duh',
              value: 'wow',
              prefix: result.prefix,
            };
          },
        },
      );

      expect(result).toEqual({
        name: 'duh',
        value: 'wow',
        prefix: '--',
      });
    });

    test('should be able match against no pattern', () => {
      let result: GenericObject = {};

      runnerContext.match(null, (context: RunnerContext, parsedResult: GenericObject) => {
        result = parsedResult;
        return true;
      }, { solo: true, name: 'derp' });

      expect(result).toEqual({
        rawName: 'derp',
        name: 'derp',
        prefix: undefined,
        value: '--test',
        indexes: [ 0 ],
        notConsumed: [],
      });
    });

    test('should be able match against a RegExp pattern', () => {
      let result: GenericObject = {};

      runnerContext.match(/(?<prefix>--)(?<name>test)/, (context: RunnerContext, parsedResult: GenericObject) => {
        result = parsedResult;
        return true;
      });

      expect(Array.prototype.slice.call(result)).toEqual([ "--test", "--", "test" ]);
      expect(result.groups).toEqual({
        prefix: '--',
        name: 'test',
      });
    });

    test('should be able match against a RegExp pattern and format parsed results', () => {
      let result: GenericObject = {};

      runnerContext.match(
        /(?<prefix>--)(?<name>test)/,
        (context: RunnerContext, parsedResult: GenericObject) => {
          result = parsedResult;
          return true;
        },
        {
          formatParsedResult: (result: GenericObject) => {
            return result.groups;
          },
        },
      );

      expect(result).toEqual({
        prefix: '--',
        name: 'test',
      });
    });

    test('should be able match against a custom pattern', () => {
      let result: GenericObject = {};

      runnerContext.match(
        (context: RunnerContext, options: GenericObject, index: number): GenericObject | undefined => {
          let arg = context.args.consume(index);
          if (arg === '--test') {
            return {
              rawName: '--test',
              name: 'test',
              prefix: '--',
              value: undefined,
            };
          }
        },
        (context: RunnerContext, parsedResult: GenericObject) => {
          result = parsedResult;
          return true;
        },
      );

      expect(result).toEqual({
        rawName: '--test',
        name: 'test',
        prefix: '--',
        value: undefined,
      });
    });

    test('should be able match against a custom pattern formatting parsed results', () => {
      let result: GenericObject = {};

      runnerContext.match(
        (context: RunnerContext, options: GenericObject, index: number): GenericObject | undefined => {
          let arg = context.args.consume(index);
          if (arg === '--test') {
            return {
              rawName: '--test',
              name: 'test',
              prefix: '--',
              value: undefined,
            };
          }
        },
        (context: RunnerContext, parsedResult: GenericObject) => {
          result = parsedResult;
          return true;
        },
        {
          formatParsedResult: (result: GenericObject) => {
            return {
              derp: true,
              name: result.name,
            };
          },
        }
      );

      expect(result).toEqual({
        derp: true,
        name: 'test',
      });
    });
  });

  describe('showHelp', () => {
    test('should call console.log', () => {
      jest.spyOn(console, 'log').mockImplementation(() => { });

      runnerContext.showHelp();

      expect(console.log).toHaveBeenCalledWith({ dude: 'test', subHelp: { hello: 'world' } });
    });

    test('should call console.log with correct help when runnerPath is correct', () => {
      jest.spyOn(console, 'log').mockImplementation(() => { });

      let newContext = runnerContext.clone({
        runnerPath: 'subHelp',
      });

      newContext.showHelp();

      expect(console.log).toHaveBeenCalledWith({ hello: 'world' });
    });
  });

  describe('hasMatches', () => {
    test('should properly report if there were matches or not', () => {
      expect(runnerContext.hasMatches()).toEqual(false);

      runnerContext.match('--test', () => {
        return false;
      }, { solo: true });

      expect(runnerContext.hasMatches()).toEqual(false);

      runnerContext.match('test2', () => {
        return true;
      }, { solo: true });

      expect(runnerContext.hasMatches()).toEqual(true);
    });

    test('should properly report if there were matches or not for async runners', async () => {
      expect(runnerContext.hasMatches()).toEqual(false);

      await runnerContext.match('--test', async () => {
        return false;
      }, { solo: true });

      expect(runnerContext.hasMatches()).toEqual(false);

      await runnerContext.match('test2', async () => {
        return true;
      }, { solo: true });

      expect(runnerContext.hasMatches()).toEqual(true);
    });
  });
});
