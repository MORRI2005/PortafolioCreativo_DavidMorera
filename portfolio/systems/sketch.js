let systems = [];
let currentSystem = null;
let selectedPlanet = null;

let stars = [];

let galaxyAngle = 0;
let galaxyArms = [];
let numArms = 4;

let scanOsc;
let scanActive = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  generateStars();
  generateGalaxy();
  generateCentralGalaxy();

  scanOsc = new p5.Oscillator("sine");
  scanOsc.start();
  scanOsc.amp(0);

  document.getElementById("backBtn").onclick = () => {
    stopScanSound();
    currentSystem = null;
    selectedPlanet = null;
    document.getElementById("backBtn").style.display = "none";
    document.getElementById("info").innerText =
      "Explora la galaxia\nHaz clic en un sistema solar";
  };

  textFont("Verdana");
}

function draw() {
  background(0);
  drawStars();

  if (currentSystem === null) {
    drawCentralGalaxy();
    drawGalaxy();
    drawSystemHover();
  } else {
    drawSystem(currentSystem);
    drawPlanetHover(currentSystem);
  }
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 700; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      a: random(80, 200),
      s: random(0.01, 0.05),
      r: random(1, 3),
    });
  }
}

function drawStars() {
  noStroke();
  for (let s of stars) {
    fill(255, s.a + sin(frameCount * s.s) * 50);
    ellipse(s.x, s.y, s.r);
  }
}

function generateGalaxy() {
  systems = [];
  for (let i = 0; i < 4; i++) {
    systems.push(
      new SolarSystem(random(150, width - 150), random(150, height - 150))
    );
  }
}

function drawGalaxy() {
  for (let s of systems) s.draw();
}

function drawSystemHover() {
  for (let s of systems) {
    if (dist(mouseX, mouseY, s.x, s.y) < s.sunSize / 2 + 10) {
      fill(255);
      textSize(16);
      text(`Sistema ${s.name}`, s.x, s.y - s.sunSize);
    }
  }
}

function generateCentralGalaxy() {
  galaxyArms = [];
  let maxR = min(width, height) * 0.6;

  for (let a = 0; a < numArms; a++) {
    let arm = { offset: (TWO_PI / numArms) * a, stars: [] };
    for (let i = 0; i < 900; i++) {
      let t = i / 900;
      arm.stars.push({
        r: t * maxR,
        a: t * 6,
        ox: randomGaussian() * 20,
        oy: randomGaussian() * 20,
      });
    }
    galaxyArms.push(arm);
  }
}

function drawCentralGalaxy() {
  push();
  translate(width / 2, height / 2);
  galaxyAngle += 0.00015;
  rotate(galaxyAngle);
  noStroke();
  for (let arm of galaxyArms) {
    push();
    rotate(arm.offset);
    for (let s of arm.stars) {
      fill(200, 200, 255, 120);
      ellipse(cos(s.a) * s.r + s.ox, sin(s.a) * s.r + s.oy, 2);
    }
    pop();
  }
  pop();
}

function drawSystem(system) {
  system.drawDetailed();
}

function drawPlanetHover(system) {
  for (let p of system.planets) {
    let px = cos(p.angle) * p.distance + width / 2;
    let py = sin(p.angle) * p.distance + height / 2;

    if (dist(mouseX, mouseY, px, py) < p.size / 2 + 6) {
      fill(255);
      textSize(13);
      text(`${p.name}\n${p.type}`, px + 10, py - 10);
    }
  }
}

function mousePressed() {
  userStartAudio();

  if (currentSystem === null) {
    for (let s of systems) {
      if (dist(mouseX, mouseY, s.x, s.y) < s.sunSize / 2 + 10) {
        currentSystem = s;
        selectedPlanet = null;
        document.getElementById("backBtn").style.display = "block";
        document.getElementById(
          "info"
        ).innerText = `Sistema ${s.name}\n\nSelecciona un planeta para escanear`;
      }
    }
  } else {
    for (let p of currentSystem.planets) {
      let px = cos(p.angle) * p.distance + width / 2;
      let py = sin(p.angle) * p.distance + height / 2;
      if (dist(mouseX, mouseY, px, py) < p.size / 2 + 6) {
        selectedPlanet = p;
        startScanSound(p);
        showPlanetScan(p);
      }
    }
  }
}

function startScanSound(planet) {
  let freq = map(planet.habitability, 0, 100, 120, 600);
  if (planet.event) freq += 150;

  scanOsc.freq(freq);
  scanOsc.amp(0.25, 0.6);
  scanActive = true;
}

function stopScanSound() {
  if (!scanActive) return;
  scanOsc.amp(0, 0.5);
  scanActive = false;
}

class SolarSystem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.name = randomName();
    this.sunSize = random(40, 55);
    this.planets = [];

    let n = floor(random(3, 8));
    for (let i = 0; i < n; i++) this.planets.push(new Planet(i));
  }

  draw() {
    push();
    translate(this.x, this.y);
    fill(255, 200, 120);
    ellipse(0, 0, this.sunSize);
    pop();
  }

  drawDetailed() {
    push();
    translate(width / 2, height / 2);
    fill(255, 200, 120);
    ellipse(0, 0, this.sunSize * 2);
    for (let p of this.planets) p.draw();
    pop();
  }
}

class Planet {
  constructor(i) {
    this.distance = 100 + i * random(45, 70);
    this.size = random(14, 30);
    this.speed = random(0.001, 0.004);
    this.angle = random(TWO_PI);
    this.name = randomName();

    this.type = random([
      "Rocoso",
      "Oceánico",
      "Helado",
      "Gaseoso",
      "Volcánico",
      "Desértico",
    ]);

    this.temperature = floor(random(-150, 400));
    this.gravity = random(0.3, 2.5).toFixed(2);
    this.water = floor(random(0, 100));
    this.atmosphere = random(["Ninguna", "Tóxica", "Respirable", "Densa"]);

    this.habitability = this.calcHabitability();
    this.life = this.generateLife();
    this.event = this.generateEvent();
    this.moons = this.generateMoons();

    this.color = color(random(255), random(255), random(255));
  }

  calcHabitability() {
    let h = 0;
    if (this.atmosphere === "Respirable") h += 30;
    if (this.water > 40) h += 30;
    if (this.temperature > -10 && this.temperature < 40) h += 25;
    if (this.gravity > 0.8 && this.gravity < 1.5) h += 15;
    return constrain(h, 0, 100);
  }

  generateLife() {
    if (this.habitability < 30) return "Ninguna";
    if (this.habitability < 50) return "Microbiana";
    if (this.habitability < 70) return "Vegetal";
    if (this.habitability < 90) return "Compleja";
    return "Inteligente";
  }

  generateEvent() {
    if (random() > 0.25) return null;
    return random([
      "Anomalía gravitacional",
      "Ruinas alienígenas",
      "Tormentas eternas",
      "Distorsión espacio-temporal",
      "Campo magnético extremo",
      "Inestabilidad nuclear",
    ]);
  }

  generateMoons() {
    let moons = [];
    let count = floor(random(0, 4));
    for (let i = 0; i < count; i++) moons.push(new Moon(i));
    return moons;
  }

  draw() {
    this.angle += this.speed;
    let px = cos(this.angle) * this.distance;
    let py = sin(this.angle) * this.distance;

    fill(this.color);
    ellipse(px, py, this.size);

    for (let m of this.moons) m.draw(px, py);
  }
}

class Moon {
  constructor(i) {
    this.distance = 20 + i * random(10, 20);
    this.size = random(4, 8);
    this.speed = random(0.01, 0.03);
    this.angle = random(TWO_PI);
    this.name = randomName();
    this.type = random(["Rocosa", "Helada"]);
    this.color = color(200);
  }

  draw(px, py) {
    this.angle += this.speed;
    let x = px + cos(this.angle) * this.distance;
    let y = py + sin(this.angle) * this.distance;
    fill(this.color);
    ellipse(x, y, this.size);
  }
}

function showPlanetScan(p) {
  let bar =
    "█".repeat(floor(p.habitability / 10)) +
    "░".repeat(10 - floor(p.habitability / 10));

  let moonText =
    p.moons.length === 0
      ? "Ninguna"
      : p.moons.map((m) => `${m.name} (${m.type})`).join(", ");

  let eventText = p.event ? `⚠ EVENTO RARO:\n${p.event}` : "Ninguno";

  document.getElementById("info").innerText = `📡 ESCÁNER PLANETARIO

${p.name}
Tipo: ${p.type}

Temperatura: ${p.temperature} °C
Gravedad: ${p.gravity} g
Atmósfera: ${p.atmosphere}
Agua: ${p.water} %

Vida: ${p.life}

Lunas:
${moonText}

${eventText}

Habitabilidad:
${bar} ${p.habitability}%`;
}

function randomName() {
  let s = ["ka", "zu", "an", "to", "ra", "mi", "xe", "lo", "un"];
  let name = "";
  for (let i = 0; i < floor(random(2, 4)); i++) name += random(s);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateCentralGalaxy();
  generateStars();
}
