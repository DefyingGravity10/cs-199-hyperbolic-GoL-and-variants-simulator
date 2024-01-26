// Generated by CoffeeScript 2.7.0
(function() {
  var assert, fminsearch, near;

  assert = require("assert");

  ({fminsearch} = require("../src/core/fminsearch"));

  near = function(x, y, eps = 1e-5) {
    return Math.abs(x - y) < eps;
  };

  describe("fminsearch", function() {
    it("should find minimum of function of one argument (x-1)^2", function() {
      var f, res;
      f = function([x]) {
        return (x - 1) ** 2;
      };
      res = fminsearch(f, [0, 0], 0.1);
      assert.ok(res.reached);
      return assert.ok(near(res.x[0], 1.0));
    });
    it("should find minimum of (x-1)^2 + (y-1)^2", function() {
      var f, res;
      f = function([x, y]) {
        return (x - 1) ** 2 + (y - 2) ** 2;
      };
      res = fminsearch(f, [0, 0], 0.1);
      //console.log "solved:"
      //console.dir res
      assert.ok(res.reached);
      assert.ok(near(res.x[0], 1.0));
      return assert.ok(near(res.x[1], 2.0));
    });
    it("should find minimum of function of 4 arguments: (x-1)^2 + (y-1)^2 + (z-3)^2 + (t-4)^4", function() {
      var f, res;
      f = function([x, y, z, t]) {
        return (x - 1) ** 2 + (y - 2) ** 2 + (z - 3) ** 2 + (t - 4) ** 4;
      };
      res = fminsearch(f, [0, 0, 0, 0], 0.1);
      //console.log "solved:"
      //console.dir res
      assert.ok(res.reached);
      assert.ok(near(res.x[0], 1.0));
      assert.ok(near(res.x[1], 2.0));
      assert.ok(near(res.x[2], 3.0));
      return assert.ok(near(res.x[3], 4.0));
    });
    return it("should find minimum of the rozenbrock function, (1-x)**2 + 100*(y-x**2)**2", function() {
      var f, res;
      f = function([x, y]) {
        return (1 - x) ** 2 + 100 * (y - x ** 2) ** 2;
      };
      res = fminsearch(f, [0, 0], 0.1);
      //console.log "solved:"
      //console.dir res
      assert.ok(res.reached);
      assert.ok(near(res.x[0], 1.0));
      return assert.ok(near(res.x[1], 1.0));
    });
  });

}).call(this);
