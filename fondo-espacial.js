window.addEventListener("load", () => {
  const canvas = document.getElementById("fondo-espacial");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const stars = [];
  const STAR_COUNT = 180;

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.6 + 0.4,
      speed: Math.random() * 0.15 + 0.03,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let s of stars) {
      s.brightness += (Math.random() - 0.5) * 0.015;
      if (s.brightness < 0.3) s.brightness = 0.3;
      if (s.brightness > 1) s.brightness = 1;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
      ctx.fill();

      s.y += s.speed;

      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
});
