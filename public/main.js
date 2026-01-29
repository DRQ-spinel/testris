// public/main.js
import { createPiece, generateBag } from './pieces.js';
import { createMatrix, collide, merge, rotateMatrix, arenaSweep } from './utils.js';
import { Renderer } from './renderer.js';

// --- 初期化 ---
const canvas = document.getElementById('tetris');
const holdCanvas = document.getElementById('hold');
const nextCanvas = document.getElementById('next');

// レンダラーのインスタンス化
const renderer = new Renderer(canvas, holdCanvas, nextCanvas);

// UI要素
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const timeElement = document.getElementById('time');
const startOverlay = document.getElementById('start-overlay');

// ゲーム状態
const arena = createMatrix(10, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    type: null,
    score: 0,
    lines: 0,
    level: 1,
    holdType: null,
    canHold: true,
};

let pieceBag = [];
let nextQueue = [];
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameRunning = false;
let animationId = null;

// 時間計測用
let startTime = 0;

// --- ヘルパー関数 ---

function updateNextQueue() {
    while (nextQueue.length <= 5) {
        nextQueue.push(...generateBag());
    }
}

function getNextPieceType() {
    if (nextQueue.length === 0) updateNextQueue();
    const next = nextQueue.shift();
    updateNextQueue();
    return next;
}

function updateStats() {
    scoreElement.innerText = player.score;
    linesElement.innerText = player.lines;
    levelElement.innerText = player.level;
}

function updateTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const centi = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    timeElement.innerText = `${minutes}:${seconds}.${centi}`;
}

// --- プレイヤー操作ロジック ---

function playerReset() {
    player.type = getNextPieceType();
    player.matrix = createPiece(player.type);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    player.canHold = true;

    if (collide(arena, player)) {
        isGameRunning = false;
        startOverlay.classList.remove('hidden');
        document.querySelector('.start-text').innerText = "GAME OVER\nSCORE: " + player.score;
        cancelAnimationFrame(animationId);
    }
}

function playerHold() {
    if (!isGameRunning || !player.canHold) return;

    if (player.holdType === null) {
        player.holdType = player.type;
        playerReset();
    } else {
        const tempType = player.type;
        player.type = player.holdType;
        player.holdType = tempType;
        player.matrix = createPiece(player.type);
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    }
    player.canHold = false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        
        // ライン消去とスコア加算
        const result = arenaSweep(arena);
        if (result.lines > 0) {
            player.score += result.score;
            player.lines += result.lines;
            
            // レベルアップ処理
            const newLevel = Math.floor(player.lines / 10) + 1;
            if (newLevel > player.level) {
                player.level = newLevel;
                dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
            }
            updateStats();
        }
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotateMatrix(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotateMatrix(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// --- メインループ ---

function update(time = 0) {
    if (!isGameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    const currentElapsed = Date.now() - startTime;
    updateTime(currentElapsed);

    renderer.draw(arena, player, nextQueue);
    animationId = requestAnimationFrame(update);
}

// --- イベントリスナー ---

document.addEventListener('keydown', event => {
    if (!isGameRunning) return;

    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 38) { // Up (Rotate)
        playerRotate(1);
    } else if (event.keyCode === 67) { // C (Hold)
        playerHold();
    }
});

// HTMLのonclickから呼べるようにwindowオブジェクトに登録
window.startGameGlobal = function() {
    if (isGameRunning) return;
    
    startOverlay.classList.add('hidden');
    
    // 状態リセット
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    player.holdType = null;
    dropInterval = 1000;
    
    pieceBag = [];
    nextQueue = [];
    updateNextQueue();
    
    updateStats();
    
    startTime = Date.now();
    
    playerReset();
    isGameRunning = true;
    update();
};