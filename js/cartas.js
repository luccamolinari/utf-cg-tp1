import { TIPOS as TORRES } from "./torres.js";
import { TIPOS as INIMIGOS } from "./inimigos.js";
import { ORDAS } from "./ondas.js";

const RETRATOS = {
  gnoll: "assets/sprites/inimigos/gnoll/Gnoll_Avatar.png",
  morcego: "assets/sprites/inimigos/giant-bat/Giant Bat_Avatar.png",
  minotauro: "assets/sprites/inimigos/minotaur/Minotaur__Avatar.png",
  lanceiro: "assets/sprites/inimigos/spear-goblin/Spear Goblin_Avatar.png",
  tocha: "assets/sprites/inimigos/torch-goblin/Torch Goblin_Avatar.png",
  tartaruga: "assets/sprites/inimigos/turtle/Turtle_Avatar.png",
};

export const BARALHO = [
  {
    nome: "Olho de Falcão", texto: "Arqueiros enxergam 25% mais longe", retrato: RETRATOS.morcego,
    efeito: () => { TORRES.arqueiro.alcance = Math.round(TORRES.arqueiro.alcance * 1.25); },
  },
  {
    nome: "Flecha Pesada", texto: "Arqueiros causam +5 de dano", retrato: RETRATOS.lanceiro,
    efeito: () => { TORRES.arqueiro.dano += 5; },
  },
  {
    nome: "Corda Nova", texto: "Arqueiros atiram 20% mais rápido", retrato: RETRATOS.lanceiro,
    efeito: () => { TORRES.arqueiro.cadencia = +(TORRES.arqueiro.cadencia * 0.8).toFixed(2); },
  },
  {
    nome: "Pólvora Seca", texto: "Canhões causam +15 de dano", retrato: RETRATOS.minotauro,
    efeito: () => { TORRES.canhao.dano += 15; },
  },
  {
    nome: "Estilhaço", texto: "Explosão do canhão 30% maior", retrato: RETRATOS.minotauro,
    efeito: () => { TORRES.canhao.area = Math.round(TORRES.canhao.area * 1.3); },
  },
  {
    nome: "Vigia da Torre", texto: "Canhões alcançam 20% mais longe", retrato: RETRATOS.tocha,
    efeito: () => { TORRES.canhao.alcance = Math.round(TORRES.canhao.alcance * 1.2); },
  },
  {
    nome: "Jejum Forçado", texto: "Aura do monge atrasa ainda mais", retrato: RETRATOS.tartaruga,
    efeito: () => { TORRES.monge.lentidao = Math.max(0.2, +(TORRES.monge.lentidao - 0.1).toFixed(2)); },
  },
  {
    nome: "Aço Temperado", texto: "Torres aguentam 40% mais dano", retrato: RETRATOS.tartaruga,
    efeito: (partida, torres) => {
      for (const nome of Object.keys(TORRES)) {
        const antes = TORRES[nome].vida;
        TORRES[nome].vida = Math.round(antes * 1.4);
        for (const torre of torres) {
          if (torre.tipo === nome) {
            torre.vida += TORRES[nome].vida - antes;
          }
        }
      }
    },
  },
  {
    nome: "Pedágio", texto: "Cada inimigo morto rende +3 de ouro", retrato: RETRATOS.gnoll,
    efeito: () => { for (const nome of Object.keys(INIMIGOS)) INIMIGOS[nome].ouro += 3; },
  },
  {
    nome: "Cofre Cheio", texto: "Bônus de fim de orda +40", retrato: RETRATOS.gnoll,
    efeito: () => { for (const onda of ORDAS) onda.bonus += 40; },
  },
  {
    nome: "Ferraria", texto: "Todas as torres custam 15% menos", retrato: RETRATOS.tocha,
    efeito: () => { for (const nome of Object.keys(TORRES)) TORRES[nome].custo = Math.round(TORRES[nome].custo * 0.85); },
  },
  {
    nome: "Muralha Reforçada", texto: "Ganha 3 vidas", retrato: RETRATOS.morcego,
    efeito: (partida) => { partida.vidas += 3; },
  },
];

export function sortearCartas(quantas) {
  const restantes = BARALHO.slice();
  const escolhidas = [];

  while (escolhidas.length < quantas && restantes.length > 0) {
    escolhidas.push(restantes.splice(Math.floor(Math.random() * restantes.length), 1)[0]);
  }

  return escolhidas;
}

export function aplicarCarta(carta, partida, torres) {
  carta.efeito(partida, torres);
}
