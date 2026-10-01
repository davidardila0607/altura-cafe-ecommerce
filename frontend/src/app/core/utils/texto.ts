/** Normaliza texto para búsquedas y claves: minúsculas y sin tildes ("Nariño" → "narino"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** "1 café" / "3 cafés". */
export function contarCafes(cantidad: number): string {
  return cantidad === 1 ? '1 café' : `${cantidad} cafés`;
}
