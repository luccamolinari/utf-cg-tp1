import { COMPRIMENTO_DO_CAMINHO, posicaoNoCaminho } from "./mapa.js";
import { frameRect } from "./renderer.js";

export const TIPOS = {
  spearGoblin: {
    folha: "assets/sprites/inimigos/spear-goblin/Spear Goblin_Run.png",
    tamanho: 136, ancoraX: 0.469, ancoraY: 0.668, alturaDoVoo: 0, alturaDaArte: 0.461,
    velocidade: 82, vida: 30, ouro: 8, fps: 12,
  },
  torchGoblin: {
    folha: "assets/sprites/inimigos/torch-goblin/Torch Goblin_Run.png",
    tamanho: 104, ancoraX: 0.411, ancoraY: 0.693, alturaDoVoo: 0, alturaDaArte: 0.339,
    velocidade: 64, vida: 55, ouro: 11, fps: 11,
  },
  gnoll: {
    folha: "assets/sprites/inimigos/gnoll/Gnoll_Walk.png",
    tamanho: 104, ancoraX: 0.513, ancoraY: 0.703, alturaDoVoo: 0, alturaDaArte: 0.411,
    velocidade: 56, vida: 80, ouro: 14, fps: 10,
  },
  giantBat: {
    folha: "assets/sprites/inimigos/giant-bat/Giant Bat_Move.png",
    tamanho: 88, ancoraX: 0.451, ancoraY: 0.745, alturaDoVoo: 22, alturaDaArte: 0.469,
    velocidade: 124, vida: 22, ouro: 10, fps: 14,
  },
  turtle: {
    folha: "assets/sprites/inimigos/turtle/Turtle_Walk.png",
    tamanho: 152, ancoraX: 0.520, ancoraY: 0.650, alturaDoVoo: 0, alturaDaArte: 0.281,
    velocidade: 34, vida: 200, ouro: 25, fps: 9,
  },
  minotaur: {
    folha: "assets/sprites/inimigos/minotaur/Minotaur_Walk.png",
    tamanho: 192, ancoraX: 0.4125, ancoraY: 0.669, alturaDoVoo: 0, alturaDaArte: 0.406,
    velocidade: 40, vida: 900, ouro: 150, fps: 10,
  },
};

export const FOLHAS = Object.fromEntries(
  Object.keys(TIPOS).map((nome) => [nome, TIPOS[nome].folha])
);

export function criarInimigo(nome) {
  return {
    tipo: nome,
    distancia: 0,
    vida: TIPOS[nome].vida,
    lentidao: 1,
    atraso: Math.random(),
  };
}

export function atualizarInimigos(lista, dt) {
  let chegaram = 0;

  for (let i = lista.length - 1; i >= 0; i--) {
    const inimigo = lista[i];
    inimigo.distancia += TIPOS[inimigo.tipo].velocidade * inimigo.lentidao * dt;

    if (inimigo.distancia >= COMPRIMENTO_DO_CAMINHO) {
      lista.splice(i, 1);
      chegaram++;
    }
  }

  return chegaram;
}

export function removerMortos(lista) {
  let ouro = 0;

  for (let i = lista.length - 1; i >= 0; i--) {
    if (lista[i].vida <= 0) {
      ouro += TIPOS[lista[i].tipo].ouro;
      lista.splice(i, 1);
    }
  }

  return ouro;
}

function quadroAtual(recurso, tempo, fps) {
  const total = Math.floor(recurso.largura / recurso.altura);
  return Math.floor(tempo * fps) % total;
}

export function desenharInimigos(drawSprite, drawRect, texturas, lista, tempo) {
  const ordenados = lista
    .map((inimigo) => ({ inimigo, posicao: posicaoNoCaminho(inimigo.distancia) }))
    .sort((a, b) => a.posicao.y - b.posicao.y);

  for (const { inimigo, posicao } of ordenados) {
    const tipo = TIPOS[inimigo.tipo];
    const recurso = texturas[inimigo.tipo];

    const adiante = posicaoNoCaminho(inimigo.distancia + 6);
    const espelhado = adiante.x < posicao.x;

    const fracao = espelhado ? 1 - tipo.ancoraX : tipo.ancoraX;
    const x = posicao.x - tipo.tamanho * fracao;
    const y = posicao.y - tipo.tamanho * tipo.ancoraY - tipo.alturaDoVoo;

    const destino = espelhado
      ? { x: x + tipo.tamanho, y, w: -tipo.tamanho, h: tipo.tamanho }
      : { x, y, w: tipo.tamanho, h: tipo.tamanho };

    const recorte = frameRect(recurso, quadroAtual(recurso, tempo + inimigo.atraso, tipo.fps), recurso.altura);
    drawSprite(recurso, destino, recorte);

    if (inimigo.vida < tipo.vida) {
      const largura = 44;
      const topo = posicao.y - tipo.alturaDoVoo - tipo.tamanho * tipo.alturaDaArte - 12;
      const cheia = Math.max(0, inimigo.vida / tipo.vida);

      drawRect({ x: posicao.x - largura / 2, y: topo, w: largura, h: 6 }, [0.1, 0.05, 0.05, 0.8]);
      drawRect({ x: posicao.x - largura / 2 + 1, y: topo + 1, w: (largura - 2) * cheia, h: 4 }, [0.85, 0.2, 0.2, 1]);
    }
  }
}
