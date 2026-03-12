export const getImageUrl = (imagePathOrCode: string | null | undefined): string => {
  if (!imagePathOrCode) return '';
  
  // Si el usuario pegó el enlace directo de GitHub (ej. https://github.com/.../blob/main/foto.jpg)
  // lo convertimos automáticamente al formato "raw" que sí muestra la imagen.
  if (imagePathOrCode.includes('github.com') && imagePathOrCode.includes('/blob/')) {
    return imagePathOrCode.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // Si ya es una URL completa (http/https) o base64, la devolvemos tal cual
  if (imagePathOrCode.startsWith('http') || imagePathOrCode.startsWith('data:')) {
    return imagePathOrCode;
  }
  
  // Verificamos si el usuario ya escribió la extensión (.jpg, .png, etc.)
  const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(imagePathOrCode);
  
  // Si no tiene extensión, le agregamos .jpg por defecto
  const fileName = hasExtension ? imagePathOrCode : `${imagePathOrCode}.jpg`;

  // Construimos la URL cruda (raw) de GitHub
  const githubUser = "hmainspiration";
  const githubRepo = "imagenes-tienda";
  const branch = "main";

  return `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${branch}/${fileName}`;
};
