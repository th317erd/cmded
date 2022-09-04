import { describe, expect, test } from '@jest/globals';
import { defaultFormatter } from '../lib';

describe('defaultFormatter', () => {
  test('should format as expected', () => {
    expect(defaultFormatter('test1')).toEqual('test1');
    expect(defaultFormatter('use-system-echo')).toEqual('useSystemEcho');
  });
});
