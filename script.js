// =====================================
// TILE INFO
// =====================================
// 0 = jalan
// 1 = dinding
// 2 = spawn
// 3 = key
// 4 = exit

const levels = [

  // LEVEL 1
  [
    [1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,1,0,0,3,1],
    [1,0,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1],
    [1,3,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,1,0,0,4,1],
    [1,1,1,1,1,1,1,1,1,1]
  ],

  // LEVEL 2
  [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,1,0,0,0,0,3,1],
    [1,0,1,1,0,1,0,1,1,0,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,1,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

// =====================================
// VARIABLES
// =====================================

let currentLevel = 0;
let map = JSON.parse(JSON.stringify(levels[currentLevel]));

const tileSize = 50;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = map[0].length * tileSize;
canvas.height = map.length * tileSize;

const stepsText = document.getElementById("steps");
const timerText = document.getElementById("timer");
const bestText = document.getElementById("best");

const stepSound = document.getElementById("stepSound");
const keySound = document.getElementById("keySound");
const winSound = document.getElementById("winSound");
const restartBtn = document.getElementById("restartBtn");

let steps = 0;
let seconds = 0;
let keysRemaining = 0;
let canNextLevel = false;
let paused = false;
let pulseTime = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBumpSound(){
  if(audioCtx.state === 'suspended'){
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 220;

  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.16);
}

// =====================================
// PLAYER
// =====================================

let player = {
  x:0,
  y:0
};

// =====================================
// ENEMY
// =====================================

let enemy = {
  x:5,
  y:5,
  dir:1
};

// =====================================
// TIMER
// =====================================

setInterval(() => {
  if(!paused){
    seconds++;
    timerText.textContent = seconds;
  }

},1000);

// =====================================
// FIND SPAWN
// =====================================

function findPlayerSpawn(){

  for(let y=0;y<map.length;y++){

    for(let x=0;x<map[y].length;x++){

      if(map[y][x] === 2){

        player.x = x;
        player.y = y;

      }

    }

  }

}

// =====================================
// LOAD LEVEL
// =====================================

function loadLevel(levelIndex){
  currentLevel = levelIndex;
  map = JSON.parse(JSON.stringify(levels[currentLevel]));
  canvas.width = map[0].length * tileSize;
  canvas.height = map.length * tileSize;

  steps = 0;
  seconds = 0;
  paused = false;
  canNextLevel = false;
  enemy.x = 5;
  enemy.y = 5;
  enemy.dir = 1;

  findPlayerSpawn();
  countKeys();
  stepsText.textContent = steps;
  timerText.textContent = seconds;
  drawPauseOverlay();
  saveBestScore();
  render();
}

function restartLevel(){
  loadLevel(currentLevel);
}

loadLevel(currentLevel);

// =====================================
// COUNT KEYS
// =====================================

function countKeys(){

  keysRemaining = 0;

  for(let y=0;y<map.length;y++){

    for(let x=0;x<map[y].length;x++){

      if(map[y][x] === 3){
        keysRemaining++;
      }

    }

  }

}

// =====================================
// DRAW MAP
// =====================================

function drawMap(){

  for(let y=0;y<map.length;y++){

    for(let x=0;x<map[y].length;x++){

      const tile = map[y][x];

      if(tile === 1){
        ctx.fillStyle = "#555";
      }

      else if(tile === 0 || tile === 2){
        ctx.fillStyle = "#222";
      }

      else if(tile === 3){
        const keyAlpha = 0.55 + Math.sin(pulseTime * 2) * 0.25;
        ctx.fillStyle = `rgba(255,215,0,${Math.max(0.4, Math.min(1, keyAlpha)).toFixed(2)})`;
      }

      else if(tile === 4){

        if(keysRemaining === 0){
          ctx.fillStyle = "lime";
        }else{
          ctx.fillStyle = "gray";
        }

      }

      ctx.fillRect(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );

      ctx.strokeStyle = "#111";

      ctx.strokeRect(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );

    }

  }

}

// =====================================
// DRAW PLAYER
// =====================================

function drawPlayer(){

  const glowRadius = tileSize/3 + Math.sin(pulseTime * 2.5) * 3;
  const centerX = player.x * tileSize + tileSize/2;
  const centerY = player.y * tileSize + tileSize/2;

  ctx.save();
  ctx.shadowColor = "rgba(0,180,255,0.8)";
  ctx.shadowBlur = 20;
  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    glowRadius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "rgba(0,220,255,0.9)";
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(
    centerX,
    centerY,
    tileSize/3,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "rgba(0,200,255,1)";
  ctx.fill();
  ctx.closePath();

}

function drawPauseOverlay(){
  const overlay = document.getElementById('pauseOverlay');
  overlay.style.visibility = paused ? 'visible' : 'hidden';
}

// =====================================
// DRAW ENEMY
// =====================================

function drawEnemy(){

  ctx.beginPath();

  ctx.arc(
    enemy.x * tileSize + tileSize/2,
    enemy.y * tileSize + tileSize/2,
    tileSize/3,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "red";
  ctx.fill();

  ctx.closePath();

}

// =====================================
// RENDER
// =====================================

function render(){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawMap();
  drawPlayer();
  drawEnemy();

}

// =====================================
// BEST SCORE
// =====================================

function saveBestScore(){

  let bestKey = "best_level_" + currentLevel;
  let best = localStorage.getItem(bestKey);

  if(best !== null){
    bestText.textContent = best;
  } else {
    bestText.textContent = '-';
  }

  if(steps > 0 && (best === null || steps < best)){
    localStorage.setItem(bestKey, steps);
    bestText.textContent = steps;
  }

}

saveBestScore();

// =====================================
// MOVE PLAYER
// =====================================

function movePlayer(dx,dy){

  const newX = player.x + dx;
  const newY = player.y + dy;

  if(map[newY][newX] === 1){
    playBumpSound();
    return;
  }

  player.x = newX;
  player.y = newY;

  steps++;
  stepsText.textContent = steps;

  // SOUND STEP
  stepSound.currentTime = 0;
  stepSound.play();

  // AMBIL KEY
  if(map[newY][newX] === 3){

    map[newY][newX] = 0;

    keysRemaining--;

    keySound.currentTime = 0;
    keySound.play();

  }

  // EXIT
  if(map[newY][newX] === 4 &&
     keysRemaining === 0){

    winSound.currentTime = 0;
    winSound.play();

    saveBestScore();

    alert(
      "SELAMAT!\n" +
      "Langkah: " + steps +
      "\nWaktu: " + seconds + " detik\n" +
      "Tekan N untuk lanjut level"
    );

    canNextLevel = true;
  }

  // KENA MUSUH
  if(player.x === enemy.x &&
     player.y === enemy.y){

    alert("GAME OVER");

    restartLevel();
  }

  render();

}

// =====================================
// NEXT LEVEL
// =====================================

function nextLevel(){

  if(currentLevel < levels.length - 1){

    currentLevel++;

    map =
      JSON.parse(
        JSON.stringify(levels[currentLevel])
      );

    canvas.width =
      map[0].length * tileSize;

    canvas.height =
      map.length * tileSize;

    steps = 0;
    seconds = 0;

    stepsText.textContent = steps;
    timerText.textContent = seconds;

    findPlayerSpawn();
    countKeys();
    saveBestScore();

    canNextLevel = false;

    render();

  }else{

    alert("SEMUA LEVEL SELESAI!");
  }

}

// =====================================
// ENEMY MOVE
// =====================================
function findPathBFS(sx, sy, gx, gy){

  const rows = map.length;
  const cols = map[0].length;

  const key = (x,y) => x + ',' + y;

  const queue = [];
  const visited = new Set();
  const cameFrom = {};

  queue.push({x:sx,y:sy});
  visited.add(key(sx,sy));

  const directions = [
    {dx:1,dy:0},
    {dx:-1,dy:0},
    {dx:0,dy:1},
    {dx:0,dy:-1}
  ];

  while(queue.length){
    const cur = queue.shift();

    if(cur.x === gx && cur.y === gy){
      // reconstruct path
      const path = [];
      let k = key(cur.x, cur.y);
      while(k){
        const parts = k.split(',').map(Number);
        path.unshift({x:parts[0], y:parts[1]});
        k = cameFrom[k];
      }
      return path;
    }

    for(const d of directions){
      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;

      if(nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if(map[ny][nx] === 1) continue; // wall

      const nk = key(nx,ny);
      if(visited.has(nk)) continue;

      visited.add(nk);
      cameFrom[nk] = key(cur.x, cur.y);
      queue.push({x:nx,y:ny});
    }
  }

  return null; // no path

}

function moveEnemy(){
  if(paused){
    return;
  }

  // try to find a path to the player
  const path = findPathBFS(enemy.x, enemy.y, player.x, player.y);

  if(path && path.length > 1){
    // move one step along the path
    enemy.x = path[1].x;
    enemy.y = path[1].y;
  } else {
    // fallback to simple horizontal patrol
    let nextX = enemy.x + enemy.dir;
    if(map[enemy.y][nextX] === 1){
      enemy.dir *= -1;
    }else{
      enemy.x += enemy.dir;
    }
  }

  // COLLIDE WITH PLAYER
  if(player.x === enemy.x && player.y === enemy.y){
    alert("GAME OVER");
    restartLevel();
  }

}

setInterval(moveEnemy,500);

// =====================================
// INPUT
// =====================================

document.addEventListener("keydown",(e)=>{
  const key = e.key.toLowerCase();

  if(key === "p"){
    paused = !paused;
    drawPauseOverlay();
    return;
  }

  if(paused){
    return;
  }

  switch(key){

    case "w":
    case "arrowup":
      movePlayer(0,-1);
      break;

    case "s":
    case "arrowdown":
      movePlayer(0,1);
      break;

    case "a":
    case "arrowleft":
      movePlayer(-1,0);
      break;

    case "d":
    case "arrowright":
      movePlayer(1,0);
      break;

    case "r":
      restartLevel();
      break;

    case "n":
      if(canNextLevel){
        nextLevel();
      }
      break;

  }

});

restartBtn.addEventListener("click", restartLevel);

// =====================================
// START
// =====================================

function animationLoop(timestamp){
  pulseTime = timestamp / 300;
  render();
  requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);