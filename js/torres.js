import { TIPOS as INIMIGOS } from "./inimigos.js";
import { frameRect } from "./renderer.js";

export const TIPOS = {
  arqueiro: {
    nome: "Arqueiro",
    parado: "assets/sprites/torres/arqueiro/Archer_Idle.png",
    atirando: "assets/sprites/torres/arqueiro/Archer_Shoot.png",
    tamanho: 160, ancoraX: 0.479, ancoraY: 0.708, fps: 10,
    alcance: 150, cadencia: 0.8, dano: 12, custo: 50, vida: 120, antiAereo: true,
    projetil: "flecha", velocidadeDoTiro: 420,
  },
  canhao: {
    nome: "Canhão",
    direcoes: {
      cima: "assets/sprites/torres/canhao/Cannon_Up.png",
      cimaDireita: "assets/sprites/torres/canhao/Cannon_UpRight.png",
      direita: "assets/sprites/torres/canhao/Cannon_Right.png",
      baixoDireita: "assets/sprites/torres/canhao/Cannon_DownRight.png",
      baixo: "assets/sprites/torres/canhao/Cannon_Down.png",
    },
    tamanho: 128, ancoraX: 0.531, ancoraY: 0.664,
    alcance: 190, cadencia: 2, dano: 40, area: 70, custo: 120, vida: 300, antiAereo: false,
    projetil: "bala", velocidadeDoTiro: 260,
  },
  monge: {
    nome: "Monge",
    parado: "assets/sprites/torres/monge/Idle.png",
    tamanho: 160, ancoraX: 0.5, ancoraY: 0.698, fps: 8,
    alcance: 130, lentidao: 0.5, custo: 90, vida: 140, antiAereo: false,
  },
};

export const PROJETEIS = {
  flecha: { folha: "assets/sprites/torres/arqueiro/Arrow.png", tamanho: 48 },
  bala: { folha: "assets/sprites/torres/canhao/Cannon_Ball.png", tamanho: 40 },
};

export const FOLHAS = (function () {
  const mapa = {};

  for (const nome of Object.keys(TIPOS)) {
    const tipo = TIPOS[nome];
    if (tipo.parado) mapa[nome + "Parado"] = tipo.parado;
    if (tipo.atirando) mapa[nome + "Atirando"] = tipo.atirando;
    if (tipo.direcoes) {
      for (const direcao of Object.keys(tipo.direcoes)) {
        mapa[nome + "_" + direcao] = tipo.direcoes[direcao];
      }
    }
  }

  for (const nome of Object.keys(PROJETEIS)) {
    mapa["projetil_" + nome] = PROJETEIS[nome].folha;
  }

  return mapa;
})();

export function criarTorre(nomeTipo, coluna, linha) {
  return {
    tipo: nomeTipo,
    coluna,
    linha,
    x: coluna * 64 + 32,
    y: linha * 64 + 32,
    vida: TIPOS[nomeTipo].vida,
    recarga: 0,
    tempoDeTiro: 0,
    alvoX: 1,
    alvoY: 0,
  };
}

export function torreEm(torres, coluna, linha) {
  return torres.some((torre) => torre.coluna === coluna && torre.linha === linha);
}

function alvoDaTorre(torre, tipo, inimigos) {
  let melhor = null;

  for (const inimigo of inimigos) {
    const voador = INIMIGOS[inimigo.tipo].voador;

    if (voador && !tipo.antiAereo) {
      continue;
    }

    const dx = inimigo.x - torre.x;
    const dy = inimigo.y - torre.y;

    if (dx * dx + dy * dy > tipo.alcance * tipo.alcance) {
      continue;
    }

    if (!melhor) {
      melhor = inimigo;
      continue;
    }

    const melhorVoador = INIMIGOS[melhor.tipo].voador;

    if (voador && !melhorVoador) {
      melhor = inimigo;
    } else if (voador === melhorVoador && inimigo.distancia > melhor.distancia) {
      melhor = inimigo;
    }
  }

  return melhor;
}

export function atualizarTorres(torres, inimigos, projeteis, dt) {
  for (const inimigo of inimigos) {
    inimigo.lentidao = 1;
  }

  for (const torre of torres) {
    const tipo = TIPOS[torre.tipo];

    if (tipo.lentidao) {
      for (const inimigo of inimigos) {
        const dx = inimigo.x - torre.x;
        const dy = inimigo.y - torre.y;

        if (dx * dx + dy * dy <= tipo.alcance * tipo.alcance) {
          inimigo.lentidao = Math.min(inimigo.lentidao, tipo.lentidao);
        }
      }
      continue;
    }

    torre.recarga -= dt;
    torre.tempoDeTiro = Math.max(0, torre.tempoDeTiro - dt);

    const alvo = alvoDaTorre(torre, tipo, inimigos);
    if (!alvo) {
      continue;
    }

    torre.alvoX = alvo.x - torre.x;
    torre.alvoY = alvo.y - torre.y;

    if (torre.recarga <= 0) {
      torre.recarga = tipo.cadencia;
      torre.tempoDeTiro = 0.35;

      projeteis.push({
        tipo: tipo.projetil,
        x: torre.x,
        y: torre.y - 18,
        alvo: alvo,
        dano: tipo.dano,
        area: tipo.area || 0,
        velocidade: tipo.velocidadeDoTiro,
        angulo: 0,
      });
    }
  }
}

export function atualizarProjeteis(projeteis, inimigos, dt) {
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const projetil = projeteis[i];

    if (projetil.alvo.vida <= 0 || !inimigos.includes(projetil.alvo)) {
      projeteis.splice(i, 1);
      continue;
    }

    const destino = projetil.alvo;
    const dx = destino.x - projetil.x;
    const dy = destino.y - projetil.y - 24;
    const distancia = Math.hypot(dx, dy);

    projetil.angulo = Math.atan2(dy, dx);

    const passo = projetil.velocidade * dt;

    if (distancia <= passo) {
      aplicarDano(projetil, destino, inimigos);
      projeteis.splice(i, 1);
      continue;
    }

    projetil.x += (dx / distancia) * passo;
    projetil.y += (dy / distancia) * passo;
  }
}

function aplicarDano(projetil, destino, inimigos) {
  if (!projetil.area) {
    projetil.alvo.vida -= projetil.dano;
    return;
  }

  for (const inimigo of inimigos) {
    const dx = inimigo.x - destino.x;
    const dy = inimigo.y - destino.y;

    if (dx * dx + dy * dy <= projetil.area * projetil.area) {
      inimigo.vida -= projetil.dano;
    }
  }
}

function direcaoDoCanhao(dx, dy) {
  const graus = (Math.atan2(-dy, Math.abs(dx)) * 180) / Math.PI;

  if (graus > 67) return "cima";
  if (graus > 22) return "cimaDireita";
  if (graus > -22) return "direita";
  if (graus > -67) return "baixoDireita";
  return "baixo";
}

export function removerTorresDestruidas(torres) {
  for (let i = torres.length - 1; i >= 0; i--) {
    if (torres[i].vida <= 0) {
      torres.splice(i, 1);
    }
  }
}

export function desenharTorres(drawSprite, drawRect, texturas, torres, tempo) {
  for (const torre of torres) {
    const tipo = TIPOS[torre.tipo];
    const espelhado = torre.alvoX < 0;

    let recurso;
    let recorte;

    if (tipo.direcoes) {
      recurso = texturas[torre.tipo + "_" + direcaoDoCanhao(torre.alvoX, torre.alvoY)];
      recorte = [0, 0, 1, 1];
    } else {
      const atirando = torre.tempoDeTiro > 0 && tipo.atirando;
      recurso = texturas[torre.tipo + (atirando ? "Atirando" : "Parado")];
      const quadros = Math.floor(recurso.largura / recurso.altura);
      recorte = frameRect(recurso, Math.floor(tempo * tipo.fps) % quadros, recurso.altura);
    }

    const fracao = espelhado ? 1 - tipo.ancoraX : tipo.ancoraX;
    const x = torre.x - tipo.tamanho * fracao;
    const y = torre.y + 14 - tipo.tamanho * tipo.ancoraY;

    drawSprite(
      recurso,
      espelhado
        ? { x: x + tipo.tamanho, y, w: -tipo.tamanho, h: tipo.tamanho }
        : { x, y, w: tipo.tamanho, h: tipo.tamanho },
      recorte
    );

    if (torre.vida < tipo.vida) {
      const largura = 44;
      const topo = torre.y - 44;
      const cheia = Math.max(0, torre.vida / tipo.vida);

      drawRect({ x: torre.x - largura / 2, y: topo, w: largura, h: 6 }, [0.1, 0.05, 0.05, 0.8]);
      drawRect({ x: torre.x - largura / 2 + 1, y: topo + 1, w: (largura - 2) * cheia, h: 4 }, [0.3, 0.7, 1, 1]);
    }
  }
}

export function desenharProjeteis(drawSprite, texturas, projeteis) {
  for (const projetil of projeteis) {
    const dados = PROJETEIS[projetil.tipo];
    const recurso = texturas["projetil_" + projetil.tipo];
    const metade = dados.tamanho / 2;
    const paraEsquerda = Math.abs(projetil.angulo) > Math.PI / 2;

    drawSprite(
      recurso,
      paraEsquerda
        ? { x: projetil.x + metade, y: projetil.y - metade, w: -dados.tamanho, h: dados.tamanho }
        : { x: projetil.x - metade, y: projetil.y - metade, w: dados.tamanho, h: dados.tamanho },
      [0, 0, 1, 1]
    );
  }
}
