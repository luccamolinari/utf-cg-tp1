import { createGL, createProgram } from "./renderer.js";

const VERT_SRC = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform vec2 uScale;

void main() {
  vec2 pos = aPosition * uScale + uOffset;
  vec2 clipSpace = (pos / uResolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const FRAG_SRC = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;

const canvas = document.getElementById("game-canvas");
const gl = createGL(canvas);
const program = createProgram(gl, VERT_SRC, FRAG_SRC);

const quadrado = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,
]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const buffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, quadrado, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0) // (qual atributo, quantos numeros por vertice, tipo)

const uResolution = gl.getUniformLocation(program, "uResolution");
const uOffset = gl.getUniformLocation(program, "uOffset");
const uScale = gl.getUniformLocation(program, "uScale");
const uColor = gl.getUniformLocation(program, "uColor");

const torre = {
  x: canvas.width / 2 - 25,
  y: canvas.height / 2 - 40,
  w: 50,
  h: 80,
};

const inimigo = {
  x: -30,
  y: canvas.height / 2 - 15,
  w: 30,
  h: 30,
  speed: 80,
};

function centro(rect) {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2
  }
}

function moverInimigoParaTorre(inimigo, torre, dt) {
  const alvo = centro(torre);
  const atual = centro(inimigo);

  const dx = alvo.x - atual.x;
  const dy = alvo.y - atual.y;
  const distancia = Math.sqrt(dx * dx + dy * dy);

  if (distancia < 1) return;

  const dirX = dx / distancia;
  const dirY = dy / distancia;

  inimigo.x += dirX * inimigo.speed * dt;
  inimigo.y += dirY * inimigo.speed * dt;
}
function drawRect(rect, color) {
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform2f(uResolution, canvas.width, canvas.height);
  gl.uniform2f(uOffset, rect.x, rect.y);
  gl.uniform2f(uScale, rect.w, rect.h);
  gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function render() {
  let ultimoTempo = 0;

function render(tempoAtual) {
  const dt = (tempoAtual - ultimoTempo) / 1000;
  ultimoTempo = tempoAtual;

  moverInimigoParaTorre(inimigo, torre, dt);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.5, 0.5, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawRect(torre, [0.6, 0.4, 0.2, 1]);
  drawRect(inimigo, [0.8, 0.1, 0.1, 1]);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
}

render();