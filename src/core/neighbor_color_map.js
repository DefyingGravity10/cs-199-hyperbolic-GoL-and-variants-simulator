(function () {
  "use strict";
  var NeighborColorMap;

  exports.NeighborColorMap = NeighborColorMap = class NeighborColorMap {
    constructor() {
      this.dictionary = {};
    }
    getNeighborColorCounts() {
      return this.dictionary;
    }
    emptyNeighborColorCounts() {
      this.dictionary = {};
      return;
    }
    updateNeighborColorCounts(cell, state) {
      // dictionary = {} -> unsure if it will work lang ah but I think it would since it should check on a per-cell basis
      // Check if the state number is already present in the dictionary or else add
      if (!this.dictionary.hasOwnProperty(cell)) {
        this.dictionary[cell] = {};
      }
      this.dictionary[cell][state] = (this.dictionary[cell][state] || 0) + 1;
      return;
    }
    determineHighestColorCount(state) {
      //have a variable that is initially the first or something
      // Go through the entire dictionary and return the state with highest value
      let highestStateCount = 0;
      let stateOfMajority;

      for (let key in this.dictionary[state]) {
        if (this.dictionary[state][key] > highestStateCount) {
          highestStateCount = this.dictionary[state][key];
          stateOfMajority = key;
        }
      }
      return stateOfMajority;
    }
  };

  // let dictionary = {};
  // let getNeighborColorCounts,
  //   emptyNeighborColorCounts,
  //   updateNeighborColorCounts,
  //   determineHighestColorCount,
  //   highestStateCount;

  // exports.getNeighborColorCounts = getNeighborColorCounts = function () {
  //   return dictionary;
  // };
  // exports.emptyNeighborColorCounts = emptyNeighborColorCounts = function () {
  //   dictionary = {};
  //   return;
  // };

  // exports.updateNeighborColorCounts = updateNeighborColorCounts = function (state) {
  //   // dictionary = {} -> unsure if it will work lang ah but I think it would since it should check on a per-cell basis
  //   // Check if the state number is already present in the dictionary or else add
  //   dictionary[state] = (dictionary[state] || 0) + 1;
  //   return;
  // };
  // exports.determineHighestColorCount = determineHighestColorCount = function () {
  //   // have a variable that is initially the first or something
  //   // Go through the entire dictionary and return the state with highest value
  //   highestStateCount = 0;
  //   for (let key in dictionary) {
  //     if (dictionary.hasOwnProperty(key)) {
  //       if (dictionary[key] > highestStateCount) {
  //         highestStateCount = dictionary[key];
  //         stateOfMajority = key;
  //       }
  //     }
  //   }
  //   return stateOfMajority;
  // };
}).call(this);
