import { TimeUtil } from '../src/TimeUtil.js';

describe('TimeUtil', () => {
  describe('wait', () => {
    test('resolves after specified duration', async () => {
      const start = Date.now();
      await TimeUtil.wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe('waitRandom', () => {
    test('resolves within min/max range', async () => {
      const start = Date.now();
      await TimeUtil.waitRandom(10, 60);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(5);
    });
  });
});
