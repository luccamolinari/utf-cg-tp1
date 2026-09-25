const EFEITOS = {
  construirArqueiro: "assets/audio/new-archer.mp3",
  construirCanhao: "assets/audio/new-cannon.mp3",
  arqueiroAtira: "assets/audio/arrow-sweesh.mp3",
  canhaoAtira: "assets/audio/cannon-shot.mp3",
  flechaAcerta: "assets/audio/arrow-impact.mp3",
  flechaRefletida: "assets/audio/arrow-deflected.mp3",
  monge: "assets/audio/monk-healing.mp3",
  vergonha: "assets/audio/fart-sound.mp3",
  morteGoblin: "assets/audio/yellow-goblin-dead.mp3",
  morteMorcego: "assets/audio/bat-dead.mp3",
  morteTartaruga: "assets/audio/turtle-dead.mp3",
  morteMinotauro: "assets/audio/touro-dead.mp3",
  torreDestruida: "assets/audio/cannon-dead.mp3",
  perdeuVida: "assets/audio/losing-life.mp3",
  comecouOrda: "assets/audio/start-round.mp3",
  cartasNaTela: "assets/audio/card-selection.mp3",
  cartaEscolhida: "assets/audio/card-choosed.mp3",
};

const AMBIENTES = {
  tropas: "assets/audio/running-troupes.mp3",
  morcegos: "assets/audio/bat-flying.mp3",
  tartarugas: "assets/audio/turtle-walking.mp3",
  minotauro: "assets/audio/minotaur-walking.mp3",
};

const FINAIS = {
  vitoria: "assets/audio/win-music.mp3",
  derrota: "assets/audio/lose-music.mp3",
};

const VOZES_POR_EFEITO = 4;
const INTERVALO_MINIMO = 90;
const VOLUME_DOS_EFEITOS = 0.6;
const VOLUME_DO_AMBIENTE = 0.18;
const VOLUME_DA_MUSICA = 0.35;

const vozes = {};
const ambientes = {};

let musica = null;
let final = null;
let volume = 0.7;

function aplicarVolume() {
  for (const nome of Object.keys(vozes)) {
    for (const som of vozes[nome].lista) {
      som.volume = volume * VOLUME_DOS_EFEITOS;
    }
  }

  for (const nome of Object.keys(ambientes)) {
    ambientes[nome].volume = volume * VOLUME_DO_AMBIENTE;
  }

  if (musica) {
    musica.volume = volume * VOLUME_DA_MUSICA;
  }

  if (final) {
    final.volume = volume * VOLUME_DA_MUSICA;
  }
}

export function prepararSons() {
  for (const nome of Object.keys(EFEITOS)) {
    const lista = [];

    for (let i = 0; i < VOZES_POR_EFEITO; i++) {
      lista.push(new Audio(EFEITOS[nome]));
    }

    vozes[nome] = { lista, proxima: 0, ultimo: 0 };
  }

  for (const nome of Object.keys(AMBIENTES)) {
    const som = new Audio(AMBIENTES[nome]);
    som.loop = true;
    ambientes[nome] = som;
  }

  musica = new Audio("assets/audio/musica.wav");
  musica.loop = true;
  musica.preload = "none";

  aplicarVolume();
}

export function definirVolume(novo) {
  volume = novo;
  aplicarVolume();
}

export function tocar(nome) {
  const grupo = vozes[nome];

  if (!grupo) {
    return;
  }

  const agora = performance.now();

  if (agora - grupo.ultimo < INTERVALO_MINIMO) {
    return;
  }

  grupo.ultimo = agora;

  const som = grupo.lista[grupo.proxima];
  grupo.proxima = (grupo.proxima + 1) % grupo.lista.length;

  som.currentTime = 0;
  som.play().catch(function () {});
}

export function ambiente(nome, ativo) {
  const som = ambientes[nome];

  if (!som) {
    return;
  }

  if (ativo && som.paused) {
    som.play().catch(function () {});
  }

  if (!ativo && !som.paused) {
    som.pause();
  }
}

export function tocarMusica() {
  if (musica && musica.paused) {
    musica.play().catch(function () {});
  }
}

export function tocarFinal(resultado) {
  if (musica) {
    musica.pause();
  }

  for (const nome of Object.keys(ambientes)) {
    ambientes[nome].pause();
  }

  final = new Audio(FINAIS[resultado]);
  aplicarVolume();
  final.play().catch(function () {});
}
