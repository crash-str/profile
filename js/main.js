/* ============================================
   VINIT BHOLE — 3D REACTIVE PORTFOLIO
   Three.js + GSAP + Lenis
   ============================================ */

// ===== PRELOADER =====
const preloaderCounter = document.getElementById('preloader-counter');
const preloaderBarFill = document.getElementById('preloader-bar-fill');
const preloader = document.querySelector('.preloader');
let loadProgress = 0;
const loadInterval = setInterval(() => {
  loadProgress += Math.random() * 12 + 2;
  if (loadProgress >= 100) { loadProgress = 100; clearInterval(loadInterval); }
  preloaderCounter.textContent = Math.floor(loadProgress);
  preloaderBarFill.style.width = loadProgress + '%';
}, 80);

window.addEventListener('load', () => {
  clearInterval(loadInterval);
  preloaderCounter.textContent = '100';
  preloaderBarFill.style.width = '100%';
  setTimeout(() => {
    preloader.classList.add('done');
    document.querySelector('.cursor-glow').classList.add('active');
    document.querySelector('.cursor-dot').classList.add('active');
    initGSAP();
  }, 600);
});

// ===== CURSOR =====
const cursorGlow = document.getElementById('cursor-glow');
const cursorDot = document.getElementById('cursor-dot');
let mx = 0, my = 0, gx = 0, gy = 0, dx = 0, dy = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animCursor() {
  gx += (mx - gx) * 0.06; gy += (my - gy) * 0.06;
  cursorGlow.style.left = gx + 'px'; cursorGlow.style.top = gy + 'px';
  dx += (mx - dx) * 0.18; dy += (my - dy) * 0.18;
  cursorDot.style.left = dx + 'px'; cursorDot.style.top = dy + 'px';
  requestAnimationFrame(animCursor);
})();
const hoverSel = 'a,button,.card-3d,.stat-card,.edu-item,.contact-item,.course-tag,.project-tag,.hamburger';
document.addEventListener('mouseover', e => { if (e.target.closest(hoverSel)) cursorDot.classList.add('hovering'); });
document.addEventListener('mouseout', e => { if (e.target.closest(hoverSel)) cursorDot.classList.remove('hovering'); });

// ===== THREE.JS 3D SCENE =====
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 30;
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Floating wireframe geometries
const geometries = [
  new THREE.IcosahedronGeometry(2, 0),
  new THREE.OctahedronGeometry(1.8, 0),
  new THREE.TorusKnotGeometry(1.2, 0.4, 64, 8),
  new THREE.TetrahedronGeometry(1.5, 0),
  new THREE.DodecahedronGeometry(1.6, 0),
  new THREE.TorusGeometry(1.5, 0.3, 8, 16),
];
const meshes = [];
const accentColor = new THREE.Color(0x7c3aed);
const blueColor = new THREE.Color(0x3b82f6);

for (let i = 0; i < 10; i++) {
  const geo = geometries[i % geometries.length];
  const color = new THREE.Color().lerpColors(accentColor, blueColor, Math.random());
  const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.06 + Math.random() * 0.04 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 50, -10 - Math.random() * 20);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData = {
    rotSpeed: { x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.003 },
    floatSpeed: 0.0003 + Math.random() * 0.0004,
    floatOffset: Math.random() * Math.PI * 2,
    baseY: mesh.position.y,
    baseScale: 0.5 + Math.random() * 0.6,
    baseOpacity: mat.opacity,
  };
  mesh.scale.setScalar(mesh.userData.baseScale);
  scene.add(mesh);
  meshes.push(mesh);
}

// Particle field
const particleCount = 200;
const pGeo = new THREE.BufferGeometry();
const pPositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPositions[i * 3] = (Math.random() - 0.5) * 80;
  pPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
  pPositions[i * 3 + 2] = -5 - Math.random() * 30;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
const pMat = new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.06, transparent: true, opacity: 0.25 });
scene.add(new THREE.Points(pGeo, pMat));

// Mouse tracking for 3D
let mouse3D = { x: 0, y: 0 };
document.addEventListener('mousemove', e => {
  mouse3D.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse3D.y = -(e.clientY / innerHeight - 0.5) * 2;
});

// Scroll-linked camera
let scrollY = 0;
const onScroll = () => { scrollY = window.scrollY || document.documentElement.scrollTop; };
window.addEventListener('scroll', onScroll);

function animateThree() {
  const time = Date.now();
  // Camera reacts to mouse + scroll
  camera.position.x += (mouse3D.x * 3 - camera.position.x) * 0.02;
  camera.position.y += (mouse3D.y * 2 - camera.position.y) * 0.02;
  camera.position.z = 30 - scrollY * 0.005;
  camera.lookAt(0, 0, 0);

  meshes.forEach(m => {
    m.rotation.x += m.userData.rotSpeed.x;
    m.rotation.y += m.userData.rotSpeed.y;
    m.position.y = m.userData.baseY + Math.sin(time * m.userData.floatSpeed + m.userData.floatOffset) * 1.5;
    // React to mouse
    const dx = mouse3D.x * 8 - m.position.x;
    const dy = mouse3D.y * 8 - m.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) {
      m.rotation.x += dx * 0.0003;
      m.rotation.y += dy * 0.0003;
      const targetOp = m.userData.baseOpacity + 0.06;
      m.material.opacity += (targetOp - m.material.opacity) * 0.03;
    } else {
      m.material.opacity += (m.userData.baseOpacity - m.material.opacity) * 0.02;
    }
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animateThree);
}
animateThree();
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ===== LENIS SMOOTH SCROLL =====
const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), touchMultiplier: 2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
// Sync GSAP ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ===== TYPING EFFECT =====
const roles = ['AI / ML Engineer', 'Full Stack Developer', 'IoT Enthusiast', 'Robotics Developer', 'MSc AI @ Southampton'];
let roleIdx = 0, charIdx = 0, deleting = false;
const typingEl = document.querySelector('.typing-text');
function typeEffect() {
  if (!typingEl) return;
  const cur = roles[roleIdx];
  typingEl.textContent = cur.substring(0, charIdx);
  if (!deleting) { charIdx++; if (charIdx > cur.length) { deleting = true; setTimeout(typeEffect, 1800); return; } }
  else { charIdx--; if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; } }
  setTimeout(typeEffect, deleting ? 40 : 80);
}
setTimeout(typeEffect, 2200);

// ===== TEXT SPLIT =====
function splitText(el) {
  const text = el.textContent;
  el.innerHTML = '';
  const words = text.split(/\s+/);
  words.forEach((word, wi) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    word.split('').forEach((ch, ci) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'char';
      charSpan.textContent = ch;
      charSpan.style.transitionDelay = (wi * 0.06 + ci * 0.02) + 's';
      wordSpan.appendChild(charSpan);
    });
    el.appendChild(wordSpan);
  });
}
document.querySelectorAll('.split-text').forEach(splitText);

// ===== TEXT SCRAMBLE =====
function scrambleText(el) {
  const original = el.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
  let iteration = 0;
  const interval = setInterval(() => {
    el.textContent = original.split('').map((ch, i) => {
      if (i < iteration) return original[i];
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    iteration += 1 / 2;
    if (iteration >= original.length) { clearInterval(interval); el.textContent = original; }
  }, 30);
}

// ===== NAVBAR =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 50); });
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('open'); });
navLinks?.querySelectorAll('a').forEach(l => l.addEventListener('click', () => { hamburger?.classList.remove('active'); navLinks?.classList.remove('open'); }));

// Active nav
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) cur = s.id; });
  navItems.forEach(i => { i.classList.toggle('active', i.getAttribute('href') === '#' + cur); });
});

// Smooth scroll anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) lenis.scrollTo(target, { offset: -80 });
  });
});

// Scroll progress
const scrollProg = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100;
  scrollProg.style.width = pct + '%';
});

// ===== MAGNETIC =====
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

// ===== RIPPLE =====
document.querySelectorAll('.btn-primary,.btn-outline,.nav-resume,.footer-link').forEach(el => {
  el.addEventListener('click', function (e) {
    const rip = document.createElement('span');
    rip.classList.add('ripple');
    const r = this.getBoundingClientRect();
    const sz = Math.max(r.width, r.height);
    rip.style.width = rip.style.height = sz + 'px';
    rip.style.left = (e.clientX - r.left - sz / 2) + 'px';
    rip.style.top = (e.clientY - r.top - sz / 2) + 'px';
    this.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  });
});

// ===== CARD 3D TILT + GLOW =====
document.querySelectorAll('.card-3d').forEach(card => {
  const glow = document.createElement('div');
  glow.classList.add('card-glow');
  card.appendChild(glow);
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    card.style.transform = `perspective(800px) rotateX(${(y - cy) / 30}deg) rotateY(${(cx - x) / 30}deg) scale(1.02)`;
    glow.style.background = `radial-gradient(circle 200px at ${x}px ${y}px,rgba(124,58,237,.15),transparent)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ===== FORM =====
const form = document.getElementById('contact-form');
form?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  btn.textContent = 'Sent! ✓';
  btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
  setTimeout(() => { btn.textContent = 'Send Message →'; btn.style.background = ''; form.reset(); }, 3000);
});

// ===== GSAP ANIMATIONS =====
function initGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  const heroTL = gsap.timeline({ delay: 0.2 });
  heroTL
    .to('.hero-badge', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    .add(() => { document.querySelectorAll('.hero-tagline, .hero-name').forEach(el => el.classList.add('revealed')); }, 0.3)
    .to('.hero-roles', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.9)
    .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.1)
    .to('.hero-buttons', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.3)
    .to('.hero-scroll', { opacity: 1, duration: 0.5 }, 1.5);

  // Section labels — scramble + line
  document.querySelectorAll('.section-label').forEach(label => {
    ScrollTrigger.create({
      trigger: label, start: 'top 85%',
      onEnter: () => { label.classList.add('visible'); if (label.hasAttribute('data-scramble')) scrambleText(label); },
      once: true
    });
  });

  // Section titles — split text reveal
  document.querySelectorAll('section .split-text').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%',
      onEnter: () => el.classList.add('revealed'),
      once: true
    });
  });

  // Reveal text paragraphs
  gsap.utils.toArray('.reveal-text').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
    });
  });

  // About stats
  gsap.utils.toArray('.stat-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      opacity: 0, y: 40, scale: 0.9, duration: 0.6, delay: i * 0.15, ease: 'back.out(1.7)'
    });
  });

  // Counter animation
  document.querySelectorAll('.stat-number[data-count]').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        const target = +el.dataset.count, suffix = el.dataset.suffix || '';
        gsap.to({ val: 0 }, {
          val: target, duration: 1.5, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.ceil(this.targets()[0].val) + suffix; }
        });
      }
    });
  });

  // Education timeline line + items
  const tl = document.getElementById('timeline-line');
  if (tl) {
    gsap.to(tl, {
      scrollTrigger: { trigger: '.education-timeline', start: 'top 80%', end: 'bottom 50%', scrub: 1 },
      height: '100%', ease: 'none'
    });
  }
  gsap.utils.toArray('.edu-item').forEach((item, i) => {
    gsap.to(item, {
      scrollTrigger: { trigger: item, start: 'top 85%', once: true },
      opacity: 1, x: 0, duration: 0.7, delay: i * 0.12, ease: 'power3.out'
    });
  });

  // Experience cards — 3D flip in
  gsap.utils.toArray('.exp-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 85%', once: true },
      opacity: 0, rotateY: -15, x: -40, duration: 0.8, delay: i * 0.2, ease: 'power3.out'
    });
  });

  // Project cards — staggered scale in
  gsap.utils.toArray('.project-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 90%', once: true },
      opacity: 0, y: 60, scale: 0.92, rotateX: 5, duration: 0.7, delay: i * 0.1, ease: 'power3.out'
    });
  });

  // Skill cards — pop in
  gsap.utils.toArray('.skill-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 90%', once: true },
      opacity: 0, scale: 0.7, y: 30, duration: 0.5, delay: i * 0.05, ease: 'back.out(2)'
    });
  });

  // Course tags
  gsap.utils.toArray('.course-tag').forEach((tag, i) => {
    gsap.from(tag, {
      scrollTrigger: { trigger: tag, start: 'top 92%', once: true },
      opacity: 0, y: 20, duration: 0.4, delay: i * 0.04, ease: 'power2.out'
    });
  });

  // Contact split
  gsap.from('.contact-info', {
    scrollTrigger: { trigger: '.contact-grid', start: 'top 80%', once: true },
    opacity: 0, x: -50, duration: 0.8, ease: 'power3.out'
  });
  gsap.from('.contact-form', {
    scrollTrigger: { trigger: '.contact-grid', start: 'top 80%', once: true },
    opacity: 0, x: 50, duration: 0.8, delay: 0.15, ease: 'power3.out'
  });

  // Footer name
  gsap.from('.footer-name', {
    scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true },
    opacity: 0, scale: 0.8, duration: 1, ease: 'power3.out'
  });

  // Parallax depth on sections
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
      y: -20, ease: 'none'
    });
  });
}
