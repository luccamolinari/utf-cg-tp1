import { frameRect } from "./renderer.js";

export const LADO_TILE = 64;
export const COLUNAS = 20;
export const LINHAS = 12;
export const LARGURA = COLUNAS * LADO_TILE;
export const ALTURA = LINHAS * LADO_TILE;

const TILE_GRAMA = 11;
const TILE_AREIA = 16;

const PONTOS_POR_TRECHO = 24;
const PASSO_DO_DESENHO = 3;

const CASTELO = { x: 900, y: 90, w: 320, h: 256 };
const FOLGA_DO_CAMINHO = 64;

const CONTROLE = [
  { x: -80, y: 200 },
  { x: 140, y: 200 },
  { x: 330, y: 215 },
  { x: 450, y: 345 },
  { x: 350, y: 485 },
  { x: 190, y: 575 },
  { x: 280, y: 690 },
  { x: 540, y: 705 },
  { x: 730, y: 660 },
  { x: 900, y: 640 },
  { x: 1035, y: 565 },
  { x: 1060, y: 369 },
];


function pontoDaCurva(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function construirCaminho() {
  const pontos = [CONTROLE[0], ...CONTROLE, CONTROLE[CONTROLE.length - 1]];
  const curva = [];

  for (let i = 0; i < pontos.length - 3; i++) {
    for (let passo = 0; passo < PONTOS_POR_TRECHO; passo++) {
      curva.push(pontoDaCurva(pontos[i], pontos[i + 1], pontos[i + 2], pontos[i + 3], passo / PONTOS_POR_TRECHO));
    }
  }

  curva.push(CONTROLE[CONTROLE.length - 1]);
  return curva;
}

export const CAMINHO = construirCaminho();
const TERRENO_LIVRE = calcularTerrenoLivre();

const ACUMULADO = (function () {
  const distancias = [0];

  for (let i = 1; i < CAMINHO.length; i++) {
    const anterior = CAMINHO[i - 1];
    const atual = CAMINHO[i];
    distancias.push(distancias[i - 1] + Math.hypot(atual.x - anterior.x, atual.y - anterior.y));
  }

  return distancias;
})();

export const COMPRIMENTO_DO_CAMINHO = ACUMULADO[ACUMULADO.length - 1];

export function posicaoNoCaminho(distancia) {
  if (distancia <= 0) {
    return CAMINHO[0];
  }

  if (distancia >= COMPRIMENTO_DO_CAMINHO) {
    return CAMINHO[CAMINHO.length - 1];
  }

  let baixo = 0;
  let alto = ACUMULADO.length - 1;

  while (alto - baixo > 1) {
    const meio = (baixo + alto) >> 1;
    if (ACUMULADO[meio] <= distancia) {
      baixo = meio;
    } else {
      alto = meio;
    }
  }

  const trecho = ACUMULADO[alto] - ACUMULADO[baixo];
  const t = trecho === 0 ? 0 : (distancia - ACUMULADO[baixo]) / trecho;

  return {
    x: CAMINHO[baixo].x + (CAMINHO[alto].x - CAMINHO[baixo].x) * t,
    y: CAMINHO[baixo].y + (CAMINHO[alto].y - CAMINHO[baixo].y) * t,
  };
}

function distanciaDoCaminho(x, y) {
  let menor = Infinity;

  for (const ponto of CAMINHO) {
    const distancia = Math.hypot(x - ponto.x, y - ponto.y);
    if (distancia < menor) {
      menor = distancia;
    }
  }

  return menor;
}

function encostaNoCastelo(coluna, linha) {
  const area = areaDoTile(coluna, linha);

  return area.x < CASTELO.x + CASTELO.w
    && area.x + area.w > CASTELO.x
    && area.y < CASTELO.y + CASTELO.h
    && area.y + area.h > CASTELO.y;
}

function calcularTerrenoLivre() {
  const livre = [];

  for (let linha = 0; linha < LINHAS; linha++) {
    livre.push([]);
    for (let coluna = 0; coluna < COLUNAS; coluna++) {
      const centro = { x: coluna * LADO_TILE + LADO_TILE / 2, y: linha * LADO_TILE + LADO_TILE / 2 };
      livre[linha].push(distanciaDoCaminho(centro.x, centro.y) > FOLGA_DO_CAMINHO && !encostaNoCastelo(coluna, linha));
    }
  }

  return livre;
}

export function podeConstruir(coluna, linha) {
  if (coluna < 0 || coluna >= COLUNAS || linha < 0 || linha >= LINHAS) {
    return false;
  }

  return TERRENO_LIVRE[linha][coluna];
}

export function tileNaPosicao(x, y) {
  return { coluna: Math.floor(x / LADO_TILE), linha: Math.floor(y / LADO_TILE) };
}

export function desenharDestaque(drawRect, tile) {
  if (!tile) {
    return;
  }

  const cor = podeConstruir(tile.coluna, tile.linha) ? [0.4, 1, 0.4, 0.35] : [1, 0.3, 0.3, 0.35];
  drawRect(areaDoTile(tile.coluna, tile.linha), cor);
}

export function areaDoTile(coluna, linha) {
  return { x: coluna * LADO_TILE, y: linha * LADO_TILE, w: LADO_TILE, h: LADO_TILE };
}

export function desenharMapa(drawSprite, drawRect, texturas) {
  const grama = frameRect(texturas.terreno, TILE_GRAMA, LADO_TILE);
  const areia = frameRect(texturas.terreno, TILE_AREIA, LADO_TILE);

  for (let linha = 0; linha < LINHAS; linha++) {
    for (let coluna = 0; coluna < COLUNAS; coluna++) {
      drawSprite(texturas.terreno, areaDoTile(coluna, linha), grama);
    }
  }

  for (let i = 0; i < CAMINHO.length; i += PASSO_DO_DESENHO) {
    const ponto = CAMINHO[i];
    drawSprite(texturas.terreno, {
      x: ponto.x - LADO_TILE / 2,
      y: ponto.y - LADO_TILE / 2,
      w: LADO_TILE,
      h: LADO_TILE,
    }, areia);
  }

  drawSprite(texturas.castelo, CASTELO);
}
