let video;
let detectedColor = "Ninguno";
let detectedColorFill = null;
let detectionSize = 20;
let colorCheckInterval = 200;
let lastCheck = 0;

let balls = [];
let score = 0;
let gameState = "PLAYING";

let ballRadius = 20;
let ballSpacing = ballRadius * 2;
let pathProgress = 0;

let pathSpeed = 0.5;
const SPEED_FAST = 1.4;
const SPEED_SLOW = 0.25;
const SPEED_CURVE = 1.6;

const COLOR_CONFIG = [
  { name: "ROJO", fill: "#e74c3c" },
  { name: "VERDE", fill: "#2ecc71" },
  { name: "AZUL", fill: "#3498db" },
];

let restartButton;
let turretY;
let turretFireAnim = 0;

let osc;
let explosions = [];

function setup() {
  const s = min(windowWidth, windowHeight) * 0.85;
  const canvas = createCanvas(s, s);
  canvas.position((windowWidth - s) / 2, (windowHeight - s) / 2);

  textFont("monospace");

  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide();

  turretY = height - 50;

  osc = new p5.Oscillator("triangle");
  osc.start();
  osc.amp(0);

  createRestartButton();
  startGame();
}

function startGame() {
  gameState = "PLAYING";
  score = 0;
  balls = [];
  pathProgress = 0;

  const screenLength = height + 200;
  const numBalls = ceil(screenLength / ballSpacing);

  for (let i = 0; i < numBalls; i++) {
    balls.push({
      colorIndex: floor(random(COLOR_CONFIG.length)),
      distanceFromFront: i * ballSpacing,
    });
  }

  pathProgress = ballSpacing * 6;
  restartButton.hide();
}

function windowResized() {
  const s = min(windowWidth, windowHeight) * 0.85;
  resizeCanvas(s, s);
  turretY = height - 50;
  restartButton.position(width / 2 - 80, height / 2 + 80);
}

function draw() {
  background(5);

  drawTurret();

  if (gameState === "GAMEOVER") {
    drawGameOver();
    return;
  }

  drawHud();

  if (balls.length > 0) {
    const frontY = pathProgress - balls[0].distanceFromFront;
    if (frontY >= height - ballRadius * 1.2) {
      gameState = "GAMEOVER";
      return;
    }
    pathSpeed = computePathSpeed(frontY);
  }

  pathProgress += pathSpeed;
  updateAndDrawBalls();
  checkBallsAtEnd();
  detectColorFromCamera();
  updateExplosions();
}

function drawHud() {
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Puntuación: ${score}`, 20, 20);
  text(`Input: ${detectedColor}`, 20, 50);

  if (balls.length > 0) {
    textAlign(RIGHT, TOP);
    text(
      `Dispara al ${COLOR_CONFIG[balls[0].colorIndex].name}`,
      width - 20,
      20
    );
  }
}

function drawGameOver() {
  fill(255, 60, 60);
  textAlign(CENTER, CENTER);
  textSize(50);
  text("GAME OVER", width / 2, height / 2 - 50);

  textSize(25);
  fill(255);
  text(`Puntuación final: ${score}`, width / 2, height / 2);

  restartButton.show();
}

function drawTurret() {
  push();
  translate(width / 2, turretY);

  fill(100);
  rectMode(CENTER);
  rect(0, 10, 60, 20, 5);

  fill(180);
  rect(0, -10 - turretFireAnim, 20, 40, 5);

  if (turretFireAnim > 0) turretFireAnim -= 0.5;

  pop();
}

function updateAndDrawBalls() {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    const distance = pathProgress - ball.distanceFromFront;
    const pos = getPathPosition(distance);

    const isFront = i === 0;
    const scale = isFront ? 1.3 : 1;
    const bodyW = ballRadius * 2.6 * scale;
    const bodyH = ballRadius * 1.2 * scale;

    push();
    translate(pos.x, pos.y);

    if (isFront) {
      noFill();
      stroke(255);
      strokeWeight(3);
      ellipse(0, 0, bodyW + 12, bodyH + 12);
    }

    noStroke();
    fill(180);
    ellipse(0, 0, bodyW, bodyH);

    fill(220);
    ellipse(0, -bodyH * 0.35, bodyW * 0.5, bodyH * 0.6);

    fill(COLOR_CONFIG[ball.colorIndex].fill);
    for (let l = -1; l <= 1; l++) {
      ellipse(l * bodyW * 0.25, bodyH * 0.2, 6 * scale);
    }

    pop();
  }
}

function getPathPosition(distance) {
  const t = distance / 100;
  const amplitude = width * 0.06;
  return {
    x: width / 2 + sin(t * 2) * amplitude,
    y: distance,
  };
}

function computePathSpeed(frontY) {
  let p = constrain(frontY / height, 0, 1);
  p = pow(p, SPEED_CURVE);
  return lerp(SPEED_FAST, SPEED_SLOW, p);
}

function checkBallsAtEnd() {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    const distance = pathProgress - ball.distanceFromFront;

    if (distance > height + ballRadius * 2) {
      balls.splice(i, 1);

      const lastBall = balls[balls.length - 1];
      const nextDist = lastBall
        ? lastBall.distanceFromFront + ballSpacing
        : pathProgress;
      balls.push({
        colorIndex: floor(random(COLOR_CONFIG.length)),
        distanceFromFront: nextDist,
      });
    }
  }
}

function shootWithColor(colorIndex) {
  if (balls.length === 0) return;

  turretFireAnim = 5;

  if (balls[0].colorIndex === colorIndex) {
    explosions.push({
      x: getPathPosition(pathProgress - balls[0].distanceFromFront).x,
      y: getPathPosition(pathProgress - balls[0].distanceFromFront).y,
      t: 0,
    });

    balls.shift();
    score += 5;

    playExplosionSound();

    const lastBall = balls[balls.length - 1];
    const nextDist = lastBall
      ? lastBall.distanceFromFront + ballSpacing
      : pathProgress;
    balls.push({
      colorIndex: floor(random(COLOR_CONFIG.length)),
      distanceFromFront: nextDist,
    });
  } else {
    score = max(0, score - 1);
  }
}

function detectColorFromCamera() {
  if (millis() - lastCheck < colorCheckInterval) return;
  lastCheck = millis();

  video.loadPixels();
  if (video.pixels.length === 0) return;

  const cx = floor(video.width / 2);
  const cy = floor(video.height / 2);
  const half = floor(detectionSize / 2);

  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  for (let x = cx - half; x <= cx + half; x++) {
    for (let y = cy - half; y <= cy + half; y++) {
      const i = (x + y * video.width) * 4;
      if (i < 0 || i >= video.pixels.length) continue;
      r += video.pixels[i];
      g += video.pixels[i + 1];
      b += video.pixels[i + 2];
      count++;
    }
  }

  r /= count;
  g /= count;
  b /= count;

  if (r > g + 40 && r > b + 40) shootWithColor(0);
  else if (g > r + 40 && g > b + 40) shootWithColor(1);
  else if (b > r + 40 && b > g + 40) shootWithColor(2);
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    push();
    translate(e.x, e.y);
    stroke(255, 200, 0, 255 - e.t * 20);
    strokeWeight(2);
    for (let j = 0; j < 10; j++) {
      line(0, 0, cos(j + e.t) * 15, sin(j + e.t) * 15);
    }
    pop();
    e.t++;
    if (e.t > 15) explosions.splice(i, 1);
  }
}

function playExplosionSound() {
  osc.freq(random(100, 300));
  osc.amp(0.5, 0.01);
  osc.amp(0, 0.3, 0.01);
}

function createRestartButton() {
  restartButton = createButton("REINICIAR");
  restartButton.style("font-family", "monospace");
  restartButton.style("font-size", "20px");
  restartButton.style("border", "none");
  restartButton.style("background", "#2ecc71");
  restartButton.style("color", "#000");
  restartButton.style("padding", "10px 20px");
  restartButton.style("border-radius", "8px");

  restartButton.mousePressed(startGame);
  restartButton.position(width / 2 - 80, height / 2 + 80);
  restartButton.hide();
}
