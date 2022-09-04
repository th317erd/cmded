import { describe, expect, test, beforeEach } from '@jest/globals';
import { Arguments } from '../lib';

describe('Arguments', () => {
  let args: Arguments;

  beforeEach(() => {
    args = new Arguments([ 'test1', 'test2' ]);
  });

  describe('currentIndex', () => {
    test('shouldn\'t update with a "get" call', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.get()).toEqual('test1');
      expect(args.currentIndex).toEqual(0);
    });

    test('should update with a "consume" call', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume()).toEqual('test1');
      expect(args.currentIndex).toEqual(1);
    });

    test('shouldn\'t update with a "consume" call beyond the boundary of the arguments', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume(4)).toEqual(undefined);
      expect(args.currentIndex).toEqual(0);

      expect(args.consume(-1)).toEqual(undefined);
      expect(args.currentIndex).toEqual(0);
    });

    test('should update with an "unconsume" call', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume()).toEqual('test1');
      expect(args.consume()).toEqual('test2');
      expect(args.currentIndex).toEqual(2);

      expect(args.unconsume(0)).toEqual('test1');
      expect(args.currentIndex).toEqual(0);
    });

    test('shouldn\'t update with an "unconsume" call beyond the boundary of the arguments', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume()).toEqual('test1');
      expect(args.consume()).toEqual('test2');
      expect(args.currentIndex).toEqual(2);

      expect(args.unconsume(-1)).toEqual(undefined);
      expect(args.currentIndex).toEqual(2);

      expect(args.unconsume(3)).toEqual(undefined);
      expect(args.currentIndex).toEqual(2);
    });
  });

  describe('get', () => {
    test('should return undefined if "get" is called beyond the boundary of the arguments', () => {
      expect(args.get(-1)).toEqual(undefined);
      expect(args.get(2)).toEqual(undefined);
    });
  });

  describe('consume', () => {
    test('should return undefined if "consume" is called beyond the boundary of the arguments', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume(-1)).toEqual(undefined);
      expect(args.consume(2)).toEqual(undefined);
      expect(args.currentIndex).toEqual(0);
    });

    test('shouldn\'t be able to "consume" twice on the same argument', () => {
      expect(args.currentIndex).toEqual(0);
      expect(args.consume(0)).toEqual('test1');
      expect(args.consume(0)).toEqual(undefined);
      expect(args.currentIndex).toEqual(1);
    });
  });

  describe('unconsume', () => {
    test('should return undefined if "unconsume" is called beyond the boundary of the arguments', () => {
      expect(args.consume(0)).toEqual('test1');
      expect(args.currentIndex).toEqual(1);
      expect(args.unconsume(-1)).toEqual(undefined);
      expect(args.unconsume(2)).toEqual(undefined);
      expect(args.currentIndex).toEqual(1);
    });
  });

  describe('slice', () => {
    test('should be able to slice arguments', () => {
      expect(args.args).toEqual([ 'test1', 'test2' ]);
      expect(args.slice(-1).args).toEqual([ 'test2' ]);
      expect(args.slice(-1).getConsumedIndexes()).toEqual([]);

      expect(args.slice(0, 1).args).toEqual([ 'test1' ]);
      expect(args.slice(0, -1).args).toEqual([ 'test1' ]);

      expect(args.consume(1)).toEqual('test2');
      expect(args.slice(-1).args).toEqual([ 'test2' ]);
      expect(args.slice(-1).getConsumedIndexes()).toEqual([ 0 ]);
    });
  });

  describe('resetConsumed', () => {
    test('should be able to reset consumed arguments', () => {
      expect(args.consume(0)).toEqual('test1');
      expect(args.consume(1)).toEqual('test2');
      expect(args.getConsumedIndexes()).toEqual([ 0, 1 ]);
      expect(args.currentIndex).toEqual(2);

      args.resetConsumed();
      expect(args.getConsumedIndexes()).toEqual([]);
      expect(args.currentIndex).toEqual(2);
    });
  });

  describe('resetIndex', () => {
    test('should be able to reset currentIndex', () => {
      expect(args.consume(0)).toEqual('test1');
      expect(args.consume(1)).toEqual('test2');
      expect(args.getConsumedIndexes()).toEqual([ 0, 1 ]);
      expect(args.currentIndex).toEqual(2);

      args.resetIndex();
      expect(args.getConsumedIndexes()).toEqual([ 0, 1 ]);
      expect(args.currentIndex).toEqual(0);
    });
  });

  describe('reset', () => {
    test('should be able to reset everything', () => {
      expect(args.consume(0)).toEqual('test1');
      expect(args.consume(1)).toEqual('test2');
      expect(args.getConsumedIndexes()).toEqual([ 0, 1 ]);
      expect(args.currentIndex).toEqual(2);

      args.reset();
      expect(args.getConsumedIndexes()).toEqual([]);
      expect(args.currentIndex).toEqual(0);
    });
  });
});
