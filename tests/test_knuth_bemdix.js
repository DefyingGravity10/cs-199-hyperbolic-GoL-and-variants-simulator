// Generated by CoffeeScript 2.7.0
(function() {
  var RewriteRuleset, assert, overlap, shortLex, splitBy;

  ({shortLex, overlap, splitBy, RewriteRuleset} = require("../src/core/knuth_bendix"));

  //M = require "../src/core/matrix3"
  assert = require("assert");

  describe("TestComparatros", function() {
    return it("checks shortlex", function() {
      assert.ok(shortLex("", "a"));
      assert.ok(shortLex("", ""));
      assert.ok(shortLex("a", "a"));
      assert.ok(shortLex("a", "a"));
      assert.ok(shortLex("a", "bb"));
      assert.ok(shortLex("a", "b"));
      return assert.ok(!(shortLex("bb", "a")));
    });
  });

  describe("RewriteRuleset", function() {
    it("must support construction", function() {
      var r, r2, r3;
      r = new RewriteRuleset({
        "aa": "",
        "AAA": "a"
      });
      it("must support copying", function() {
        var r1;
        r1 = r.copy();
        assert.ok(r !== r1);
        assert.ok(r.equals(r1));
        return assert.ok(r1.equals(r));
      });
      r2 = new RewriteRuleset({
        "aa": "a"
      });
      assert.ok(!r.equals(r2));
      assert.ok(!r2.equals(r));
      r3 = new RewriteRuleset({
        "AAA": "a",
        "aa": ""
      });
      assert.ok(r.equals(r3));
      return assert.ok(r3.equals(r));
    });
    it("must rewrite according to the rules", function() {
      var r;
      r = new RewriteRuleset({
        "aa": ""
      });
      assert.equal(r.rewrite(""), "");
      assert.equal(r.rewrite("a"), "a");
      assert.equal(r.rewrite("aa"), "");
      assert.equal(r.rewrite("b"), "b");
      assert.equal(r.rewrite("ba"), "ba");
      return assert.equal(r.rewrite("baa"), "b");
    });
    return it("must apply rewrites multiple times", function() {
      var r;
      r = new RewriteRuleset({
        "bc": "BC",
        "ABC": "alphabet"
      });
      assert.equal(r.rewrite("bc"), "BC");
      assert.equal(r.rewrite("abc"), "aBC");
      assert.equal(r.rewrite("Abc"), "alphabet");
      return assert.equal(r.rewrite("AAbc"), "Aalphabet");
    });
  });

  describe("TestSplits", function() {
    var assertOverlap, assertSplit;
    assertOverlap = function(s1, s2, x, y, z) {
      return assert.deepEqual(overlap(s1, s2), [x, y, z]);
    };
    assertSplit = function(s1, s2, hasSplit, x, z) {
      return assert.deepEqual(splitBy(s1, s2), [hasSplit, x != null ? x : null, z != null ? z : null]);
    };
    it("tests split", function() {
      assertSplit("123456", "34", true, "12", "56");
      assertSplit("123456", "35", false, null, null);
      assertSplit("123456", "123456", true, "", "");
      return assertSplit("123456", "456", true, "123", "");
    });
    return it("tests overlap", function() {
      assertOverlap("123", "234", "1", "23", "4");
      assertOverlap("123", "1234", "", "123", "4");
      assertOverlap("123", "123", "", "123", "");
      assertOverlap("1123", "2345", "11", "23", "45");
      return assertOverlap("1123", "22345", "1123", "", "22345");
    });
  });

}).call(this);
