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

export const PONTOS_DE_TORRE = [
  { x: 400, y: 144 },
  { x: 336, y: 368 },
  { x: 176, y: 464 },
  { x: 112, y: 656 },
  { x: 624, y: 592 },
  { x: 784, y: 560 },
  { x: 944, y: 528 },
  { x: 1136, y: 560 },
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

  for (const ponto of PONTOS_DE_TORRE) {
    drawRect({ x: ponto.x - LADO_TILE / 2, y: ponto.y - LADO_TILE / 2, w: LADO_TILE, h: LADO_TILE }, [1, 1, 1, 0.22]);
  }
}
