(function () {
  "use strict";
  var NeighborColorMap;

  exports.NeighborColorMap = NeighborColorMap = class NeighborColorMap {
    constructor() {
      // A dictionary containing the cells that is mapped to a dictionary of states and their tallies
      this.immigrationDictionary = {};
      // A dictionary containing
      this.rainbowDictionary = {};
    }

    // Methods for Immigration variant
    getNeighborColorCounts() {
      return this.immigrationDictionary;
    }
    emptyNeighborColorCounts() {
      this.immigrationDictionary = {};
      return;
    }
    updateNeighborColorCounts(cell, state) {
      // As the neighborsSum function (cellular_automata.js) iterates the neighbors
      // of each cell, take note of the neighbor and the state of the CURRENT cell.
      // If one of the previous cells already has the same state, then just add one to the tally.

      // The logic is pretty unconventional but do note that we intend to
      // take note of the states of a cell's neighbors
      if (!this.immigrationDictionary.hasOwnProperty(cell)) {
        this.immigrationDictionary[cell] = {};
      }
      this.immigrationDictionary[cell][state] = (this.immigrationDictionary[cell][state] || 0) + 1;
      return;
    }
    determineHighestColorCount(state) {
      // Have a variable that is considered the state with the highest tally.
      // Then iterate through the dictionary and check for the state with the highest tally per cell
      let highestStateCount = 0;
      let stateOfMajority = 0;

      for (let key in this.immigrationDictionary[state]) {
        if (this.immigrationDictionary[state][key] > highestStateCount) {
          highestStateCount = this.immigrationDictionary[state][key];
          stateOfMajority = key;
        }
      }
      return stateOfMajority;
    }

    // For Rainbow
    // TODO: Add some function to get average of everything

    getStatesOfNeighbors() {
      console.log(this.rainbowDictionary);
      return this.rainbowDictionary;
    }
    emptyStatesOfNeighbors() {
      this.rainbowDictionary = {};
      return;
    }
    addStateOfNeighbors(neighbor, cell, state) {
      // A method that adds the states of a cell's neighbors into a dictionary.
      // The way it works is not that conventional, as we are "technically" adding the
      // state of the cell into the dictionary (instead of the other way around).
      // But it works since we only update the state of the cells once all cells are checked
      // meaning all neighbors are checked as well!
      if (!this.rainbowDictionary.hasOwnProperty(neighbor)) {
        this.rainbowDictionary[neighbor] = {};
      }
      // Temporarily subtract the state by 1 for computational purposes.
      // This will be incremented when the state should be changed.
      this.rainbowDictionary[neighbor][cell] =
        (this.rainbowDictionary[neighbor][cell] === undefined || 0) + (state - 1);
      return;
    }
    computeNewState(cell) {
      let sumOfStates = 0;
      let numberOfLiveNeighbors = 0;

      if (!this.rainbowDictionary.hasOwnProperty(cell)) {
        throw new Error("Cell cannot be found.");
      }
      for (let key in this.rainbowDictionary[cell]) {
        if (!this.rainbowDictionary[cell].hasOwnProperty(key)) {
          throw new Error("Neighbor cannot be found.");
        }
        sumOfStates += this.rainbowDictionary[cell][key];
        numberOfLiveNeighbors += 1;
      }
      // Added a check just in case, but it unlikely that we need the second case
      const newState =
        numberOfLiveNeighbors > 0 ? Math.ceil(sumOfStates / numberOfLiveNeighbors) : 0;
      console.log(newState); // For checking purposes ONLY! Remove once not needed
      return newState;
    }
  };
}).call(this);
