const LIMITE = 300;

const particulas = [];

function nova(x, y, vx, vy, gravidade, tamanho, escalaFinal, cor, vida) {
  particulas.push({ x, y, vx, vy, gravidade, tamanho, escalaFinal, cor, vida, duracao: vida });
}

export function explosao(x, y) {
  if (particulas.length > LIMITE) {
    return;
  }

  const cores = [[1, 0.81, 0.34], [1, 0.47, 0.11], [0.77, 0.21, 0.09]];

  for (let i = 0; i < 23; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const forca = 55 + Math.random() * 185;

    nova(
      x, y,
      Math.cos(angulo) * forca,
      Math.sin(angulo) * forca - 40,
      165,
      3 + Math.random() * 4,
      0.25,
      cores[i % 3],
      0.28 + Math.random() * 0.34
    );
  }
}

export function faisca(x, y) {
  if (particulas.length > LIMITE) {
    return;
  }

  for (let i = 0; i < 11; i++) {
    const angulo = -Math.PI * (0.12 + Math.random() * 0.76);
    const forca = 130 + Math.random() * 170;

    nova(
      x, y,
      Math.cos(angulo) * forca,
      Math.sin(angulo) * forca,
      330,
      2 + Math.random() * 2,
      0.2,
      Math.random() < 0.7 ? [1, 0.98, 0.82] : [0.88, 0.9, 0.95],
      0.17 + Math.random() * 0.21
    );
  }
}

export function poeira(x, y) {
  if (particulas.length > LIMITE) {
    return;
  }

  const cores = [[0.76, 0.63, 0.44], [0.64, 0.53, 0.37], [0.83, 0.75, 0.59], [0.55, 0.46, 0.33]];

  for (let i = 0; i < 17; i++) {
    const paraDireita = Math.random() < 0.5;
    const angulo = (paraDireita ? 0 : Math.PI) + (Math.random() - 0.5) * 1.1;
    const forca = 22 + Math.random() * 66;

    nova(
      x, y,
      Math.cos(angulo) * forca,
      Math.sin(angulo) * forca * 0.45 - 18,
      34,
      3 + Math.random() * 5,
      1.35,
      cores[Math.floor(Math.random() * 4)],
      0.36 + Math.random() * 0.41
    );
  }
}

export function fumaca(x, y) {
  if (particulas.length > LIMITE) {
    return;
  }

  for (let i = 0; i < 9; i++) {
    const tom = 0.42 + Math.random() * 0.33;

    nova(
      x + (Math.random() - 0.5) * 18,
      y,
      (Math.random() - 0.5) * 34,
      -18 - Math.random() * 38,
      -14,
      4 + Math.random() * 4,
      2.1,
      [tom, tom, tom * 0.97],
      0.44 + Math.random() * 0.4
    );
  }
}

export function atualizarParticulas(dt) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];

    p.vida -= dt;

    if (p.vida <= 0) {
      particulas.splice(i, 1);
      continue;
    }

    p.vy += p.gravidade * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function desenharParticulas(drawRect) {
  for (const p of particulas) {
    const restante = p.vida / p.duracao;
    const lado = p.tamanho * (p.escalaFinal + (1 - p.escalaFinal) * restante);

    drawRect(
      { x: p.x - lado / 2, y: p.y - lado / 2, w: lado, h: lado },
      [p.cor[0], p.cor[1], p.cor[2], restante]
    );
  }
}
