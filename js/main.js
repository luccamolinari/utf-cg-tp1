import { createGL, createRectRenderer, createSpriteRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao, podeConstruir } from "./mapa.js";
import { FOLHAS, TIPOS, criarInimigo, atualizarInimigos, desenharInimigos, removerMortos } from "./inimigos.js";
import { FOLHAS as FOLHAS_DE_TORRE, TIPOS as TIPOS_DE_TORRE, criarTorre, torreEm, atualizarTorres, atualizarProjeteis, desenharTorres, desenharProjeteis } from "./torres.js";

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
  ...FOLHAS_DE_TORRE,
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
const torres = [];
const projeteis = [];
const NOMES_DE_TORRE = Object.keys(TIPOS_DE_TORRE);

let torreEscolhida = NOMES_DE_TORRE[0];
let ouro = 0;

window.addEventListener("keydown", function (evento) {
  const indice = Number(evento.key) - 1;

  if (indice >= 0 && indice < NOMES_DE_TORRE.length) {
    torreEscolhida = NOMES_DE_TORRE[indice];
  }
});

function podeColocar(tile) {
  return tile !== null && podeConstruir(tile.coluna, tile.linha) && !torreEm(torres, tile.coluna, tile.linha);
}

canvas.addEventListener("click", function () {
  if (podeColocar(tileApontado)) {
    torres.push(criarTorre(torreEscolhida, tileApontado.coluna, tileApontado.linha));
  }
});
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

  atualizarTorres(torres, inimigos, projeteis, dt);
  atualizarProjeteis(projeteis, inimigos, dt);
  ouro += removerMortos(inimigos);
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
  desenharInimigos(drawSprite, drawRect, texturas, inimigos, tempo);
  desenharTorres(drawSprite, texturas, torres, tempo);
  desenharProjeteis(drawSprite, texturas, projeteis);
  desenharDestaque(drawRect, tileApontado, podeColocar(tileApontado));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
