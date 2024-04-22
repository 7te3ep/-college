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
const LINK_DISTANCE = 40;
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
   const posHashmap = [];

   for (let x = 0; x <= window.innerWidth; x += LINK_DISTANCE) {
      posHashmap.push([]);
      for (let y = 0; y <= window.innerHeight; y += LINK_DISTANCE) {
         posHashmap[x / LINK_DISTANCE].push([]);
      }
   }
   for (let i = 0; i < pool.length; i++) {
      if (pool[i].activated) {
         const posX = Math.floor(pool[i].x / LINK_DISTANCE);
         const posY = Math.floor(pool[i].y / LINK_DISTANCE);
         posHashmap[posX][posY].push(pool[i]);
      }
   }

   for (let x = 0; x < posHashmap.length; x++) {
      for (let y = 0; y < posHashmap[x].length; y++) {
         posHashmap[x][y].forEach((particul) => {
            particul.update();
            particul.draw();
            if (
               particul.size < 0.2 ||
               particul.x < 0 ||
               particul.y < 0 ||
               particul.x > window.innerWidth ||
               particul.y > innerHeight
            ) {
               particul.activated = false;
            }
            let neighborsArray = [];
            for (let xNeighbor = x - 1; xNeighbor <= x + 1; xNeighbor++) {
               for (let yNeighbor = y - 1; yNeighbor <= y + 1; yNeighbor++) {
                  if (posHashmap[xNeighbor]) {
                     if (posHashmap[xNeighbor][yNeighbor]) {
                        posHashmap[xNeighbor][yNeighbor].forEach((neighbor) => {
                           const dx = particul.x - neighbor.x;
                           const dy = particul.y - neighbor.y;
                           const distance = Math.sqrt(dx * dx + dy * dy);
                           if (distance < LINK_DISTANCE)
                              neighborsArray.push(neighbor);
                        });
                     }
                  }
               }
            }

            neighborsArray.forEach((neighbor) => {
               ctx.beginPath();
               ctx.strokeStyle = particul.color;
               ctx.lineWidth = 0.2;
               ctx.moveTo(particul.x, particul.y);
               ctx.lineTo(neighbor.x, neighbor.y);
               ctx.stroke();
               ctx.closePath();
            });
         });
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

const stream = navigator.mediaDevices
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
         let intensity = Math.round(peak/2 * 5) - 1;
         intensity = intensity < 0 ? 0 : intensity;
         const nbParticul = intensity ;
         let ctr = 0;
         let i = 0;
         while (ctr < nbParticul && i < pool.length) {
            if (!pool[i].activated) {
               pool[i].activated = true;
               pool[i].x = window.innerWidth / 2;
               pool[i].y = window.innerHeight / 2;
               pool[i].size = (Math.random() * PARTICULS_SIZE) / 2 + intensity;
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
