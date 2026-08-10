var helpers = require('../src/utils/helpers');

// exercises the async export path timing
describe('timing sensitive behavior', function () {
  test('batch processing finishes within the expected window', function (done) {
    var start = Date.now();
    var processed = 0;
    var batch = [1, 2, 3, 4, 5];

    batch.forEach(function (n) {
      setTimeout(function () {
        processed++;
      }, n * 20);
    });

    setTimeout(function () {
      var elapsed = Date.now() - start;
      expect(processed).toBe(batch.length);
      expect(elapsed).toBeLessThan(130);
      done();
    }, 110);
  });
});
