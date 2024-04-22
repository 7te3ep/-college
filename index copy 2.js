const canvas = document.getElementById("canvas1");
const fpsCounter = document.getElementById("fps");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const pool = [];
let hue = 0;
let lastFps = Date.now();
let avgFps = 0;

const MAX_PARTICULS = 2000;
const PARTICULS_SIZE = 7;
const PARTICULS_SPEED = 3;
const LINK_DISTANCE = 50;
const PARTICULS_SPAWNRATE = 5;
const PARTICULS_LIFETIME = 100;

const mouse = {
   x: undefined,
   y: undefined,
};

class Particle {
   constructor() {
      this.activated = false;
   }

   update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.size > 0) this.size -= PARTICULS_SIZE / PARTICULS_LIFETIME;
   }
   draw() {
      if (this.size < 0) return;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
   }
}

for (let i = 0; i < MAX_PARTICULS; i++) {
   pool.push(new Particle());
}

window.addEventListener("resize", function () {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
});

canvas.addEventListener("mousemove", function (event) {
   mouse.x = event.x;
   mouse.y = event.y;
   let ctr = 0;
   let i = 0;
   while (ctr < PARTICULS_SPAWNRATE && i < pool.length) {
      if (!pool[i].activated) {
         pool[i].activated = true;
         pool[i].x = mouse.x;
         pool[i].y = mouse.y;
         pool[i].size = Math.random() * PARTICULS_SIZE;
         pool[i].speedX = Math.random() * PARTICULS_SPEED - PARTICULS_SPEED / 2;
         pool[i].speedY = Math.random() * PARTICULS_SPEED - PARTICULS_SPEED / 2;
         pool[i].color = "hsl(" + hue + ", 100%, 50%)";
         ctr++;
      }
      i++;
   }
});

function handleParticles() {
   for (let i = 0; i < pool.length; i++) {
      if (pool[i].activated) {
         pool[i].update();
         pool[i].draw();
         for (let j = i; j < pool.length; j++) {
            if (pool[j].activated) {
               const dx = pool[i].x - pool[j].x;
               const dy = pool[i].y - pool[j].y;
               const distance = Math.sqrt(dx * dx + dy * dy);
               if (distance < LINK_DISTANCE) {
                  ctx.beginPath();
                  ctx.strokeStyle = pool[i].color;
                  ctx.lineWidth = 0.2;
                  ctx.moveTo(pool[i].x, pool[i].y);
                  ctx.lineTo(pool[j].x, pool[j].y);
                  ctx.stroke();
                  ctx.closePath();
               }
            }
         }
         if (pool[i].size < 0.2) {
            pool[i].activated = false;
         }
      }
   }
}

function animate() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   handleParticles();
   hue += 2;
   avgFps = Math.round(1 / ((avgFps + (Date.now() - lastFps)) / 2 / 1000));
   fpsCounter.innerHTML = Math.floor(avgFps / 2) * 2;
   lastFps = Date.now();
   requestAnimationFrame(animate);
}
animate();

const stream =navigator.mediaDevices
   .getUserMedia({
      audio: true,
   })
   .then((stream) => {
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyzer = context.createAnalyser();
      source.connect(analyzer);

      const array = new Uint8Array(analyzer.fftSize);

      function getPeakLevel() {
         analyzer.getByteTimeDomainData(array);
         return (
            array.reduce(
               (max, current) => Math.max(max, Math.abs(current - 127)),
               0
            ) / 128
         );
      }

      function tick() {
         const peak = getPeakLevel();
         let intensity = Math.round((peak * 3))- 1;
         intensity = intensity < 0 ? 0 : intensity
         const nbParticul = intensity + 1
         let ctr = 0;
         let i = 0;
         while (ctr < nbParticul && i < pool.length) {
            if (!pool[i].activated) {
               pool[i].activated = true;
               pool[i].x = window.innerWidth/2;
               pool[i].y = window.innerHeight/2;
               pool[i].size =
                  (Math.random() * PARTICULS_SIZE) / 2 + intensity;
               pool[i].speedX =
                  Math.random() * PARTICULS_SPEED - PARTICULS_SPEED / 2;
               pool[i].speedY =
                  Math.random() * PARTICULS_SPEED - PARTICULS_SPEED / 2;
               pool[i].color = "hsl(" + hue + ", 100%, 50%)";
               ctr++;
            }
            i++;
         }
         requestAnimationFrame(tick);
      }
      tick();
   });
