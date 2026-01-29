// public/pieces.js

// 配色定義
export const COLORS = [
    null,
    '#00f0f0', // I (Cyan)
    '#0000f0', // J (Blue)
    '#f0a000', // L (Orange)
    '#f0f000', // O (Yellow)
    '#00f000', // S (Green)
    '#a000f0', // T (Purple)
    '#f00000', // Z (Red)
];

// 形状定義
export function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
    } else if (type === 'J') {
        return [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'S') {
        return [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

// 7種1セットのランダム生成（7-bag system）
export function generateBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
}