let mic;
let particles = [];
let baseRadius;
let hueOffset = 0;
let smoothEnergy = 0;

const PARTICLE_COUNT = 420;
const CLOUD_LAYERS = 3;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  mic = new p5.AudioIn();
  mic.start();

  baseRadius = min(width, height) * 0.22;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }
}

function createParticle() {
  return {
    angle: random(TWO_PI),
    offset: random(0.4, 1.4),
    speed: random(0.002, 0.01),
    size: random(1.5, 3.5),
    noiseSeed: random(1000),
  };
}

function draw() {
  background(0, 18);
  translate(width / 2, height / 2);

  let rawLevel = mic.getLevel() * 2.2;
  let targetEnergy = constrain(map(rawLevel, 0, 0.3, 0, 1), 0, 1);

  if (targetEnergy > smoothEnergy) {
    smoothEnergy = lerp(smoothEnergy, targetEnergy, 0.25);
  } else {
    smoothEnergy = lerp(smoothEnergy, targetEnergy, 0.035);
  }

  let energy = smoothEnergy;

  hueOffset += 0.12 + energy * 1.6;

  noStroke();

  for (let layer = 0; layer < CLOUD_LAYERS; layer++) {
    let layerRadius = baseRadius * (0.5 + layer * 0.28);
    let layerHue = (hueOffset + layer * 110 + energy * 160) % 360;

    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.06) {
      let angleWarp =
        a +
        noise(a * 1.2, frameCount * 0.01 + layer * 10) *
          TWO_PI *
          0.15 *
          (1 + energy * 2);

      let n = noise(
        cos(angleWarp) + layer * 10,
        sin(angleWarp) + frameCount * 0.015
      );

      let r =
        layerRadius +
        n * 220 +
        energy * 260 * sin(a * (2 + layer) + frameCount * 0.03);

      let x = cos(angleWarp) * r;
      let y = sin(angleWarp) * r;

      fill(layerHue, 75, 90, 20);
      vertex(x, y);
    }
    endShape(CLOSE);
  }

  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.06) {
    let angleWarp =
      a + noise(a * 1.1, frameCount * 0.01) * TWO_PI * 0.12 * (1 + energy);

    let n = noise(cos(angleWarp), sin(angleWarp) + frameCount * 0.012);

    let r =
      baseRadius + n * 180 + energy * 240 * sin(a * 3 + frameCount * 0.025);

    let x = cos(angleWarp) * r;
    let y = sin(angleWarp) * r;

    let h = (hueOffset + a * 50) % 360;
    fill(h, 85, 95, 18);

    vertex(x, y);
  }
  endShape(CLOSE);

  for (let p of particles) {
    p.angle += p.speed + energy * 0.02;
    p.noiseSeed += 0.015;

    let n = noise(p.noiseSeed);
    let r = baseRadius * p.offset + n * 150 + energy * 300;

    let x = cos(p.angle) * r;
    let y = sin(p.angle) * r;

    let h = (hueOffset + p.angle * 70) % 360;
    fill(h, 70, 100, 75);
    circle(x, y, p.size + energy * 4);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
