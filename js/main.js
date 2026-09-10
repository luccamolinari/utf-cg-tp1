import { createGL, createRectRenderer, createSpriteRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao } from "./mapa.js";
import { FOLHAS, TIPOS, criarInimigo, atualizarInimigos, desenharInimigos } from "./inimigos.js";

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
  ...FOLHAS,
});

const texturas = {};
for (const nome of Object.keys(imagens)) {
  texturas[nome] = createTexture(gl, imagens[nome]);
}

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

const inimigos = [];
const NOMES_DOS_TIPOS = Object.keys(TIPOS);

let tempo = 0;
let ultimoTempo = 0;
let proximoSpawn = 0;

function atualizar(dt) {
  tempo += dt;
  proximoSpawn -= dt;

  if (proximoSpawn <= 0) {
    inimigos.push(criarInimigo(NOMES_DOS_TIPOS[Math.floor(Math.random() * NOMES_DOS_TIPOS.length)]));
    proximoSpawn = 1.4;
  }

  atualizarInimigos(inimigos, dt);
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
  desenharInimigos(drawSprite, texturas, inimigos, tempo);
  desenharDestaque(drawRect, tileApontado);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
