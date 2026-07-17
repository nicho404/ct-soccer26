// Ridimensiona un file immagine e lo restituisce come data URL,
// pronto da salvare in IndexedDB senza gonfiare il database.
export function resizeToDataUrl(file, maxSize = 256, mime = 'image/jpeg', quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL(mime, quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Immagine non leggibile'))
    }
    img.src = url
  })
}
