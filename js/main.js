import { createGL, createRectRenderer, createSpriteRenderer, createCircleRenderer, createTexture } from "./renderer.js";
import { loadImages } from "./assets.js";
import { LARGURA, ALTURA, desenharMapa, desenharDestaque, tileNaPosicao, podeConstruir } from "./mapa.js";
import { FOLHAS, atualizarInimigos, desenharInimigos, removerMortos, golpear } from "./inimigos.js";
import { FOLHAS as FOLHAS_DE_TORRE, TIPOS as TIPOS_DE_TORRE, criarTorre, torreEm, atualizarTorres, atualizarProjeteis, removerTorresDestruidas, desenharTorres, desenharProjeteis } from "./torres.js";
import { ORDAS, ORCAMENTO_DE_CLIQUES, criarPartida, atualizarPartida, retomarDepoisDaCarta, pularEspera, pontuacao } from "./ondas.js";
import { sortearCartas, aplicarCarta } from "./cartas.js";
import { prepararSons, definirVolume, tocar, ambiente, tocarMusica, tocarFinal } from "./audio.js";
import { explosao, faisca, poeira, fumaca, atualizarParticulas, desenharParticulas } from "./particulas.js";

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

const SOM_DE_MORTE = {
  spearGoblin: "morteGoblin",
  torchGoblin: "morteGoblin",
  gnoll: "morteGoblin",
  giantBat: "morteMorcego",
  turtle: "morteTartaruga",
  minotaur: "morteMinotauro",
};

const AMBIENTE_DO_TIPO = {
  spearGoblin: "tropas",
  torchGoblin: "tropas",
  gnoll: "tropas",
  giantBat: "morcegos",
  turtle: "tartarugas",
  minotaur: "minotauro",
};

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
const textoPontos = document.getElementById("pontos");
const textoCliques = document.getElementById("cliques");
const textoSituacao = document.getElementById("situacao");
const botaoProxima = document.getElementById("proxima");
const loja = document.getElementById("loja");
const controleDeVolume = document.getElementById("volume");
const controleDeVolumeDoMenu = document.getElementById("volume-menu");
const menu = document.getElementById("menu");
const tabuleiro = document.getElementById("tabuleiro");
const topo = document.getElementById("topo");
const jogo = document.getElementById("jogo");

function ajustarTabuleiro() {
  const sobra = jogo.clientHeight - topo.offsetHeight - loja.offsetHeight;
  const cabe = Math.min(jogo.clientWidth, sobra * 5 / 3);
  const largura = Math.floor(cabe / 5) * 5;

  tabuleiro.style.width = `${largura}px`;
  tabuleiro.style.height = `${largura * 3 / 5}px`;
  topo.style.width = `${largura}px`;
  loja.style.width = `${largura}px`;
}

const observador = new ResizeObserver(ajustarTabuleiro);
observador.observe(jogo);
observador.observe(loja);
const painelDeOpcoes = document.getElementById("painel-opcoes");
const painelDeCreditos = document.getElementById("painel-creditos");
const avisoDeIdioma = document.getElementById("aviso-idioma");
const botoesDoMenu = document.getElementById("menu-botoes");

let noMenu = true;

function abrirPainel(painel) {
  botoesDoMenu.hidden = painel !== null;
  painelDeOpcoes.hidden = painel !== painelDeOpcoes;
  painelDeCreditos.hidden = painel !== painelDeCreditos;
}

document.getElementById("menu-jogar").addEventListener("click", function () {
  menu.hidden = true;
  noMenu = false;
  tocarMusica();
});

document.getElementById("menu-opcoes").addEventListener("click", function () {
  abrirPainel(painelDeOpcoes);
});

document.getElementById("menu-creditos").addEventListener("click", function () {
  abrirPainel(painelDeCreditos);
});

document.getElementById("menu-tela-cheia").addEventListener("click", function () {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

for (const botao of document.querySelectorAll(".painel-menu .voltar")) {
  botao.addEventListener("click", function () {
    abrirPainel(null);
  });
}

const botaoPortugues = document.getElementById("idioma-pt");
const botaoRusso = document.getElementById("idioma-ru");

botaoRusso.addEventListener("click", function () {
  botaoPortugues.classList.remove("escolhido");
  botaoRusso.classList.add("escolhido");
  avisoDeIdioma.textContent = "Botão extremamente útil em manutenção. хорошего дня(Tenha um ótimo dia).";
});

botaoPortugues.addEventListener("click", function () {
  botaoRusso.classList.remove("escolhido");
  botaoPortugues.classList.add("escolhido");
  avisoDeIdioma.textContent = "";
});

prepararSons();
definirVolume(controleDeVolume.value / 100);

controleDeVolume.addEventListener("input", function () {
  controleDeVolumeDoMenu.value = controleDeVolume.value;
  definirVolume(controleDeVolume.value / 100);
});

controleDeVolumeDoMenu.addEventListener("input", function () {
  controleDeVolume.value = controleDeVolumeDoMenu.value;
  definirVolume(controleDeVolumeDoMenu.value / 100);
});


const telaDeFim = document.getElementById("fim");
const retratoDoFim = document.getElementById("fim-retrato");
const tituloDoFim = document.getElementById("fim-titulo");
const textoDoFim = document.getElementById("fim-texto");



function mostrarFim() {
  const venceu = partida.resultado === "vitoria";

  retratoDoFim.src = venceu
    ? "assets/sprites/inimigos/minotaur/Minotaur__Avatar.png"
    : "assets/sprites/inimigos/torch-goblin/Torch Goblin_Avatar.png";

  tituloDoFim.textContent = venceu ? "Vitória!" : "Derrota";

  const total = partida.torresConstruidas;
  const construidas = `${total} ${total === 1 ? "torre construída" : "torres construídas"}`;

  textoDoFim.textContent = venceu
    ? `${pontuacao(partida)} pontos — o castelo resistiu às ${ORDAS.length} hordas com ${partida.vidas} vidas sobrando, ${partida.abates} inimigos abatidos e ${construidas}.`
    : `${pontuacao(partida)} pontos — o castelo caiu na horda ${partida.onda} de ${ORDAS.length}, com ${partida.abates} inimigos abatidos e ${construidas}.`;

  telaDeFim.classList.toggle("derrota", !venceu);
  telaDeFim.hidden = false;
  tocarFinal(partida.resultado);
}

document.getElementById("reiniciar").addEventListener("click", function () {
  location.reload();
});
const telaDeCartas = document.getElementById("cartas");
const tituloDasCartas = document.getElementById("cartas-titulo");
const listaDeCartas = document.getElementById("cartas-lista");

function mostrarCartas() {
  tituloDasCartas.textContent = `Horda ${partida.onda} vencida — escolha uma melhoria`;
  listaDeCartas.textContent = "";

  tocar("cartasNaTela");

  for (const carta of sortearCartas(3)) {
    const elemento = document.createElement("div");
    elemento.className = "carta";
    elemento.innerHTML = `<img src="${carta.retrato}" alt=""><b></b><span></span>`;
    elemento.querySelector("b").textContent = carta.nome;
    elemento.querySelector("span").textContent = carta.texto;

    elemento.addEventListener("click", function () {
      tocar("cartaEscolhida");
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

function mostrarVergonha(evento) {
  const aviso = document.createElement("span");

  aviso.className = "vergonha";
  aviso.textContent = "CLICK OF SHAME!";
  aviso.style.left = `${evento.clientX}px`;
  aviso.style.top = `${evento.clientY}px`;
  document.body.appendChild(aviso);

  setTimeout(function () {
    aviso.remove();
  }, 700);
}

canvas.addEventListener("click", function (evento) {
  if (partida.resultado || partida.estado === "cartas") {
    return;
  }

  const area = canvas.getBoundingClientRect();
  const x = (evento.clientX - area.left) * (canvas.width / area.width);
  const y = (evento.clientY - area.top) * (canvas.height / area.height);

  if (partida.cliques > 0 && golpear(inimigos, x, y)) {
    partida.cliques--;
    tocar("vergonha");
    mostrarVergonha(evento);
    return;
  }

  const tile = tileNaPosicao(x, y);

  if (!podeColocar(tile)) {
    return;
  }

  partida.ouro -= TIPOS_DE_TORRE[torreEscolhida].custo;
  torres.push(criarTorre(torreEscolhida, tile.coluna, tile.linha));
  partida.torresConstruidas++;
  tocar(torreEscolhida === "canhao" ? "construirCanhao" : "construirArqueiro");
  poeira(tile.coluna * 64 + 32, tile.linha * 64 + 40);
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
    return `Próxima horda em ${Math.ceil(partida.tempo)}s`;
  }
  return `Horda ${partida.onda} em andamento`;
}

function atualizarHud() {
  textoOuro.textContent = `Ouro ${partida.ouro}`;
  textoVidas.textContent = `Vidas ${partida.vidas}`;
  textoOnda.textContent = `Horda ${partida.onda}/${ORDAS.length}`;
  textoPontos.textContent = `Pontos ${pontuacao(partida)}`;
  textoCliques.textContent = `Cliques ${partida.cliques}/${ORCAMENTO_DE_CLIQUES}`;
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

const PASSO_MAXIMO = 0.1;

let tempo = 0;
let ultimoTempo = 0;

function aoEvento(nome, x, y) {
  tocar(nome);

  if (nome === "canhaoAcerta") {
    explosao(x, y);
  }

  if (nome === "flechaRefletida") {
    faisca(x, y);
  }
}

function atualizarAmbiente() {
  const vivos = new Set(inimigos.map((inimigo) => AMBIENTE_DO_TIPO[inimigo.tipo]));

  for (const nome of ["tropas", "morcegos", "tartarugas", "minotauro"]) {
    ambiente(nome, vivos.has(nome));
  }
}

function atualizar(dt) {
  if (noMenu) {
    return;
  }

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

  atualizarTorres(torres, inimigos, projeteis, dt, aoEvento);
  atualizarProjeteis(projeteis, inimigos, torres, dt, aoEvento);
  const mortos = removerMortos(inimigos);
  partida.ouro += mortos.ouro;
  partida.abates += mortos.abatidos;

  for (const tipo of new Set(mortos.mortos.map((morto) => morto.tipo))) {
    tocar(SOM_DE_MORTE[tipo]);
  }

  for (const morto of mortos.mortos) {
    fumaca(morto.x, morto.y - 24);
  }

  atualizarAmbiente();

  atualizarParticulas(dt);

  const chegaram = atualizarInimigos(inimigos, torres, dt);

  if (chegaram > 0) {
    tocar("perdeuVida");
  }

  if (removerTorresDestruidas(torres) > 0) {
    tocar("torreDestruida");
  }

  const estadoAnterior = partida.estado;
  atualizarPartida(partida, inimigos, chegaram, dt);

  if (estadoAnterior !== "emOrda" && partida.estado === "emOrda") {
    tocar("comecouOrda");
  }
}

function render(tempoAtual) {
  if (ultimoTempo === 0) {
    ultimoTempo = tempoAtual;
  }

  const dt = Math.min(PASSO_MAXIMO, (tempoAtual - ultimoTempo) / 1000);
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
  desenharParticulas(drawRect);
  desenharAlcance();
  desenharDestaque(drawRect, tileApontado, podeColocar(tileApontado));

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
