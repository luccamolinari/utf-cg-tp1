import { createGL, createRectRenderer, createSpriteRenderer, createCircleRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao, podeConstruir } from "./mapa.js";
import { FOLHAS, atualizarInimigos, desenharInimigos, removerMortos } from "./inimigos.js";
import { FOLHAS as FOLHAS_DE_TORRE, TIPOS as TIPOS_DE_TORRE, criarTorre, torreEm, atualizarTorres, atualizarProjeteis, removerTorresDestruidas, desenharTorres, desenharProjeteis } from "./torres.js";
import { ORDAS, criarPartida, atualizarPartida, retomarDepoisDaCarta, pularEspera } from "./ondas.js";
import { sortearCartas, aplicarCarta } from "./cartas.js";

const canvas = document.getElementById("game-canvas");
canvas.width = LARGURA;
canvas.height = ALTURA;

const gl = createGL(canvas);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const drawSprite = createSpriteRenderer(gl, LARGURA, ALTURA);
const drawRect = createRectRenderer(gl, LARGURA, ALTURA);
const drawCircle = createCircleRenderer(gl, LARGURA, ALTURA);

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

const textoOuro = document.getElementById("ouro");
const textoVidas = document.getElementById("vidas");
const textoOnda = document.getElementById("onda");
const textoSituacao = document.getElementById("situacao");
const botaoProxima = document.getElementById("proxima");
const loja = document.getElementById("loja");
const telaDeFim = document.getElementById("fim");
const retratoDoFim = document.getElementById("fim-retrato");
const tituloDoFim = document.getElementById("fim-titulo");
const textoDoFim = document.getElementById("fim-texto");

let torresConstruidas = 0;

function mostrarFim() {
  const venceu = partida.resultado === "vitoria";

  retratoDoFim.src = venceu
    ? "assets/sprites/inimigos/minotaur/Minotaur__Avatar.png"
    : "assets/sprites/inimigos/torch-goblin/Torch Goblin_Avatar.png";

  tituloDoFim.textContent = venceu ? "Vitória!" : "Derrota";

  const construidas = `${torresConstruidas} ${torresConstruidas === 1 ? "torre construída" : "torres construídas"}`;

  textoDoFim.textContent = venceu
    ? `O castelo resistiu às ${ORDAS.length} ordas com ${partida.vidas} vidas sobrando e ${construidas}.`
    : `O castelo caiu na orda ${partida.onda} de ${ORDAS.length}, com ${construidas}.`;

  telaDeFim.classList.toggle("derrota", !venceu);
  telaDeFim.hidden = false;
}

document.getElementById("reiniciar").addEventListener("click", function () {
  location.reload();
});
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

const botoesDaLoja = {};

for (const nome of NOMES_DE_TORRE) {
  const botao = document.createElement("button");
  botao.className = "torre";
  botao.innerHTML = "<b></b><span></span><span></span>";
  botao.addEventListener("click", function () {
    torreEscolhida = nome;
  });

  const linhas = botao.querySelectorAll("span");
  botoesDaLoja[nome] = { botao, titulo: botao.querySelector("b"), linha1: linhas[0], linha2: linhas[1] };
  loja.appendChild(botao);
}

botaoProxima.addEventListener("click", function () {
  pularEspera(partida);
});

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
  torresConstruidas++;
});

function descreverTorre(tipo) {
  if (tipo.cura) {
    return [
      `Cura ${tipo.cura} a cada ${tipo.recargaDaCura}s`,
      `Alcance ${tipo.alcance} · Lentidão ${Math.round((1 - tipo.lentidao) * 100)}%`,
    ];
  }

  return [
    `Dano ${tipo.dano}${tipo.area ? ` em área ${tipo.area}` : ""} · Recarga ${tipo.cadencia}s`,
    `Alcance ${tipo.alcance} · ${tipo.antiAereo ? "atinge voadores" : "não atinge voadores"}`,
  ];
}

function textoDaSituacao() {
  if (partida.resultado) {
    return partida.resultado === "vitoria" ? "Vitória!" : "Derrota";
  }
  if (partida.estado === "cartas") {
    return "Escolha uma carta";
  }
  if (partida.estado === "preparando") {
    return `Próxima orda em ${Math.ceil(partida.tempo)}s`;
  }
  return `Orda ${partida.onda} em andamento`;
}

function atualizarHud() {
  textoOuro.textContent = `Ouro ${partida.ouro}`;
  textoVidas.textContent = `Vidas ${partida.vidas}`;
  textoOnda.textContent = `Orda ${partida.onda}/${ORDAS.length}`;
  textoSituacao.textContent = textoDaSituacao();
  botaoProxima.disabled = partida.estado !== "preparando" || partida.resultado !== null;

  NOMES_DE_TORRE.forEach(function (nome, indice) {
    const tipo = TIPOS_DE_TORRE[nome];
    const partes = botoesDaLoja[nome];
    const [linha1, linha2] = descreverTorre(tipo);

    partes.titulo.textContent = `${indice + 1} · ${tipo.nome} — ${tipo.custo} de ouro`;
    partes.linha1.textContent = linha1;
    partes.linha2.textContent = linha2;
    partes.botao.classList.toggle("escolhida", nome === torreEscolhida);
    partes.botao.classList.toggle("caro", partida.ouro < tipo.custo);
  });
}

function desenharAlcance() {
  if (!tileApontado) {
    return;
  }

  const existente = torres.find((torre) => torre.coluna === tileApontado.coluna && torre.linha === tileApontado.linha);

  if (existente) {
    drawCircle(existente.x, existente.y, TIPOS_DE_TORRE[existente.tipo].alcance, [1, 1, 1, 0.9]);
    return;
  }

  if (!podeConstruir(tileApontado.coluna, tileApontado.linha)) {
    return;
  }

  const cor = podeColocar(tileApontado) ? [0.4, 1, 0.4, 0.9] : [1, 0.4, 0.4, 0.9];
  drawCircle(tileApontado.coluna * 64 + 32, tileApontado.linha * 64 + 32, TIPOS_DE_TORRE[torreEscolhida].alcance, cor);
}

let tempo = 0;
let ultimoTempo = 0;

function atualizar(dt) {
  if (partida.resultado) {
    if (telaDeFim.hidden) {
      mostrarFim();
    }
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
  atualizarProjeteis(projeteis, inimigos, torres, dt);
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
  atualizarHud();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.35, 0.5, 0.75, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  desenharMapa(drawSprite, drawRect, texturas);
  desenharInimigos(drawSprite, drawRect, texturas, inimigos, tempo);
  desenharTorres(drawSprite, drawRect, texturas, torres, tempo);
  desenharProjeteis(drawSprite, texturas, projeteis);
  desenharAlcance();
  desenharDestaque(drawRect, tileApontado, podeColocar(tileApontado));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
