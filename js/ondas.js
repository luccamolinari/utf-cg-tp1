import { criarInimigo } from "./inimigos.js";

export const VIDAS_INICIAIS = 20;
export const OURO_INICIAL = 260;
export const PAUSA_ENTRE_ORDAS = 12;

export const ORDAS = [
  { grupos: [["spearGoblin", 8, 1]], bonus: 20 },
  { grupos: [["spearGoblin", 8, 0.8], ["torchGoblin", 2, 3]], bonus: 25 },
  { grupos: [["torchGoblin", 6, 1], ["giantBat", 6, 1.6]], bonus: 30 },
  { grupos: [["spearGoblin", 12, 0.6], ["gnoll", 3, 4], ["torchGoblin", 1, 5]], bonus: 38 },
  { grupos: [["gnoll", 8, 1.2], ["turtle", 1, 1]], bonus: 45 },
  { grupos: [["giantBat", 10, 0.7], ["torchGoblin", 8, 1.4], ["gnoll", 5, 2.2]], bonus: 55 },
  { grupos: [["turtle", 3, 6], ["gnoll", 10, 1], ["torchGoblin", 1, 4]], bonus: 68 },
  { grupos: [["spearGoblin", 20, 0.4], ["giantBat", 10, 0.9], ["gnoll", 5, 2], ["turtle", 3, 6]], bonus: 82 },
  { grupos: [["turtle", 5, 5], ["gnoll", 12, 0.9], ["torchGoblin", 8, 1.4]], bonus: 100 },
  { grupos: [["minotaur", 1, 1], ["gnoll", 12, 1], ["turtle", 6, 4], ["torchGoblin", 10, 1.2]], bonus: 175 },
];

export function pularEspera(partida) {
  if (partida.estado === "preparando") {
    partida.tempo = 0;
  }
}

export function retomarDepoisDaCarta(partida) {
  partida.estado = "preparando";
  partida.tempo = PAUSA_ENTRE_ORDAS;
}

export function criarPartida() {
  return {
    onda: 0,
    estado: "preparando",
    tempo: PAUSA_ENTRE_ORDAS,
    fila: [],
    vidas: VIDAS_INICIAIS,
    ouro: OURO_INICIAL,
    resultado: null,
  };
}

function montarFila(onda) {
  const fila = [];

  for (const [tipo, quantidade, intervalo] of onda.grupos) {
    for (let i = 0; i < quantidade; i++) {
      fila.push({ tipo, tempo: i * intervalo });
    }
  }

  return fila.sort((a, b) => a.tempo - b.tempo);
}

export function inimigosDaOnda(numero) {
  return ORDAS[numero - 1].grupos.reduce((total, grupo) => total + grupo[1], 0);
}

export function atualizarPartida(partida, inimigos, chegaram, dt) {
  if (partida.resultado || partida.estado === "cartas") {
    return;
  }

  if (chegaram > 0) {
    partida.vidas -= chegaram;

    if (partida.vidas <= 0) {
      partida.vidas = 0;
      partida.resultado = "derrota";
      return;
    }
  }

  if (partida.estado === "preparando") {
    partida.tempo -= dt;

    if (partida.tempo <= 0) {
      partida.onda++;
      partida.fila = montarFila(ORDAS[partida.onda - 1]);
      partida.tempo = 0;
      partida.estado = "emOrda";
    }

    return;
  }

  partida.tempo += dt;

  while (partida.fila.length > 0 && partida.fila[0].tempo <= partida.tempo) {
    inimigos.push(criarInimigo(partida.fila.shift().tipo));
  }

  if (partida.fila.length === 0 && inimigos.length === 0) {
    partida.ouro += ORDAS[partida.onda - 1].bonus;

    if (partida.onda >= ORDAS.length) {
      partida.resultado = "vitoria";
      return;
    }

    partida.estado = "cartas";
  }
}
