import { COMPRIMENTO_DO_CAMINHO, posicaoNoCaminho } from "./mapa.js";
import { frameRect } from "./renderer.js";

export const TIPOS = {
  spearGoblin: {
    folha: "assets/sprites/inimigos/spear-goblin/Spear Goblin_Run.png",
    tamanho: 136, ancoraX: 0.469, ancoraY: 0.668, alturaDoVoo: 0, alturaDaArte: 0.461,
    velocidade: 120, vida: 50, ouro: 4, fps: 14,
  },
  torchGoblin: {
    folha: "assets/sprites/inimigos/torch-goblin/Torch Goblin_Run.png",
    tamanho: 104, ancoraX: 0.411, ancoraY: 0.693, alturaDoVoo: 0, alturaDaArte: 0.339,
    velocidade: 95, vida: 90, ouro: 6, fps: 13,
  },
  gnoll: {
    folha: "assets/sprites/inimigos/gnoll/Gnoll_Walk.png",
    tamanho: 104, ancoraX: 0.513, ancoraY: 0.703, alturaDoVoo: 0, alturaDaArte: 0.411,
    velocidade: 85, vida: 130, ouro: 7, fps: 12,
  },
  giantBat: {
    folha: "assets/sprites/inimigos/giant-bat/Giant Bat_Move.png",
    atacando: "assets/sprites/inimigos/giant-bat/Giant Bat_Attack.png",
    tamanho: 88, ancoraX: 0.451, ancoraY: 0.745, alturaDoVoo: 26, alturaDaArte: 0.469,
    velocidade: 210, vida: 50, ouro: 8, fps: 18,
    voador: true, caca: "canhao", dano: 18,
  },
  turtle: {
    folha: "assets/sprites/inimigos/turtle/Turtle_Walk.png",
    tamanho: 152, ancoraX: 0.520, ancoraY: 0.650, alturaDoVoo: 0, alturaDaArte: 0.281,
    velocidade: 55, vida: 325, ouro: 13, fps: 11,
  },
  minotaur: {
    folha: "assets/sprites/inimigos/minotaur/Minotaur_Walk.png",
    tamanho: 192, ancoraX: 0.4125, ancoraY: 0.669, alturaDoVoo: 0, alturaDaArte: 0.406,
    velocidade: 62, vida: 1450, ouro: 75, fps: 12,
  },
};

export const FOLHAS = (function () {
  const mapa = {};

  for (const nome of Object.keys(TIPOS)) {
    mapa[nome] = TIPOS[nome].folha;
    if (TIPOS[nome].atacando) {
      mapa[nome + "Atacando"] = TIPOS[nome].atacando;
    }
  }

  return mapa;
})();

const ENTRADA = posicaoNoCaminho(0);
const CASTELO = posicaoNoCaminho(COMPRIMENTO_DO_CAMINHO);
const DISTANCIA_DE_ATAQUE = 34;

export function criarInimigo(nome) {
  return {
    tipo: nome,
    distancia: 0,
    x: ENTRADA.x,
    y: ENTRADA.y,
    vida: TIPOS[nome].vida,
    lentidao: 1,
    olhandoParaEsquerda: false,
    atacando: false,
    alvo: null,
    atraso: Math.random(),
  };
}

function escolherAlvo(inimigo, torres) {
  const caca = TIPOS[inimigo.tipo].caca;
  let melhor = null;
  let menor = Infinity;

  for (const torre of torres) {
    if (torre.tipo !== caca) {
      continue;
    }

    const distancia = Math.hypot(torre.x - inimigo.x, torre.y - inimigo.y);

    if (distancia < menor) {
      menor = distancia;
      melhor = torre;
    }
  }

  return melhor;
}

function moverVoador(inimigo, torres, dt) {
  const tipo = TIPOS[inimigo.tipo];

  if (!inimigo.alvo || inimigo.alvo.vida <= 0 || !torres.includes(inimigo.alvo)) {
    inimigo.alvo = escolherAlvo(inimigo, torres);
  }

  const destino = inimigo.alvo || CASTELO;
  const dx = destino.x - inimigo.x;
  const dy = destino.y - inimigo.y;
  const distancia = Math.hypot(dx, dy);

  inimigo.olhandoParaEsquerda = dx < 0;
  inimigo.atacando = false;

  if (inimigo.alvo && distancia <= DISTANCIA_DE_ATAQUE) {
    inimigo.atacando = true;
    inimigo.alvo.vida -= tipo.dano * dt;
    return false;
  }

  const passo = tipo.velocidade * inimigo.lentidao * dt;

  if (!inimigo.alvo && distancia <= passo) {
    return true;
  }

  inimigo.x += (dx / distancia) * passo;
  inimigo.y += (dy / distancia) * passo;
  return false;
}

function moverNoChao(inimigo, dt) {
  const anterior = inimigo.x;
  inimigo.distancia += TIPOS[inimigo.tipo].velocidade * inimigo.lentidao * dt;

  const posicao = posicaoNoCaminho(inimigo.distancia);
  inimigo.x = posicao.x;
  inimigo.y = posicao.y;
  inimigo.olhandoParaEsquerda = inimigo.x < anterior;

  return inimigo.distancia >= COMPRIMENTO_DO_CAMINHO;
}

export function atualizarInimigos(lista, torres, dt) {
  let chegaram = 0;

  for (let i = lista.length - 1; i >= 0; i--) {
    const inimigo = lista[i];
    const chegou = TIPOS[inimigo.tipo].voador
      ? moverVoador(inimigo, torres, dt)
      : moverNoChao(inimigo, dt);

    if (chegou) {
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
  const ordenados = lista.slice().sort((a, b) => a.y - b.y);

  for (const inimigo of ordenados) {
    const tipo = TIPOS[inimigo.tipo];
    const recurso = texturas[inimigo.tipo + (inimigo.atacando ? "Atacando" : "")];
    const espelhado = inimigo.olhandoParaEsquerda;

    const fracao = espelhado ? 1 - tipo.ancoraX : tipo.ancoraX;
    const x = inimigo.x - tipo.tamanho * fracao;
    const y = inimigo.y - tipo.tamanho * tipo.ancoraY - tipo.alturaDoVoo;

    const destino = espelhado
      ? { x: x + tipo.tamanho, y, w: -tipo.tamanho, h: tipo.tamanho }
      : { x, y, w: tipo.tamanho, h: tipo.tamanho };

    drawSprite(recurso, destino, frameRect(recurso, quadroAtual(recurso, tempo + inimigo.atraso, tipo.fps), recurso.altura));

    if (inimigo.vida < tipo.vida) {
      const largura = 44;
      const topo = inimigo.y - tipo.alturaDoVoo - tipo.tamanho * tipo.alturaDaArte - 12;
      const cheia = Math.max(0, inimigo.vida / tipo.vida);

      drawRect({ x: inimigo.x - largura / 2, y: topo, w: largura, h: 6 }, [0.1, 0.05, 0.05, 0.8]);
      drawRect({ x: inimigo.x - largura / 2 + 1, y: topo + 1, w: (largura - 2) * cheia, h: 4 }, [0.85, 0.2, 0.2, 1]);
    }
  }
}
