/* jshint node: true */
//"use strict";


// Holds last iteration timestamp.
var t = 0;

/**
 * Calls `fn` on next frame.
 *
 * @param  {Function} fn The function
 * @return {int} The request ID
 * @api private
 */
function raf(fn) {
  return window.requestAnimationFrame(function() {
    var n = Date.now();
    var e = n - t;

    if (e > 999) {
      e = 1 / 60;
    } else {
      e /= 1000;
    }

    t = n;
    fn(e);
  });
}

module.exports = {
  /**
   * Calls `fn` on every frame with `elapsed` set to the elapsed
   * time in milliseconds.
   *
   * @param  {Function} fn The function
   * @return {int} The request ID
   * @api public
   */
  start: function(fn) {
    return raf(function tick(e) {
      fn(e);
      raf(tick);
    });
  },
  /**
   * Cancels the specified animation frame request.
   *
   * @param {int} id The request ID
   * @api public
   */
  /*stop: function(id) {
    window.cancelAnimationFrame(id);
  }*/
};
