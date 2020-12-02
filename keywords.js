const projectName = 'Úložiště maturitních projektů kekw';
const displayName = 'Martin Kaněra';

const fs = require('fs');

function permute(permutation) {
  const length = permutation.length;
  const result = permutation.slice();
  const c = new Array(length).fill(0);
  let i = 1;
  let k;
  let p;

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = p;
      ++c[i];
      i = 1;
      result.push(permutation.slice().join(' '));
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}

const names = `${displayName} ${projectName}`.split(' ');

fs.writeFileSync('keywords.txt', permute(names));

// console.log(permute(names).length);
