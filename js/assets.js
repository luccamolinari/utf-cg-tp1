export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error(`falha ao carregar ${url}`));
    imagem.src = url;
  });
}

export async function loadImages(mapa) {
  const nomes = Object.keys(mapa);
  const imagens = await Promise.all(nomes.map((nome) => loadImage(mapa[nome])));

  const resultado = {};
  nomes.forEach((nome, i) => {
    resultado[nome] = imagens[i];
  });
  return resultado;
}
