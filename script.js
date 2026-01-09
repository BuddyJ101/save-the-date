const canvas = document.getElementById("scratch-canvas");
const ctx = canvas.getContext("2d");

const dustCanvas = document.getElementById("dust-canvas");
const dustCtx = dustCanvas.getContext("2d");

const image = new Image();
image.src = "assets/images/pokeball.png";

/* -----------------------------
   TUNABLE VARIABLES
------------------------------ */
const SCRATCH_THRESHOLD = 0.7;
const CHECK_INTERVAL = 300;

const AUTO_SCRATCH_START_DELAY = 5000;
const AUTO_SCRATCH_INTERVAL = 2000;

const BRUSH_RADIUS = 30;
const LINE_STEPS = 40;

/* Dust */
const DUST_COUNT = 8;
const DUST_GRAVITY = 0.15;
const DUST_LIFETIME = 800;
const DUST_COLOR = "173, 216, 230";

/* Completion FX */
const FLASH_DURATION = 180;
const SPARKLE_COUNT = 26;
const SPARKLE_LIFETIME = 700;

/* Sound */
const SCRATCH_SOUND_SRC = "assets/audio/scratch.mp3";
const SCRATCH_SOUND_VOLUME = 0.25;

/* -----------------------------
   STATE
------------------------------ */
let isDrawing = false;
let isComplete = false;
let lastCheck = 0;

let autoScratchStartTimer = null;
let autoScratchInterval = null;

/* Dust */
let dustParticles = [];
let dustAnimating = false;
let playingCompletionFX = false;

/* Sound */
const scratchSound = new Audio(SCRATCH_SOUND_SRC);
scratchSound.loop = true;
scratchSound.volume = SCRATCH_SOUND_VOLUME;

const autoScratchSound = new Audio(SCRATCH_SOUND_SRC);
autoScratchSound.loop = false;
autoScratchSound.volume = SCRATCH_SOUND_VOLUME;

let soundEnabled = false;
let soundPlaying = false;

/* -----------------------------
   ENABLE SOUND AFTER USER INTERACTION
------------------------------ */
function enableSound() {
  soundEnabled = true;
  window.removeEventListener("mousedown", enableSound);
  window.removeEventListener("touchstart", enableSound);
}
window.addEventListener("mousedown", enableSound);
window.addEventListener("touchstart", enableSound);

/* -----------------------------
   SOUND CONTROL
------------------------------ */
function startScratchSound() {
  if (!soundEnabled || soundPlaying) return;
  soundPlaying = true;
  scratchSound.currentTime = 0;
  scratchSound.play().catch(() => {});
}

function stopScratchSound() {
  if (!soundPlaying) return;
  soundPlaying = false;
  scratchSound.pause();
  scratchSound.currentTime = 0;
}

function playAutoScratchSoundOnce() {
  if (!soundEnabled) return;
  autoScratchSound.currentTime = 0;
  autoScratchSound.play().catch(() => {});
}

/* -----------------------------
   INITIALISE CANVASES
------------------------------ */
function resizeCanvases() {
  const rect = canvas.getBoundingClientRect();
  const aspectRatio = image.height / image.width;

  canvas.width = rect.width;
  canvas.height = rect.width * aspectRatio;

  dustCanvas.width = canvas.width;
  dustCanvas.height = canvas.height;

  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-out";
}

image.onload = () => {
  resizeCanvases();
  startAutoScratchSequence();
};

window.addEventListener("resize", resizeCanvases);

/* -----------------------------
   AUTO SCRATCH SEQUENCE
------------------------------ */
function startAutoScratchSequence() {
  autoScratchStartTimer = setTimeout(() => {
    if (!isComplete) {
      drawAutoScratchLine();
      startAutoScratchInterval();
    }
  }, AUTO_SCRATCH_START_DELAY);
}

function startAutoScratchInterval() {
  autoScratchInterval = setInterval(() => {
    if (isComplete) {
      stopAutoScratch();
      return;
    }
    drawAutoScratchLine();
  }, AUTO_SCRATCH_INTERVAL);
}

function stopAutoScratch() {
  clearTimeout(autoScratchStartTimer);
  clearInterval(autoScratchInterval);
  autoScratchStartTimer = null;
  autoScratchInterval = null;
}

/* -----------------------------
   DRAW AUTO SCRATCH LINE
------------------------------ */
function drawAutoScratchLine() {
  playAutoScratchSoundOnce();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const angle = Math.random() * Math.PI * 2;
  const length = Math.max(canvas.width, canvas.height);

  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  for (let i = 0; i <= LINE_STEPS; i++) {
    const t = i / LINE_STEPS;
    scratchAt(
      cx - dx * length + dx * length * 2 * t,
      cy - dy * length + dy * length * 2 * t
    );
  }

  maybeCheckCompletion();
}

/* -----------------------------
   SCRATCH AT POINT
------------------------------ */
function scratchAt(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  spawnDust(x, y);
}

/* -----------------------------
   USER INPUT
------------------------------ */
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clientX = e.clientX ?? e.touches[0].clientX;
  const clientY = e.clientY ?? e.touches[0].clientY;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function scratch(e) {
  if (!isDrawing || isComplete) return;
  stopAutoScratch();
  startScratchSound();
  const { x, y } = getPointerPos(e);
  scratchAt(x, y);
  maybeCheckCompletion();
}

/* -----------------------------
   DUST
------------------------------ */
function spawnDust(x, y) {
  for (let i = 0; i < DUST_COUNT; i++) {
    dustParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 1.5,
      born: performance.now(),
      size: Math.random() * 3 + 1
    });
  }
  if (!dustAnimating) {
    dustAnimating = true;
    requestAnimationFrame(updateDust);
  }
}

function updateDust(time) {
  if (playingCompletionFX) return;

  dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);

  dustParticles = dustParticles.filter(p => {
    const age = time - p.born;
    if (age > DUST_LIFETIME) return false;

    p.vy += DUST_GRAVITY;
    p.x += p.vx;
    p.y += p.vy;

    const alpha = 1 - age / DUST_LIFETIME;
    dustCtx.fillStyle = `rgba(${DUST_COLOR}, ${alpha * 0.4})`;
    dustCtx.beginPath();
    dustCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    dustCtx.fill();

    return true;
  });

  dustAnimating = dustParticles.length > 0;
  if (dustAnimating) requestAnimationFrame(updateDust);
}

/* -----------------------------
   COMPLETION EFFECT
------------------------------ */
function playCompletionEffect() {
  playingCompletionFX = true;

  const cx = dustCanvas.width / 2;
  const cy = dustCanvas.height / 2;

  // Flash
  dustCtx.fillStyle = "rgba(255,255,255,0.85)";
  dustCtx.fillRect(0, 0, dustCanvas.width, dustCanvas.height);

  setTimeout(() => {
    dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
  }, FLASH_DURATION);

  // Sparkles
  const start = performance.now();
  const sparkles = Array.from({ length: SPARKLE_COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * 120 + 80,
    size: Math.random() * 2 + 2
  }));

  function animate(time) {
    const elapsed = time - start;
    const t = elapsed / SPARKLE_LIFETIME;

    dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);

    sparkles.forEach(s => {
      const dist = s.speed * (elapsed / 1000);
      const x = cx + Math.cos(s.angle) * dist;
      const y = cy + Math.sin(s.angle) * dist;

      dustCtx.fillStyle = `rgba(${DUST_COLOR}, ${1 - t})`;
      dustCtx.beginPath();
      dustCtx.arc(x, y, s.size, 0, Math.PI * 2);
      dustCtx.fill();
    });

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
      playingCompletionFX = false;
    }
  }

  requestAnimationFrame(animate);
}

/* -----------------------------
   COMPLETION
------------------------------ */
function maybeCheckCompletion() {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) return;
  lastCheck = now;

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = 0;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) transparent++;
  }

  if (transparent / (pixels.length / 4) >= SCRATCH_THRESHOLD) {
    completeScratch();
  }
}

function completeScratch() {
  if (isComplete) return;

  isComplete = true;
  stopAutoScratch();
  stopScratchSound();
  playCompletionEffect();

  canvas.style.transition = "opacity 0.8s ease";
  canvas.style.opacity = "0";

  setTimeout(() => {
    canvas.style.pointerEvents = "none";
  }, 800);
}

/* -----------------------------
   EVENTS
------------------------------ */
canvas.addEventListener("mousedown", () => {
  isDrawing = true;
  stopAutoScratch();
  startScratchSound();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  stopScratchSound();
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  stopScratchSound();
});

canvas.addEventListener("mousemove", scratch);

canvas.addEventListener(
  "touchstart",
  e => {
    isDrawing = true;
    stopAutoScratch();
    startScratchSound();
    e.preventDefault();
  },
  { passive: false }
);

canvas.addEventListener("touchend", () => {
  isDrawing = false;
  stopScratchSound();
});

canvas.addEventListener(
  "touchmove",
  e => {
    scratch(e);
    e.preventDefault();
  },
  { passive: false }
);
