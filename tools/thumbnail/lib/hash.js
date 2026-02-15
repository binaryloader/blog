'use strict';

function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed) {
  let s = seed;
  return function next() {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s >>> 16) / 65536;
  };
}

function createRng(ref) {
  return seededRandom(djb2(ref));
}

module.exports = { djb2, seededRandom, createRng };
