const COLS = 200, ROWS = 150;
let G;
const grid = new Uint8Array(COLS * ROWS);
const idx = (x,y) => y * COLS + x;

// IDs
const EMPTY = 0, SAND = 1, WATER = 2, ROCK = 3;

// текущая кисть
let currentBrush = SAND;
let brushRadius = 2;

// Описание материалов в массиве по id
const materials = [];


function swapCells(g, a, b){
    const t = g[a]; g[a] = g[b]; g[b] = t;
}

// Песок
materials[SAND] = {
    name: 'Песок', // Название
    color: [126, 224, 129], // Цвет
    update: function(g, x, y){ // Работа
        const i = idx(x,y);
        // Если внизу пусто
        if(y >= ROWS-1) return false;
        const below = idx(x, y+1);
        if(g[below] === EMPTY){
            g[below] = SAND; g[i] = EMPTY; return true;
        }
        // Пробуем диагонали
        if(Math.random() < 0.5){
            if(x > 0 && g[idx(x-1,y+1)] === EMPTY){ g[idx(x-1,y+1)] = SAND; g[i] = EMPTY; return true; }
            if(x < COLS-1 && g[idx(x+1,y+1)] === EMPTY){ g[idx(x+1,y+1)] = SAND; g[i] = EMPTY; return true; }
        } else {
            if(x < COLS-1 && g[idx(x+1,y+1)] === EMPTY){ g[idx(x+1,y+1)] = SAND; g[i] = EMPTY; return true; }
            if(x > 0 && g[idx(x-1,y+1)] === EMPTY){ g[idx(x-1,y+1)] = SAND; g[i] = EMPTY; return true; }
        }
        return false;
    }
};

// Вода
materials[WATER] = {
    name: 'Вода',
    color: [47, 69, 97],
    update: function(g, x, y){
        const i = idx(x,y);
        if(y >= ROWS-1) return false;
        // Если внизу пусто
        if(g[idx(x,y+1)] === EMPTY){
            g[idx(x,y+1)] = WATER; g[i] = EMPTY; return true;
        }
        // Течение воды в лево/право
        const dirs = Math.random() < 0.5 ? [-1,1] : [1,-1];
        for(const d of dirs){
            const nx = x + d;
            if(nx >= 0 && nx < COLS){
                if(g[idx(nx,y)] === EMPTY){
                    g[idx(nx,y)] = WATER; g[i] = EMPTY; return true;
                }
                // диагональ вниз
                if(g[idx(nx,y+1)] === EMPTY){
                    g[idx(nx,y+1)] = WATER; g[i] = EMPTY; return true;
                }
            }
        }
        return false;
    }
};

// Камень
materials[ROCK] = {
    name: 'Камень', //Название
    color: [85, 88, 92], //Цвет
    update: function(){ return false; } //Статичное положение
};

//Подготовка
function setup(){
    createCanvas(800,600);
    pixelDensity(1);
    noSmooth();
    G = createGraphics(COLS, ROWS);
    G.noSmooth();
    background(0);

}

let mouseDown = false;
function mousePressed(e){
    mouseDown = true;
    // Ластик, Работает ОЧЕНЬ не стабильно и будет пофикшен в следущих версиях
    if(e.button === 2) applyBrush(mouseX, mouseY, EMPTY);
    else applyBrush(mouseX, mouseY, currentBrush);
}
function mouseReleased(e){ mouseDown = false; }
function mouseDragged(e){
    if(mouseDown){
        if(e.button === 2) applyBrush(mouseX, mouseY, EMPTY);
        else applyBrush(mouseX, mouseY, currentBrush);
    }
}
// Запрет контекстного меню в канвасе
document.oncontextmenu = function(){ return false; };

//Кисть
function applyBrush(mx, my, matId){
    const cx = floor(constrain(mx / (width / COLS), 0, COLS-1));
    const cy = floor(constrain(my / (height / ROWS), 0, ROWS-1));
    for(let dy = -brushRadius; dy <= brushRadius; dy++){
        for(let dx = -brushRadius; dx <= brushRadius; dx++){
            const x = cx + dx, y = cy + dy;
            if(x < 0 ||  x >= COLS ||  y < 0 ||  y >= ROWS) continue;
            if(dx*dx + dy*dy <= brushRadius*brushRadius){
                grid[idx(x,y)] = matId;
            }
        }
    }
}

// Симуляция
function simStep(){
    for(let y = ROWS - 2; y >= 0; y--){
        for(let x = 0; x < COLS; x++){
            const i = idx(x,y);
            const id = grid[i];
            if(id === EMPTY) continue;
            const mat = materials[id];
            if(mat && mat.update) mat.update(grid, x, y);
        }
    }
}

function draw(){

    for(let k=0;k<2;k++) simStep();

    // рендер в offscreen
    G.loadPixels();
    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            const v = grid[idx(x,y)];
            const p = 4 * (x + y * COLS);
            if(v === EMPTY){
                G.pixels[p] = 0; G.pixels[p+1] = 0; G.pixels[p+2] = 0; G.pixels[p+3] = 255;
            } else {
                const c = materials[v].color;
                G.pixels[p] = c[0]; G.pixels[p+1] = c[1]; G.pixels[p+2] = c[2]; G.pixels[p+3] = 255;
            }
        }
    }
    G.updatePixels();

    background(0);
    image(G, 0, 0, width, height);

    // Шапка
    noSmooth();
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    text(` PlusBox.js 1.0.0, Материалы: ${materials[currentBrush].name} (Переключение через 1-3)
    ЛКМ разместить, ПКМ ластик (Нестабильно работает). C Для очистки. Размер кисти: ${brushRadius} (Переключение по +/-)`, 8, 8);
}
//Обработка кнопок
function keyPressed(){
    if(key === '1') currentBrush = SAND;
    else if(key === '2') currentBrush = WATER;
    else if(key === '3') currentBrush = ROCK;
    else if(key === 'C' ||key === 'c') grid.fill(EMPTY);
    else if(key === '-') brushRadius = max(1, brushRadius - 1);
    else if(key === '=') brushRadius = min(10, brushRadius + 1);
}
