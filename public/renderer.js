// public/renderer.js
import { COLORS, createPiece } from './pieces.js';

// Canvas要素とContextを受け取って初期化するクラス、または関数群
export class Renderer {
    constructor(canvas, holdCanvas, nextCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.holdCanvas = holdCanvas;
        this.holdCtx = holdCanvas.getContext('2d');
        
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');

        // 初期スケール設定
        this.ctx.scale(20, 20);
        this.holdCtx.scale(15, 15);
        this.nextCtx.scale(15, 15);
    }

    draw(arena, player, nextQueue) {
        // メインキャンバス背景
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid(this.ctx, 10, 20);
        this.drawMatrix(this.ctx, arena, {x: 0, y: 0});
        this.drawMatrix(this.ctx, player.matrix, player.pos);

        this.drawHold(player.holdType);
        this.drawNext(nextQueue);
    }

    drawGrid(ctx, w, h) {
        ctx.lineWidth = 0.02;
        ctx.strokeStyle = '#333';
        // 縦線
        for(let x=0; x<w; x++) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        // 横線
        for(let y=0; y<h; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    drawMatrix(ctx, matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // ブロック本体
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // 光沢感のある枠線
                    ctx.lineWidth = 0.05;
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);

                    // ハイライト
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 0.2);
                }
            });
        });
    }

    getCenterOffset(matrix, viewW, viewH) {
        const colCount = matrix[0].length;
        const rowCount = matrix.length;
        return {
            x: (viewW - colCount) / 2,
            y: (viewH - rowCount) / 2 
        };
    }

    drawHold(holdType) {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height); 
        if (holdType) {
            const holdMatrix = createPiece(holdType);
            const offset = this.getCenterOffset(holdMatrix, 6, 4); 
            this.drawMatrix(this.holdCtx, holdMatrix, offset);
        }
    }

    drawNext(nextQueue) {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        for (let i = 0; i < 5; i++) {
            if (nextQueue[i]) {
                const matrix = createPiece(nextQueue[i]);
                const yPos = i * 3.5 + 1; 
                const offset = this.getCenterOffset(matrix, 6, 0);
                this.drawMatrix(this.nextCtx, matrix, {x: offset.x, y: yPos});
            }
        }
    }
}