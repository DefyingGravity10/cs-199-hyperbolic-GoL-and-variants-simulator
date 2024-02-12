// Generated by CoffeeScript 2.7.0
(function () {
  //Generates JS code that effectively rewrites
  /*
  #Every string is a sequence of powers of 2 operators: A and B.
  #powers are limited to be in range -n/2 ... n/2 and -m/2 ... m/2
   *
   *
  #rewrite rules work on these pow cahins:
   *
   *
  #Trivial rewrites:
   *   a^-1 a       -> e
   *   b^-1 b       -> e
   *   a a^-1       -> e
   *   b b^-1       -> e
   *
  #Power modulo rewrites.
   *   b^2  -> b^-2
   *   b^-3 -> b
   *   #allower powers: -2, -1, 1
   *   #rewrite rule: (p + 2)%4-2
   *
   *   a^2  -> a^-2
   *   a^-3 -> a
   *   #allower powers: -2, -1, 1
   *   #rewrite rule: (p+2)%4-2
   *
  #Non-trivial rewrites
   * Ending with b
   *   a b  -> b^-1 a^-1
   *   b^-1 a^-1 b^-1       -> a       *
   *   a b^-2       -> b^-1 a^-1 b     *
   *   b a^-1 b^-1  -> b^-2 a          *
   *
   * Ending with a
   *   b a  -> a^-1 b^-1
   *   a^-1 b^-1 a^-1       -> b       *
   *   a b^-1 a^-1  -> a^-2 b          *
   *   b a^-2       -> a^-1 b^-1 a     *
   *
   *
  #As a tree, sorted in reverse order. Element in square braces is "eraser" for the last element in the matching pattern.
   *
  #- Root B
   *  - b^-2   
   *    - a       REW: [a^-1] b^-1 a^-1 b
   *  - b^-1
   *    - a^-1
   *       - b    REW: [b^-1] b^-2 a
   *       - b^-1 REW: [b] a
   *  - b
   *    - a       REW: [a^-1] b^-1 a^-1
   *
  #- Root A
   *  - a^-2 
   *    - b       REW: [b^-1] a^-1 b^-1 a
   *  - a^-1
   *    - b^-1
   *       - a    REW: [a^-1] a^-2 b
   *       - a^-1 REW: [a] b
   *  - a
   *    - b       REW: [b^-1] a^-1 b^-1
   *   
  #Idea: 2 rewriters. For chains ending with A and with B.
  #Chains are made in functional style, stored from end. 
   *
   *
  #See sample_rewriter.js for working code.
   *    
   */
  var CodeGenerator,
    JsCodeGenerator,
    NodeA,
    NodeB,
    RewriteRuleset,
    chain2string,
    collectPowers,
    elementOrder,
    elementPowerRange,
    extendLastPowerRewriteTable,
    groupByPower,
    groupPowersVd,
    makeAppendRewrite,
    makeAppendRewriteRef,
    mod,
    newNode,
    nodeConstructors,
    otherElem,
    powerRewriteRules,
    repeat,
    repeatRewrite,
    reverseSuffixTable,
    string2chain,
    tailInRewriteTable,
    ungroupPowersVd,
    unity,
    vdRule;

  ({ RewriteRuleset } = require("./knuth_bendix.js"));

  ({ unity, NodeA, NodeB, nodeConstructors, newNode } = require("./vondyck_chain.js"));

  collectPowers = function (elemsWithPowers) {
    /* List (elem, power::int) -> List (elem, power::int)
     */
    var elem, grouped, j, len, newPower, power;
    grouped = [];
    for (j = 0, len = elemsWithPowers.length; j < len; j++) {
      [elem, power] = elemsWithPowers[j];
      if (grouped.length === 0) {
        grouped.push([elem, power]);
      } else if (grouped[grouped.length - 1][0] === elem) {
        newPower = grouped[grouped.length - 1][1] + power;
        if (newPower !== 0) {
          grouped[grouped.length - 1][1] = newPower;
        } else {
          grouped.pop();
        }
      } else {
        grouped.push([elem, power]);
      }
    }
    return grouped;
  };

  exports.groupByPower = groupByPower = function (s) {
    var i, j, last, lastPow, ref, result, x;
    last = null;
    lastPow = null;
    result = [];
    for (i = j = 0, ref = s.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      x = s[i];
      if (last === null) {
        last = x;
        lastPow = 1;
      } else {
        if (x === last) {
          lastPow += 1;
        } else {
          result.push([last, lastPow]);
          last = x;
          lastPow = 1;
        }
      }
    }
    if (last !== null) {
      result.push([last, lastPow]);
    }
    return result;
  };

  //collect powers, assuming convention that uppercase letters degignate negative powers
  exports.groupPowersVd = groupPowersVd = function (s) {
    var j, len, p, ref, results, x;
    ref = groupByPower(s);
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      [x, p] = ref[j];
      if (x.toUpperCase() === x) {
        results.push([x.toLowerCase(), -p]);
      } else {
        results.push([x, p]);
      }
    }
    return results;
  };

  otherElem = function (e) {
    return {
      a: "b",
      b: "a"
    }[e];
  };

  mod = function (x, y) {
    return ((x % y) + y) % y;
  };

  exports.JsCodeGenerator = JsCodeGenerator = class JsCodeGenerator {
    constructor(debug = false, pretty = false) {
      this.out = [];
      this.ident = 0;
      this.debug = debug;
      this.pretty = pretty;
    }

    get() {
      var code;
      if (this.ident !== 0) {
        throw new RuntimeError("Attempt to get generated code while not finished");
      }
      code = this.out.join("");
      this.reset();
      return code;
    }

    reset() {
      return (this.out = []);
    }

    line(text) {
      var i, j, ref;
      if (!this.debug && text.match(/^console\.log/)) {
        return;
      }
      if (!this.pretty && text.match(/^\/\//)) {
        return;
      }
      if (this.pretty || text.match(/\/\//)) {
        for (i = j = 0, ref = this.ident; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          this.out.push("    ");
        }
      }
      this.out.push(text);
      return this.out.push(this.pretty ? "\n" : " ");
    }

    if_(conditionText) {
      return this.line(`if(${conditionText})`);
    }

    op(expressionText) {
      return this.line(`${expressionText};`);
    }

    block(callback) {
      this.line("{");
      this.ident += 1;
      callback();
      this.ident -= 1;
      return this.line("}");
    }
  };

  exports.CodeGenerator = CodeGenerator = class CodeGenerator extends JsCodeGenerator {
    constructor(rewriteTable, out, debug = false, pretty = false) {
      var powerRewrites, rangeA, rangeB;
      super(debug, pretty);
      powerRewrites = powerRewriteRules(rewriteTable);
      rangeA = elementPowerRange(powerRewrites, "a");
      rangeB = elementPowerRange(powerRewrites, "b");
      this.minPower = {
        a: rangeA[0],
        b: rangeB[0]
      };
      this.elementOrder = {
        a: elementOrder(powerRewrites, "a"),
        b: elementOrder(powerRewrites, "b")
      };

      //extend rewrite table with new rules
      rewriteTable = rewriteTable.copy();
      extendLastPowerRewriteTable(rewriteTable, "a", rangeA[0], rangeA[1]);
      extendLastPowerRewriteTable(rewriteTable, "b", rangeB[0], rangeB[1]);
      this.rewriteTable = rewriteTable;
      this.suffixTree = reverseSuffixTable(rewriteTable);
    }

    generateAppendRewriteOnce() {
      this.line("(function(chain, stack )");
      this.block(() => {
        this.line("if (stack.length === 0) {throw new Error('empty stack');}");
        this.op("var _e = stack.pop(), element = _e[0], power = _e[1]");
        this.line("if (chain === unity)");
        this.block(() => {
          this.line("//empty chain");
          this.line('console.log("Append to empth chain:"+_e);');
          this.line(
            `var order=(element==='a')?${this.elementOrder["a"]}:${this.elementOrder["b"]};`
          );
          this.line(`var lowestPow=(element==='a')?${this.minPower["a"]}:${this.minPower["b"]};`);
          return this.line(
            "chain = newNode( element, mod(power-lowestPow, order)+lowestPow, chain);"
          );
        });
        this.line("else");
        this.block(() => {
          return this.generateMain();
        });
        return this.line("return chain;");
      });
      this.line(")");
      return this.get();
    }

    generateMain() {
      this.line('if (chain.letter==="a")');
      this.block(() => {
        this.line('console.log("Append "+JSON.stringify(_e)+" to chain ending with A:"+chain);');
        this.generatePowerAccumulation("a");
        return this.generateRewriterFrom("b");
      });
      this.line('else if (chain.letter==="b")');
      this.block(() => {
        this.line('console.log("Append "+JSON.stringify(_e)+" to chain ending with B:"+chain);');
        this.generatePowerAccumulation("b");
        return this.generateRewriterFrom("a");
      });
      return this.line('else throw new Error("Chain neither a nor b?");');
    }

    generatePowerAccumulation(letter) {
      this.line(`if (element === \"${letter}\")`);
      return this.block(() => {
        var lowestPow, order;
        this.line(`console.log(\"    element is ${letter}\");`);
        lowestPow = this.minPower[letter];
        order = this.elementOrder[letter];
        this.line(
          `var newPower = ((chain.p + power - ${lowestPow})%${order}+${order})%${order}+${lowestPow};`
        );
        this.line("chain = chain.t;");
        this.line("if (newPower !== 0)");
        this.block(() => {
          var nodeClass;
          nodeClass = this._nodeClass(letter);
          this.line('console.log("    new power is "+newPower);');
          //and append modified power to the stack
          return this.line(`stack.push(['${letter}', newPower]);`);
        });
        if (this.debug) {
          this.line("else");
          return this.block(() => {
            return this.line('console.log("      power reduced to 0, new chain="+chain);');
          });
        }
      });
    }

    generateRewriterFrom(newElement) {
      /*Generate rewriters, when `newElement` is added, and it is not the same as the last element of the chain*/
      this.line("else");
      return this.block(() => {
        var mo, nodeConstructor, o;
        this.line(`//Non-trivial rewrites, when new element is ${newElement}`);
        nodeConstructor = this._nodeClass(newElement);
        o = this.elementOrder[newElement];
        mo = this.minPower[newElement];
        this.line(
          `chain = new ${nodeConstructor}((((power - ${mo})%${o}+${o})%${o}+${mo}), chain);`
        );
        return this.generateRewriteBySuffixTree(newElement, this.suffixTree, "chain");
      });
    }

    generateRewriteBySuffixTree(newElement, suffixTree, chain) {
      var compOperator, e_p, e_p_str, elem, elemPower, first, isLeaf, results, subTable, suf;
      first = true;
      results = [];
      for (e_p_str in suffixTree) {
        subTable = suffixTree[e_p_str];
        e_p = JSON.parse(e_p_str);
        this.line(`// e_p = ${JSON.stringify(e_p)}`);
        [elem, elemPower] = e_p;
        if (elem !== newElement) {
          continue;
        }
        if (!first) {
          this.line("else");
        } else {
          first = false;
        }
        isLeaf = subTable["rewrite"] != null;
        if (isLeaf) {
          compOperator = elemPower < 0 ? "<=" : ">=";
          suf = subTable["original"];
          this.line(`//reached suffix: ${suf}`);
          this.line(`if (${chain}.p${compOperator}${elemPower})`);
          this.line(`// before call leaf: ep = ${elemPower}`);
          results.push(
            this.block(() => {
              return this.generateLeafRewrite(elem, elemPower, subTable["rewrite"], chain);
            })
          );
        } else {
          this.line(`if (${chain}.p === ${elemPower})`);
          results.push(
            this.block(() => {
              this.line(`if (${chain}.t)`);
              return this.block(() => {
                return this.generateRewriteBySuffixTree(
                  otherElem(newElement),
                  subTable,
                  chain + ".t"
                );
              });
            })
          );
        }
      }
      return results;
    }

    generateLeafRewrite(elem, elemPower, rewrite, chain) {
      var e, p, revRewrite, sPowers;
      if (elemPower == null) {
        throw new Error("power?");
      }
      this.line(`console.log( 'Leaf: rewrite this to ${rewrite}');`);
      this.line(`//elem: ${elem}, power: ${elemPower}: rewrite this to ${rewrite}`);
      this.line(
        `console.log( 'Truncate chain from ' + chain + ' to ' + ${chain} + ' with additional elem: ${elem}^${-elemPower}' );`
      );
      this.line(`chain = ${chain};`);
      this.line("//Append rewrite");
      revRewrite = rewrite.slice(0);
      revRewrite.reverse();
      revRewrite.push([elem, -elemPower]);
      sPowers = (function () {
        var j, len, ref, results;
        ref = collectPowers(revRewrite);
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          [e, p] = ref[j];
          results.push(`[\"${e}\",${p}]`);
        }
        return results;
      })().join(",");
      return this.line(`stack.push(${sPowers});`);
    }

    _nodeClass(letter) {
      return {
        a: "NodeA",
        b: "NodeB"
      }[letter];
    }
  };

  //extracts from table rules, rewriting single powers
  powerRewriteRules = function (rewriteTable) {
    var gKey, gRewrite, j, key, len, p, p1, ref, result, rewrite, x, x_;
    result = [];
    ref = rewriteTable.items();
    for (j = 0, len = ref.length; j < len; j++) {
      [key, rewrite] = ref[j];
      gKey = groupPowersVd(key);
      gRewrite = groupPowersVd(rewrite);
      if (gKey.length === 1 && gRewrite.length === 1) {
        [x, p] = gKey[0];
        [x_, p1] = gRewrite[0];
        if (x === x_) {
          result.push([x, p, p1]);
        }
      }
    }
    return result;
  };

  //for given lsit of power rewrites, return range of allowed powers for element
  // (range bounds are inclusive)
  elementPowerRange = function (powerRewrites, letter) {
    /*search for rules of type a^n -> a^m*/
    var maxPower, minPower, p1, p2, powers, x;
    powers = (function () {
      var j, len, results;
      results = [];
      for (j = 0, len = powerRewrites.length; j < len; j++) {
        [x, p1, p2] = powerRewrites[j];
        if (x === letter) {
          results.push(p1);
        }
      }
      return results;
    })();
    if (powers.length === 0) {
      throw new Error(`No power rewrites for ${letter}`);
    }
    minPower = Math.min(...powers) + 1;
    maxPower = Math.max(...powers) - 1;
    return [minPower, maxPower];
  };

  elementOrder = function (powerRewrites, letter) {
    var orders, p1, p2, x;
    orders = (function () {
      var j, len, results;
      results = [];
      for (j = 0, len = powerRewrites.length; j < len; j++) {
        [x, p1, p2] = powerRewrites[j];
        if (x === letter) {
          results.push(Math.abs(p1 - p2));
        }
      }
      return results;
    })();
    if (orders.length === 0) {
      throw new Error(`No power rewrites for ${letter}`);
    }
    return Math.min(...orders);
  };

  reverseSuffixTable = function (ruleset, ignorePowers = true) {
    var e_p, e_p_str, gRewrite, gSuffix, j, l, len, ref, revTable, rewrite, suffix, table, table1;
    revTable = {};
    ref = ruleset.items();
    for (j = 0, len = ref.length; j < len; j++) {
      [suffix, rewrite] = ref[j];
      gSuffix = groupPowersVd(suffix);
      //gSuffix.reverse()
      gRewrite = groupPowersVd(rewrite);
      //gRewrite.reverse()
      if (ignorePowers) {
        if (gSuffix.length === 1 && gRewrite.length === 1 && gSuffix[0][0] === gRewrite[0][0]) {
          continue;
        }
        if (gSuffix.length === 2 && gRewrite.length === 0) {
          continue;
        }
      }
      table = revTable;
      for (l = gSuffix.length - 1; l >= 0; l += -1) {
        e_p = gSuffix[l];
        e_p_str = JSON.stringify(e_p);
        if (table.hasOwnProperty(e_p_str)) {
          table = table[e_p_str];
        } else {
          table1 = {};
          table[e_p_str] = table1;
          table = table1;
        }
      }
      table["rewrite"] = gRewrite;
      table["original"] = gSuffix;
    }
    return revTable;
  };

  exports.repeatRewrite = repeatRewrite = function (appendRewriteOnce) {
    return function (chain, stack) {
      while (stack.length > 0) {
        chain = appendRewriteOnce(chain, stack);
      }
      return chain;
    };
  };

  exports.canAppend = function (appendRewriteOnce) {
    return function (chain, element, power) {
      var stack;
      stack = [[element, power]];
      appendRewriteOnce(chain, stack);
      return stack.length === 0;
    };
  };

  exports.makeAppendRewrite = makeAppendRewrite = function (s) {
    var appendRewrite, appendRewriteOnce, g, rewriterCode;
    g = new CodeGenerator(s);
    g.debug = false;
    rewriterCode = g.generateAppendRewriteOnce();
    //console.log rewriterCode
    appendRewriteOnce = eval(rewriterCode);
    if (appendRewriteOnce == null) {
      throw new Error("Rewriter failed to compile");
    }
    appendRewrite = repeatRewrite(appendRewriteOnce);
    return appendRewrite;
  };

  repeat = function (pattern, count) {
    var result;
    if (count < 1) {
      return "";
    }
    result = "";
    while (count > 1) {
      if (count & 1) {
        result += pattern;
      }
      count >>= 1;
      pattern += pattern;
    }
    return result + pattern;
  };

  exports.vdRule = vdRule = function (n, m, k = 2) {
    /*
     * Create initial ruleset for von Dyck group with inverse elements
     * https://en.wikipedia.org/wiki/Triangle_group#von_Dyck_groups
     */
    var r;
    r = {
      aA: "",
      Aa: "",
      bB: "",
      Bb: ""
    };
    r[repeat("BA", k)] = "";
    r[repeat("ab", k)] = "";
    r[repeat("A", n)] = "";
    r[repeat("a", n)] = "";
    r[repeat("B", m)] = "";
    r[repeat("b", m)] = "";
    return new RewriteRuleset(r);
  };

  exports.string2chain = string2chain = function (s) {
    var grouped;
    //last element of the string is chain head
    grouped = groupPowersVd(s);
    grouped.reverse();
    return unity.appendStack(grouped);
  };

  exports.chain2string = chain2string = function (chain) {
    var e, p, s;
    s = "";
    while (chain !== unity) {
      e = chain.letter;
      p = chain.p;
      if (p < 0) {
        e = e.toUpperCase();
        p = -p;
      }
      s = repeat(e, p) + s;
      chain = chain.t;
    }
    return s;
  };

  //take list of pairs: [element, power] and returns list of single elements,
  // assuming convention that negative power is uppercase letter.
  ungroupPowersVd = function (stack) {
    var e, i, j, l, len, p, ref, ungroupedStack;
    ungroupedStack = [];
    for (j = 0, len = stack.length; j < len; j++) {
      [e, p] = stack[j];
      if (p < 0) {
        p = -p;
        e = e.toUpperCase();
      }
      for (i = l = 0, ref = p; l < ref; i = l += 1) {
        ungroupedStack.push(e);
      }
    }
    return ungroupedStack;
  };

  //#Creates reference rewriter, using strings internally.
  // Slow, but better tested than the compiled.
  exports.makeAppendRewriteRef = makeAppendRewriteRef = function (rewriteRule) {
    return function (chain, stack) {
      var sChain, ungroupedStack;
      sChain = chain2string(chain);
      ungroupedStack = ungroupPowersVd(stack);
      ungroupedStack.reverse();
      //console.log "Ref rewriter: chain=#{sChain}, stack=#{ungroupedStack.join('')}"
      return string2chain(rewriteRule.appendRewrite(sChain, ungroupedStack.join("")));
    };
  };

  //Takes some rewrite ruleset and extends it by adding new rules with increased power of last element
  // Example:
  //  Original table:
  //    b^2 a^1 -> XXX
  //  Extended table
  //    b^2 a^2 -> XXXa
  //    b^2 a^3 -> XXXa^2
  //    ...
  //    b^2 a^maxPower -> XXXa^{maxPower-1}

  //  if power is negative, it is extended to minPower.
  //  This function modifies existing rewrite table.
  exports.extendLastPowerRewriteTable = extendLastPowerRewriteTable = function (
    rewriteRule,
    element,
    minPower,
    maxPower
  ) {
    var gRewrite,
      gSuffix,
      j,
      l,
      lastPower,
      len,
      newRewrite,
      newSuffix,
      p,
      power,
      ref,
      ref1,
      ref2,
      ref3,
      rewrite,
      step,
      suffix;
    if (minPower > 0) {
      throw new Error("min power must be non-positive");
    }
    if (maxPower < 0) {
      throw new Error("max power must be non-negative");
    }
    ref = rewriteRule.items();

    //newRules = []
    for (j = 0, len = ref.length; j < len; j++) {
      [suffix, rewrite] = ref[j];
      gSuffix = groupPowersVd(suffix);
      if (gSuffix.length === 0) {
        throw new Error("empty suffix!?");
      }
      if (gSuffix[gSuffix.length - 1][0] !== element) {
        continue;
      }
      gRewrite = groupPowersVd(rewrite);
      power = gSuffix[gSuffix.length - 1][1];
      step = power > 0 ? 1 : -1;
      lastPower = power > 0 ? maxPower : minPower;
      //prepare placeholder item. 0 will be replaced with additional power
      gRewrite.push([element, 0]);

      //console.log "SUFFIX  PLACEHOLDER: #{JSON.stringify gSuffix}"
      //console.log "REWRITE PLACEHOLDER: #{JSON.stringify gRewrite}"
      for (
        p = l = ref1 = power + step, ref2 = lastPower, ref3 = step;
        ref3 !== 0 && (ref3 > 0 ? l <= ref2 : l >= ref2);
        p = l += ref3
      ) {
        //Update power...
        gSuffix[gSuffix.length - 1][1] = p;
        gRewrite[gRewrite.length - 1][1] = p - power;

        //console.log "   Upd: SUFFIX  PLACEHOLDER: #{JSON.stringify gSuffix}"
        //console.log "   Upd: REWRITE PLACEHOLDER: #{JSON.stringify gRewrite}"

        //and generate new strings
        newSuffix = ungroupPowersVd(gSuffix).join("");
        newRewrite = ungroupPowersVd(collectPowers(gRewrite)).join("");
        if (!tailInRewriteTable(rewriteRule, newSuffix)) {
          rewriteRule.add(newSuffix, newRewrite);
        }
      }
    }
    //console.log "Adding new extended rule: #{newSuffix} -> #{newRewrite}"
    //TODO: don't add rules whose suffices are already in the table.
    return rewriteRule;
  };

  //Returns True, if string tail (of nonzero length) is present in the rewrite table
  tailInRewriteTable = function (rewriteTable, s) {
    var j, ref, suffixTail, suffixTailLen;
    for (suffixTailLen = j = 1, ref = s.length; j < ref; suffixTailLen = j += 1) {
      suffixTail = s.substring(s.length - suffixTailLen);
      if (rewriteTable.has(suffixTail)) {
        return true;
      }
    }
    return false;
  };

  exports.makeAppendRewriteVerified = function (rewriteRule) {
    var appendRewrite, appendRewriteRef;
    //Reference rewriter
    appendRewriteRef = makeAppendRewriteRef(rewriteRule);
    //compiled rewriter
    appendRewrite = makeAppendRewrite(rewriteRule);
    return function (chain, stack) {
      var j, k, len, ref, refValue, v, value;
      console.log("========= before verification =======");
      refValue = appendRewriteRef(chain, stack.slice(0));
      value = appendRewrite(chain, stack.slice(0));
      if (!refValue.equals(value)) {
        ref = rewriteRule.items();
        for (j = 0, len = ref.length; j < len; j++) {
          [k, v] = ref[j];
          console.log(`  ${k} -> ${v}`);
        }
        throw new Error(
          `rewriter verification failed. args: chain = ${chain}, stack: ${JSON.stringify(stack)}, refValue: ${refValue}, value: ${value}`
        );
      }
      return value;
    };
  };
}).call(this);
