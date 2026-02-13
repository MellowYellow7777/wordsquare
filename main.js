var inps, zwsp, getWordsByLength;

window.onload = function() {
  var dictByLen = Array(29).fill().map((_,i) => dict.filter(word => word.length==i+1).sort((a,b) => {
    var fa = frequency[a] ?? 0;
    var fb = frequency[b] ?? 0;
    return fb - fa;
  }));
  getWordsByLength = function(length) {
    return dictByLen[length-1];
  }
  zwsp = String.fromCharCode(8203);
  var div = document.createElement('div');
  var txt = document.createElement('div');
  var inp = document.createElement('input');
  var btn = document.createElement('button');
  txt.innerText = 'please enter size of word square:';
  div.appendChild(txt);
  inp.type = 'number';
  inp.value = 4;
  div.appendChild(inp);
  btn.innerText = 'go';
  div.appendChild(btn);
  document.body.appendChild(div);

  btn.onclick = function(event) {
    if ([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]
      .includes(+inp.value)
    ) {
      div.remove();
      init(+inp.value);
    } else {
      txt.innerText = 'please enter size of word square (a whole # 1-29):'
    }
  }
}

function init(size) {
  dict = dict.filter(w => w.length == size);

  inps = [];

  var wr = document.createElement('div');
  var btn = document.createElement('button');
  wr.style = `
    display: flex;
    flex-direction: column;
`;
  for (i=0;i<size;i++) {
    var rw = document.createElement('div');
    var ia = [];
    rw.style = 	`
      display: flex;
    `;
    for (j=0;j<size;j++) {
      var inp = document.createElement('input');
      inp.style = `
  font: 24px Kurinto Mono;
  width: 40px;
  height: 40px;
  text-align: center;
`;
    inp.value = zwsp;
      ((i,j) => {
        inp.oninput = function(event) {console.log(event);
          if (event.inputType == 'deleteContentBackward') {
            event.target.value = zwsp;
            if (j > 0) {
              inps[i][j-1].focus();
            } else if (i > 0) {
              inps[i-1][size-1].focus()
            }
          } else if('abcdefghijklmnopqrstuvwxyz'.includes(event.data)) {
            event.target.value = event.data;
            if (j < size-1) {
              var v = inps[i][j+1].value;
              inps[i][j+1].focus();
              inps[i][j+1].value = v;
            } else if (i < size-1) {
              inps[i+1][0].focus()
            }
          } else {
            event.target.value = zwsp;
          }
        };
      })(i,j);
      rw.appendChild(inp);
      ia.push(inp);
    }
    wr.appendChild(rw);
    inps.push(ia);
  }
  document.body.appendChild(wr);
  btn.innerText = 'solve';
  btn.onclick = async function() {
    btn.innerText = 'solving...';
    await new Promise(resolve => setTimeout(resolve, 0));
    solution = await seek();
    if (solution == null) {
      btn.innerText = 'no solution found';
      return;
    }
    solution.forEach((row,i) => row.forEach((letter,j) => inps[i][j].value = letter));
    btn.innerText = 'solve';
  }
  document.body.appendChild(btn);
}

function getSquare() {
  return inps.map(row => row.map(inp => inp.value == zwsp ? ' ' : inp.value));
}

function getWord(square,index) {
  var size = square.length;
  var s = square.map(row => row.map(char => char == '' ? ' ' : char));
  if (index < size) {
    return s[index].join('');
  } else {
    return s.map(s => s[index-size]).join('');
  }
}

function setWord(square,index,word) {
  var size = square.length;
  var s = square.slice();
  var letters = word.split('');
  if (index < size) {
    s[index] = letters;
    return s;
  } else {
    s.forEach((s,i) => s[index] = letters[i]);
    return s;
  }
}

function getDependants(square,index) {
  var size = square.length;
  var s = square.map(row => row.map(char => char == '' ? ' ' : char));
  s = setWord(s,index,'_'.repeat(size));
  var deps = [];
  if (index < size) {
    for (i = size; i < 2*size; i++) {
      deps.push(getWord(s,i));
    }
  } else {
    for (i = 0; i < size; i++) {
      deps.push(getWord(s,i));
    }
  }
  return deps;
}

function findMatches(square,index) {
  var dict = getWordsByLength(square.length);
  var target = getWord(square,index);
  var deps = getDependants(square,index);
  return dict.filter(word =>
    word.split('').every((letter,i) =>
    (target[i] == ' ' || letter == target[i])) &&
    word.split('').every((letter,i) => hasMatch(deps[i].replace('_',letter)))
  );
}

function hasMatch(target) {
  var dict = getWordsByLength(target.length);
  return dict.some(word => word.split('').every((letter,i) =>
    (target[i] == ' ' || letter == target[i])
  ));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setInputs(square) {
  if (square == null) return;
  square.forEach((row,i) => 
    row.forEach((letter,j) => 
      inps[i][j].value = letter
    )
  );
}

async function seek(square = null, line = 0) {
  if (square === null) square = getSquare();
  var size = square.length;

    setInputs(square); // Update the inputs to show the current state

    await delay(10); // Introduce a slight delay to allow UI to update

  if (line >= 2 * size) return square;

  var w = getWord(square, line);

  if (!w.includes(' ')) return seek(square, line + 1);

  var matches = findMatches(square, line);

  for (let match of matches) {
    var newSquare = setWord(square, line, match);

    setInputs(newSquare); // Update the inputs to show the current state

    await delay(10); // Introduce a slight delay to allow UI to update

    var resultSquare = await seek(newSquare, line + 1);
    if (resultSquare !== null) return resultSquare;
  }

  return null;
}