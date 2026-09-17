import { createGL, createRectRenderer, createSpriteRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao, podeConstruir } from "./mapa.js";
import { FOLHAS, atualizarInimigos, desenharInimigos, removerMortos } from "./inimigos.js";
import { FOLHAS as FOLHAS_DE_TORRE, TIPOS as TIPOS_DE_TORRE, criarTorre, torreEm, atualizarTorres, atualizarProjeteis, removerTorresDestruidas, desenharTorres, desenharProjeteis } from "./torres.js";
import { ORDAS, criarPartida, atualizarPartida, retomarDepoisDaCarta } from "./ondas.js";
import { sortearCartas, aplicarCarta } from "./cartas.js";

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

const inimigos = [];
const torres = [];
const projeteis = [];
const partida = criarPartida();

const NOMES_DE_TORRE = Object.keys(TIPOS_DE_TORRE);
let torreEscolhida = NOMES_DE_TORRE[0];
let tileApontado = null;

const painel = document.getElementById("painel");
const telaDeCartas = document.getElementById("cartas");
const tituloDasCartas = document.getElementById("cartas-titulo");
const listaDeCartas = document.getElementById("cartas-lista");

function mostrarCartas() {
  tituloDasCartas.textContent = `Orda ${partida.onda} vencida — escolha uma melhoria`;
  listaDeCartas.textContent = "";

  for (const carta of sortearCartas(3)) {
    const elemento = document.createElement("div");
    elemento.className = "carta";
    elemento.innerHTML = `<img src="${carta.retrato}" alt=""><b></b><span></span>`;
    elemento.querySelector("b").textContent = carta.nome;
    elemento.querySelector("span").textContent = carta.texto;

    elemento.addEventListener("click", function () {
      aplicarCarta(carta, partida, torres);
      telaDeCartas.hidden = true;
      retomarDepoisDaCarta(partida);
    });

    listaDeCartas.appendChild(elemento);
  }

  telaDeCartas.hidden = false;
}

window.addEventListener("keydown", function (evento) {
  const indice = Number(evento.key) - 1;

  if (indice >= 0 && indice < NOMES_DE_TORRE.length) {
    torreEscolhida = NOMES_DE_TORRE[indice];
  }
});

function podeColocar(tile) {
  return tile !== null
    && podeConstruir(tile.coluna, tile.linha)
    && !torreEm(torres, tile.coluna, tile.linha)
    && partida.ouro >= TIPOS_DE_TORRE[torreEscolhida].custo;
}

canvas.addEventListener("mousemove", function (evento) {
  const area = canvas.getBoundingClientRect();
  const x = (evento.clientX - area.left) * (canvas.width / area.width);
  const y = (evento.clientY - area.top) * (canvas.height / area.height);

  tileApontado = tileNaPosicao(x, y);
});

canvas.addEventListener("mouseleave", function () {
  tileApontado = null;
});

canvas.addEventListener("click", function () {
  if (!podeColocar(tileApontado) || partida.resultado) {
    return;
  }

  partida.ouro -= TIPOS_DE_TORRE[torreEscolhida].custo;
  torres.push(criarTorre(torreEscolhida, tileApontado.coluna, tileApontado.linha));
});

function atualizarPainel() {
  const escolhida = TIPOS_DE_TORRE[torreEscolhida];
  const fase = partida.resultado
    ? (partida.resultado === "vitoria" ? "VITORIA" : "DERROTA")
    : partida.estado === "preparando"
      ? `proxima orda em ${Math.ceil(partida.tempo)}s`
      : `orda ${partida.onda} em andamento`;

  painel.textContent =
    `ouro ${partida.ouro}   vidas ${partida.vidas}   orda ${partida.onda}/${ORDAS.length}   ${fase}` +
    `   |   [1]Arqueiro 50  [2]Canhao 120  [3]Monge 90   selecionada: ${escolhida.nome}`;
}

let tempo = 0;
let ultimoTempo = 0;

function atualizar(dt) {
  if (partida.resultado) {
    return;
  }

  if (partida.estado === "cartas") {
    if (telaDeCartas.hidden) {
      mostrarCartas();
    }
    return;
  }

  tempo += dt;

  atualizarTorres(torres, inimigos, projeteis, dt);
  atualizarProjeteis(projeteis, inimigos, dt);
  partida.ouro += removerMortos(inimigos);

  const chegaram = atualizarInimigos(inimigos, torres, dt);
  removerTorresDestruidas(torres);
  atualizarPartida(partida, inimigos, chegaram, dt);
}

function render(tempoAtual) {
  if (ultimoTempo === 0) {
    ultimoTempo = tempoAtual;
  }

  const dt = (tempoAtual - ultimoTempo) / 1000;
  ultimoTempo = tempoAtual;

  atualizar(dt);
  atualizarPainel();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.35, 0.5, 0.75, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  desenharMapa(drawSprite, drawRect, texturas);
  desenharInimigos(drawSprite, drawRect, texturas, inimigos, tempo);
  desenharTorres(drawSprite, drawRect, texturas, torres, tempo);
  desenharProjeteis(drawSprite, texturas, projeteis);
  desenharDestaque(drawRect, tileApontado, podeColocar(tileApontado));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
