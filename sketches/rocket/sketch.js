let mic;
let rocketY, targetY;
let asteroids = [];
let stars = [];
let lives = 3;
let gameState = "PLAYING";
let startTime;
let survivalTime = 0;

let motorOsc;
let crashOsc;

let smoothedVolume = 0;

let explosionParticles = [];

let invincible = false;
let invincibleTimer = 0;
const INVINCIBLE_TIME = 3000;

let restartButton;
let lastAsteroidY = 0;

const ASTEROID_RATE = 30;
const ASTEROID_SPEED = 4;

function setup() {
  const s = min(windowWidth, windowHeight) * 0.85;
  const canvas = createCanvas(s, s);
  canvas.position((windowWidth - s) / 2, (windowHeight - s) / 2);

  mic = new p5.AudioIn();
  mic.start();

  motorOsc = new p5.Oscillator("sawtooth");
  motorOsc.start();
  motorOsc.amp(0);

  crashOsc = new p5.Oscillator("triangle");
  crashOsc.start();
  crashOsc.amp(0);

  rocketY = height - 60;
  targetY = rocketY;
  startTime = millis();

  createStars();
  createRestartButton();
}

function draw() {
  background(0);
  drawStars();

  if (gameState === "GAMEOVER") {
    motorOsc.amp(0, 0.3);
    drawGameOver();
    return;
  }

  survivalTime = floor((millis() - startTime) / 1000);

  updateInvincibility();
  updateRocket();
  updateAsteroids();
  drawRocket();
  drawAsteroids();
  drawExplosion();
  drawHud();
  drawMicBar();
}

function updateInvincibility() {
  if (invincible && millis() - invincibleTimer > INVINCIBLE_TIME) {
    invincible = false;
  }
}

function createStars() {
  stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      speed: random(1, 4),
      size: random(1, 3),
    });
  }
}

function drawStars() {
  fill(255);
  noStroke();
  for (let s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = width;
      s.y = random(height);
    }
    circle(s.x, s.y, s.size);
  }
}

function updateRocket() {
  if (gameState !== "PLAYING") return;

  let raw = mic.getLevel();
  let volume = constrain((raw - 0.01) * 15, 0, 1);
  smoothedVolume = lerp(smoothedVolume, volume, 0.08);

  targetY = map(smoothedVolume, 0, 1, height - 50, 40);
  rocketY = lerp(rocketY, targetY, 0.08);

  motorOsc.freq(map(smoothedVolume, 0, 1, 120, 420));
  motorOsc.amp(map(smoothedVolume, 0, 1, 0.03, 0.09), 0.1);
}

function drawRocket() {
  if (invincible && frameCount % 10 < 5) return;

  push();
  translate(80, rocketY);

  let fire = map(smoothedVolume, 0, 1, 18, 65);
  fill(255, 120, 0);
  ellipse(-45, 0, fire, fire * 0.6);
  fill(255, 220, 0);
  ellipse(-40, 0, fire * 0.6, fire * 0.4);

  fill(180);
  rect(-10, -18, 55, 36, 12);

  fill(230);
  triangle(45, -18, 45, 18, 75, 0);

  fill(100, 200, 255);
  ellipse(18, 0, 14);

  fill(150);
  triangle(0, 18, 18, 18, 8, 34);
  triangle(0, -18, 18, -18, 8, -34);

  pop();
}

function updateAsteroids() {
  if (gameState !== "PLAYING") return;

  if (frameCount % ASTEROID_RATE === 0) {
    let newY;

    if (random() < 0.5) {
      newY = random(height * 0.6, height - 50);
    } else {
      newY = random(50, height - 50);
    }

    asteroids.push({
      x: width + 60,
      y: newY,
      r: random(25, 40),
      rot: random(TWO_PI),
      rotSpeed: random(-0.03, 0.03),
      drift: random(-0.8, 0.8),
    });
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    let a = asteroids[i];
    a.x -= ASTEROID_SPEED;
    a.y += a.drift;
    a.rot += a.rotSpeed;

    a.y = constrain(a.y, 40, height - 40);

    if (!invincible && dist(80, rocketY, a.x, a.y) < a.r + 18) {
      handleCollision();
      asteroids.splice(i, 1);
      continue;
    }

    if (a.x < -80) asteroids.splice(i, 1);
  }
}

function drawAsteroids() {
  for (let a of asteroids) {
    push();
    translate(a.x, a.y);
    rotate(a.rot);

    fill(120);
    beginShape();
    for (let i = 0; i < 9; i++) {
      let ang = map(i, 0, 9, 0, TWO_PI);
      let off = random(0.75, 1.2);
      vertex(cos(ang) * a.r * off, sin(ang) * a.r * off);
    }
    endShape(CLOSE);

    fill(90);
    circle(a.r * 0.3, a.r * 0.2, a.r * 0.4);
    circle(-a.r * 0.25, -a.r * 0.1, a.r * 0.3);

    pop();
  }
}

function handleCollision() {
  lives--;
  triggerExplosion();

  crashOsc.freq(80);
  crashOsc.amp(0.4, 0.05);
  crashOsc.amp(0, 0.3);

  if (lives <= 0) {
    motorOsc.amp(0, 0.3);
    setTimeout(() => {
      gameState = "GAMEOVER";
      restartButton.show();
    }, 800);
  } else {
    invincible = true;
    invincibleTimer = millis();
  }
}

function triggerExplosion() {
  explosionParticles = [];
  for (let i = 0; i < 50; i++) {
    explosionParticles.push({
      x: 80,
      y: rocketY,
      vx: random(-5, 5),
      vy: random(-5, 5),
      life: 40,
    });
  }
}

function drawExplosion() {
  for (let p of explosionParticles) {
    fill(255, random(120, 220), 0);
    circle(p.x, p.y, 5);
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  explosionParticles = explosionParticles.filter((p) => p.life > 0);
}

function drawHud() {
  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text(`Vidas: ${lives}`, 20, 20);
  text(`Tiempo: ${survivalTime}s`, 20, 45);
}

function drawMicBar() {
  let bar = map(smoothedVolume, 0, 1, 0, height - 100);
  noStroke();
  fill(0, 200, 255, 160);
  rect(width - 30, height - bar - 40, 15, bar);

  stroke(255);
  noFill();
  rect(width - 30, 40, 15, height - 100);
}

function drawGameOver() {
  fill(255, 60, 60);
  textAlign(CENTER, CENTER);
  textSize(50);
  text("GAME OVER", width / 2, height / 2 - 70);

  textSize(24);
  fill(255);
  text(`Tiempo sobrevivido: ${survivalTime}s`, width / 2, height / 2 - 10);
}

function createRestartButton() {
  restartButton = createButton("REINICIAR");
  restartButton.style("font-family", "monospace");
  restartButton.style("font-size", "20px");
  restartButton.style("background", "#2ecc71");
  restartButton.style("border", "none");
  restartButton.style("padding", "10px 20px");
  restartButton.style("border-radius", "8px");

  restartButton.position(
    (windowWidth - width) / 2 + width / 2 - 80,
    (windowHeight - height) / 2 + height / 2 + 40
  );

  restartButton.mousePressed(() => {
    lives = 3;
    asteroids = [];
    explosionParticles = [];
    invincible = false;
    smoothedVolume = 0;
    startTime = millis();
    gameState = "PLAYING";
    restartButton.hide();
  });

  restartButton.hide();
}
