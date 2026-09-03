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