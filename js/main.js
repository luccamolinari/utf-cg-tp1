import { createGL } from "./renderer.js";

const canvas = document.getElementById("game-canvas");
const gl = createGL(canvas);

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.5, 0.5, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(render);
}

render();