export function createGL(canvas) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 não suportado neste navegador");
  }
  return gl;
}

export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const mensagemErroShader = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`erro ao compilar shader: ${mensagemErroShader}`);

    }
    return shader;
}

export function createProgram(gl, vsSource, fsSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const mensagemErroProgram = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        
        throw new Error(`erro linkando programa: ${mensagemErroProgram}`);
    }
    return program;
}
export function createQuadVAO(gl) {
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
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    return vao;
}

export function createTexture(gl, imagem) {
    const textura = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagem);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return { textura, largura: imagem.width, altura: imagem.height };
}

export function frameRect(recurso, indice, lado) {
    const porLinha = Math.floor(recurso.largura / lado);
    const coluna = indice % porLinha;
    const linha = Math.floor(indice / porLinha);

    return [
        (coluna * lado) / recurso.largura,
        (linha * lado) / recurso.altura,
        lado / recurso.largura,
        lado / recurso.altura,
    ];
}

const SPRITE_VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform vec2 uScale;
uniform vec4 uRecorte;
out vec2 vTexCoord;

void main() {
  vec2 pos = aPosition * uScale + uOffset;
  vec2 clipSpace = (pos / uResolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  vTexCoord = uRecorte.xy + aPosition * uRecorte.zw;
}
`;

const SPRITE_FRAG = `#version 300 es
precision mediump float;
uniform sampler2D uTextura;
in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  fragColor = texture(uTextura, vTexCoord);
}
`;

export function createSpriteRenderer(gl, largura, altura) {
    const program = createProgram(gl, SPRITE_VERT, SPRITE_FRAG);
    const vao = createQuadVAO(gl);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uOffset = gl.getUniformLocation(program, "uOffset");
    const uScale = gl.getUniformLocation(program, "uScale");
    const uRecorte = gl.getUniformLocation(program, "uRecorte");
    const uTextura = gl.getUniformLocation(program, "uTextura");

    return function drawSprite(recurso, destino, recorte = [0, 0, 1, 1]) {
        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, recurso.textura);
        gl.uniform1i(uTextura, 0);

        gl.uniform2f(uResolution, largura, altura);
        gl.uniform2f(uOffset, destino.x, destino.y);
        gl.uniform2f(uScale, destino.w, destino.h);
        gl.uniform4f(uRecorte, recorte[0], recorte[1], recorte[2], recorte[3]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
}
