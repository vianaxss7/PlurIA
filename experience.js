(() => {
  const canvas = document.getElementById('nexus');
  const ctx = canvas.getContext('2d');
  const canvasParent = canvas.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 500;
  let height = 490;
  let dpr = 1;
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  let phase = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updatePointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    mx = ((event.clientX - rect.left) / width - 0.5) * 0.6;
    my = ((event.clientY - rect.top) / height - 0.5) * 0.5;
  }

  resize();
  window.addEventListener('resize', resize);

  canvasParent.addEventListener('pointermove', updatePointerPosition);
  canvasParent.addEventListener('pointerleave', () => {
    mx = 0;
    my = 0;
  });

  const dots = [];

  for (let i = 0; i < 950; i += 1) {
    const y = 1 - (i / 949) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.399963;

    dots.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }

  function project(x, y, z, a, b) {
    const x1 = x * Math.cos(a) - z * Math.sin(a);
    const z1 = x * Math.sin(a) + z * Math.cos(a);
    const y1 = y * Math.cos(b) - z1 * Math.sin(b);
    const z2 = y * Math.sin(b) + z1 * Math.cos(b);
    const p = 3.6 / (3.6 - z2);

    return {
      x: width / 2 + x1 * p,
      y: height / 2 + y1 * p,
      z: z2,
      p,
    };
  }

  function draw() {
    phase += reduced ? 0 : 0.004;
    rx += (mx - rx) * 0.045;
    ry += (my - ry) * 0.045;

    ctx.clearRect(0, 0, width, height);

    const scale = Math.min(width, height) * 0.255;

    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      scale * 1.6,
    );

    glow.addColorStop(0, '#934bdc1a');
    glow.addColorStop(0.65, '#8c42d608');
    glow.addColorStop(1, '#8c42d600');

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const points = [];

    for (let j = 0; j < 3; j += 1) {
      for (let i = 0; i < 200; i += 1) {
        const t = (i / 200) * Math.PI * 2;
        const x = Math.cos(t) * 1.43;
        const y = Math.sin(t) * 1.43;
        const z = 0;
        const b = 0.65 + j * 0.85;
        const yy = y * Math.cos(b);
        const zz = y * Math.sin(b);
        const p = project(
          x,
          yy,
          zz,
          phase * 0.35 + rx + j * 0.6,
          0.35 + ry,
        );

        points.push({ ...p, ring: true, layer: j });
      }
    }

    for (const d of dots) {
      const bump = 1 + 0.025 * Math.sin(d[1] * 12 + phase * 4);

      points.push({
        ...project(
          d[0] * bump,
          d[1] * bump,
          d[2] * bump,
          phase + rx,
          0.3 + ry,
        ),
        ring: false,
      });
    }

    points.sort((a, b) => a.z - b.z);

    for (const p of points) {
      const x = width / 2 + (p.x - width / 2) * scale;
      const y = height / 2 + (p.y - height / 2) * scale;
      const alpha = p.ring ? 0.25 + (p.z + 1.5) / 5 : 0.16 + (p.z + 1) / 2.4;

      ctx.fillStyle = p.ring
        ? `rgba(190,145,255,${alpha * 0.65})`
        : `rgba(${p.z > 0.4 ? '229,207,255' : '167,125,220'},${alpha})`;

      ctx.beginPath();
      ctx.arc(x, y, (p.ring ? 0.65 : 1.05) * p.p, 0, Math.PI * 2);
      ctx.fill();
    }

    const core = ctx.createRadialGradient(
      width / 2 - scale * 0.2,
      height / 2 - scale * 0.23,
      0,
      width / 2,
      height / 2,
      scale * 0.55,
    );

    core.addColorStop(0, '#e0c2ff70');
    core.addColorStop(0.3, '#b26afa25');
    core.addColorStop(1, '#9845ec00');

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, scale * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ead4ff';
    ctx.font = `600 ${Math.round(scale * 0.22)}px Arial`;
    ctx.fillText('PlurIA', width / 2, height / 2 + 6);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#ae93ca';
    ctx.fillText('AI MARKETPLACE', width / 2, height / 2 + 25);

    if (!reduced) {
      requestAnimationFrame(draw);
    }
  }

  draw();

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (reduced || event.pointerType === 'touch') {
        return;
      }

      const rect = card.getBoundingClientRect();
      const rotateX = -(event.clientY - rect.top - rect.height / 2) / 45;
      const rotateY = (event.clientX - rect.left - rect.width / 2) / 45;

      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  document
    .querySelectorAll('.sectiontop, .steps article, .partnerbox')
    .forEach((element) => observer.observe(element));
})();

