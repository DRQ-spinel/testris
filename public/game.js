const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
context.scale(20, 20);

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF'
];

function createMatrix(width, height) {
  const matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function merge(field, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        field[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(field, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (field[y + o.y] && field[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(field, player)) {
    player.pos.y--;
    merge(field, player);
    sweep();
    playerReset();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(offset) {
  player.pos.x += offset;
  if (collide(field, player)) {
    player.pos.x -= offset;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(field, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function sweep() {
  let rowCount = 1;
  outer: for (let y = field.length - 1; y >= 0; --y) {
    for (let x = 0; x < field[y].length; ++x) {
      if (field[y][x] === 0) {
        continue outer;
      }
    }
    const row = field.splice(y, 1)[0].fill(0);
    field.unshift(row);
    ++y;
    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

function playerReset() {
  const type = shapes[(shapes.length * Math.random()) | 0];
  player.matrix = createShape(type);
  player.pos.y = 0;
  player.pos.x = ((field[0].length / 2) | 0) -
                 ((player.matrix[0].length / 2) | 0);
  if (collide(field, player)) {
    field.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
  }
}

function createShape(type) {
  return SHAPES[type].map(row => row.slice());
}

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  L: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

const shapes = 'ILJOTSZ'.split('');

const field = createMatrix(10, 20);

const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  score: 0
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(field, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
}

document.addEventListener('keydown', event => {
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    playerDrop();
  } else if (event.keyCode === 81) {
    playerRotate(-1);
  } else if (event.keyCode === 87) {
    playerRotate(1);
  }
});

playerReset();
updateScore();
update();
