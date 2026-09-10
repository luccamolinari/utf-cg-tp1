import { createGL, createRectRenderer, createSpriteRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao } from "./mapa.js";

const canvas = document.getElementById("game-canvas");
canvas.width = LARGURA;
canvas.height = ALTURA;

const gl = createGL(canvas);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const drawSprite = createSpriteRenderer(gl, LARGURA, ALTURA);
const drawRect = createRectRenderer(gl, LARGURA, ALTURA);

const imagens = await loadImages({
  terreno: "assets/sprites/terreno/Tilemap_Flat.png",
  castelo: "assets/sprites/predios/Castle.png",
});

const texturas = {
  terreno: createTexture(gl, imagens.terreno),
  castelo: createTexture(gl, imagens.castelo),
};

let tileApontado = null;

canvas.addEventListener("mousemove", function (evento) {
  const area = canvas.getBoundingClientRect();
  const x = (evento.clientX - area.left) * (canvas.width / area.width);
  const y = (evento.clientY - area.top) * (canvas.height / area.height);

  tileApontado = tileNaPosicao(x, y);
});

canvas.addEventListener("mouseleave", function () {
  tileApontado = null;
});

let ultimoTempo = 0;

function atualizar(dt) {
}

function render(tempoAtual) {
  if (ultimoTempo === 0) {
    ultimoTempo = tempoAtual;
  }

  const dt = (tempoAtual - ultimoTempo) / 1000;
  ultimoTempo = tempoAtual;

  atualizar(dt);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.35, 0.5, 0.75, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  desenharMapa(drawSprite, drawRect, texturas);
  desenharDestaque(drawRect, tileApontado);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
