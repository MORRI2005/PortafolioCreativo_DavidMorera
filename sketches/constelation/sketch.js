let stars = [];
let connections = [];
let selectedStar = null;

const HIT_RADIUS = 20;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);

  select("#save").mousePressed(() => saveCanvas("constelacion", "png"));
  select("#clear").mousePressed(clearAll);
  select("#deselect").mousePressed(() => {
    selectedStar = null;
  });
}

function draw() {
  background(0);

  stroke(180, 200, 255);
  strokeWeight(1.8);
  for (let c of connections) {
    line(c.a.x, c.a.y, c.b.x, c.b.y);
  }

  noStroke();
  for (let s of stars) {
    let d = dist(mouseX, mouseY, s.x, s.y);
    let hovering = d < HIT_RADIUS;

    let pulse = sin(frameCount * s.speed + s.phase);
    let r = s.baseR + pulse * 0.9;
    let alpha = s.baseBrightness + pulse * 35;

    if (hovering) {
      alpha += 40;
      r += 1.5;
    }

    if (s === selectedStar) {
      alpha = 255;
      r += 2;
    }

    fill(255, alpha);
    circle(s.x, s.y, r * 2);
  }
}

function isClickOnUI() {
  const uiElements = document.querySelectorAll(
    ".ui, .hero, .ui button, #title, #subtitle"
  );
  for (let el of uiElements) {
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const mx = mouseX + canvasRect.left;
    const my = mouseY + canvasRect.top;

    if (
      mx >= rect.left &&
      mx <= rect.right &&
      my >= rect.top &&
      my <= rect.bottom
    ) {
      return true;
    }
  }
  return false;
}

function mousePressed() {
  if (isClickOnUI()) return;

  let clickedStar = null;
  for (let s of stars) {
    if (dist(mouseX, mouseY, s.x, s.y) < HIT_RADIUS) {
      clickedStar = s;
      break;
    }
  }

  if (clickedStar) {
    if (!selectedStar) {
      selectedStar = clickedStar;
    } else if (selectedStar !== clickedStar) {
      connections.push({ a: selectedStar, b: clickedStar });
      selectedStar = clickedStar;
    }
    return;
  }

  if (isClickOnUI()) return;

  let newStar = {
    x: mouseX,
    y: mouseY,
    baseR: random(2.8, 4.2),
    baseBrightness: random(180, 235),
    phase: random(TWO_PI),
    speed: random(0.01, 0.025),
  };

  stars.push(newStar);

  if (selectedStar) {
    connections.push({ a: selectedStar, b: newStar });
  }

  selectedStar = newStar;
}

function clearAll() {
  stars = [];
  connections = [];
  selectedStar = null;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
