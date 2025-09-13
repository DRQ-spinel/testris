const CELL = 32;
const COLS = 10;
const ROWS = 20;
const PREVIEW = 4;

const app = new PIXI.Application({
  width: COLS * CELL + PREVIEW * CELL * 2 + 60,
  height: ROWS * CELL,
  backgroundColor: 0x111111,
});
document.getElementById('game').appendChild(app.view);

const boardGfx = new PIXI.Graphics();
const activeGfx = new PIXI.Graphics();
const ghostGfx = new PIXI.Graphics();
const nextGfx = new PIXI.Graphics();
const holdGfx = new PIXI.Graphics();

nextGfx.x = COLS * CELL + 20;
nextGfx.y = 20;
holdGfx.x = COLS * CELL + PREVIEW * CELL + 40;
holdGfx.y = 20;

app.stage.addChild(boardGfx);
app.stage.addChild(ghostGfx);
app.stage.addChild(activeGfx);
app.stage.addChild(nextGfx);
app.stage.addChild(holdGfx);

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const COLORS = {
  I: 0x00ffff,
  J: 0x0000ff,
  L: 0xffa500,
  O: 0xffff00,
  S: 0x00ff00,
  T: 0x800080,
  Z: 0xff0000,
};

function createPiece(type) {
  return {
    matrix: SHAPES[type].map(row => row.slice()),
    color: COLORS[type],
    type,
    pos: { x: 0, y: 0 },
  };
}

function createBoard(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

function collide(board, piece) {
  const m = piece.matrix;
  const o = piece.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + piece.pos.y][x + piece.pos.x] = piece.color;
      }
    });
  });
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

function drawMatrix(matrix, offset, color, gfx, alpha = 1) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        gfx.beginFill(color, alpha);
        gfx.drawRect((x + offset.x) * CELL, (y + offset.y) * CELL, CELL, CELL);
        gfx.endFill();
      }
    });
  });
}

function drawBoard(board) {
  boardGfx.clear();
  board.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) {
        boardGfx.beginFill(color);
        boardGfx.drawRect(x * CELL, y * CELL, CELL, CELL);
        boardGfx.endFill();
      }
    });
  });
}

function drawPiece(piece) {
  activeGfx.clear();
  drawMatrix(piece.matrix, piece.pos, piece.color, activeGfx);
}

function drawGhost(piece) {
  ghostGfx.clear();
  const ghost = { matrix: piece.matrix, color: piece.color, pos: { x: piece.pos.x, y: piece.pos.y } };
  while (!collide(board, ghost)) {
    ghost.pos.y++;
  }
  ghost.pos.y--;
  drawMatrix(ghost.matrix, ghost.pos, piece.color, ghostGfx, 0.3);
}

function drawPreview(piece, gfx) {
  gfx.clear();
  const offset = { x: 0, y: 0 };
  // center in 4x4 box
  offset.x = Math.floor((PREVIEW - piece.matrix[0].length) / 2);
  offset.y = Math.floor((PREVIEW - piece.matrix.length) / 2);
  drawMatrix(piece.matrix, offset, piece.color, gfx);
  gfx.lineStyle(2, 0xffffff, 0.2);
  gfx.drawRect(0, 0, PREVIEW * CELL, PREVIEW * CELL);
  gfx.lineStyle(0);
}

function sweep() {
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++y;
    player.lines++;
    player.score += 100;
  }
  updateHUD();
}

function updateHUD() {
  document.getElementById('score').innerText = `Score: ${player.score}`;
  document.getElementById('lines').innerText = `Lines: ${player.lines}`;
}

let board = createBoard(COLS, ROWS);
let bag = [];
let queue = [];
let hold = null;
let canHold = true;

function fillBag() {
  bag = Object.keys(SHAPES);
  for (let i = bag.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
}

function nextType() {
  if (!bag.length) fillBag();
  return bag.pop();
}

function spawn() {
  const type = queue.shift();
  queue.push(nextType());
  player.piece = createPiece(type);
  player.piece.pos.x = (COLS / 2 | 0) - (player.piece.matrix[0].length / 2 | 0);
  player.piece.pos.y = 0;
  canHold = true;
  if (collide(board, player.piece)) {
    board = createBoard(COLS, ROWS);
    player.score = 0;
    player.lines = 0;
    updateHUD();
  }
  drawPreview(queue[0], nextGfx);
  if (hold) drawPreview(hold, holdGfx); else holdGfx.clear();
}

const player = {
  piece: null,
  score: 0,
  lines: 0,
};

while (queue.length < 5) {
  queue.push(nextType());
}
spawn();

let dropCounter = 0;
let dropInterval = 1000;
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'ArrowLeft') {
    player.piece.pos.x--;
    if (collide(board, player.piece)) player.piece.pos.x++;
  } else if (e.key === 'ArrowRight') {
    player.piece.pos.x++;
    if (collide(board, player.piece)) player.piece.pos.x--;
  } else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') {
    rotate(player.piece.matrix, 1);
    if (collide(board, player.piece)) rotate(player.piece.matrix, -1);
  } else if (e.key === 'z' || e.key === 'Z') {
    rotate(player.piece.matrix, -1);
    if (collide(board, player.piece)) rotate(player.piece.matrix, 1);
  } else if (e.key === ' ') {
    while (!collide(board, player.piece)) {
      player.piece.pos.y++;
    }
    player.piece.pos.y--;
    merge(board, player.piece);
    sweep();
    spawn();
  } else if (e.key === 'Shift' || e.key === 'c' || e.key === 'C') {
    if (!canHold) return;
    if (hold) {
      const temp = hold;
      hold = player.piece;
      player.piece = temp;
    } else {
      hold = player.piece;
      player.piece = createPiece(queue.shift());
      queue.push(nextType());
    }
    player.piece.pos.x = (COLS / 2 | 0) - (player.piece.matrix[0].length / 2 | 0);
    player.piece.pos.y = 0;
    canHold = false;
    drawPreview(queue[0], nextGfx);
    drawPreview(hold, holdGfx);
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

app.ticker.add(delta => {
  dropCounter += delta * (keys['ArrowDown'] ? 20 : 1) * 16.6667; // approximate ms
  if (dropCounter > dropInterval) {
    player.piece.pos.y++;
    if (collide(board, player.piece)) {
      player.piece.pos.y--;
      merge(board, player.piece);
      sweep();
      spawn();
    }
    dropCounter = 0;
  }
  drawBoard(board);
  drawGhost(player.piece);
  drawPiece(player.piece);
});
