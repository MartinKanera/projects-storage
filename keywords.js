const projectName = 'Úložiště maturitních projektů';
const displayName = 'Martin Kaněra';

const fs = require('fs');

const charLimit = 10;

const generateKeywords = (string) => {
  const resultArr = [];
  let currentString = '';

  string.split('').forEach((letter) => {
    currentString += letter;
    resultArr.push(currentString);
  });

  // for (let i = 0; i < charLimit; i++) {
  //   currentString += string[i];
  //   resultArr.push(currentString);
  // }

  return resultArr;
};

function permute(permutation) {
  const length = permutation.length;
  const result = [permutation.slice()];
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
      result.push(permutation.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}

let finalProduct = [];
const names = `${displayName} ${projectName}`.split(' ');

const cases = permute(names);
cases.forEach((nameCase) => {
  finalProduct = [...finalProduct, ...generateKeywords(nameCase.join(' '))];
});

// fs.writeFileSync('keywords.text', finalProduct);
console.log(finalProduct);
