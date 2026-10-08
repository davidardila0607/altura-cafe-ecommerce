import { expect, Page, test as base } from '@playwright/test';

export const API = 'http://localhost:5031/api';

/** Normaliza espacios (incluido el espacio no separable del formato de moneda). */
export const limpiar = (texto: string | null): string => (texto ?? '').replace(/\s+/g, ' ').trim();

/**
 * `test` con la consola del navegador vigilada: cualquier error de consola o excepción
 * de la página hace fallar la prueba. Las pruebas que provocan errores de red a propósito
 * usan `permitirErroresDeRed`.
 */
export const test = base.extend<{ consola: string[]; permitirErroresDeRed: boolean }>({
  permitirErroresDeRed: [false, { option: true }],
  consola: [
    async ({ page, permitirErroresDeRed }, use) => {
      const errores: string[] = [];
      page.on('console', (mensaje) => {
        if (mensaje.type() !== 'error') return;
        const esDeRed = /Failed to load resource|ERR_CONNECTION_REFUSED|ERR_FAILED|Http failure/i.test(mensaje.text());
        if (permitirErroresDeRed && esDeRed) return;
        errores.push(mensaje.text());
      });
      page.on('pageerror', (error) => errores.push(`Excepción: ${error.message}`));

      await use(errores);

      expect(errores, 'La consola del navegador debe quedar sin errores').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Desplaza cada card a la vista (las imágenes usan loading="lazy") y espera a que carguen. */
export async function cargarImagenesDeCards(page: Page): Promise<void> {
  const imagenes = page.locator('app-tarjeta-cafe img');
  const total = await imagenes.count();
  for (let i = 0; i < total; i++) {
    const imagen = imagenes.nth(i);
    await imagen.scrollIntoViewIfNeeded();
    await expect
      .poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
        message: `La imagen ${i + 1} debe cargarse`,
      })
      .toBe(true);
  }
}

/** Llena el formulario "Datos de envío" del carrito (guía de pedidos, adaptación de envío). */
export async function llenarEnvio(page: Page): Promise<void> {
  const formulario = page.getByRole('dialog', { name: 'Datos de envío' });
  await formulario.getByLabel('Dirección').fill('Calle 45 # 12-30, apto 402');
  await formulario.getByLabel('Ciudad o municipio').fill('Bucaramanga');
  await formulario.getByLabel('Departamento').selectOption('Santander');
  await formulario.getByLabel('Teléfono de contacto').fill('300 123 4567');
  await formulario.getByLabel(/Notas para la entrega/).fill('Dejar en portería');
}

/** Registra cada petición a la API hecha por la página. */
export function vigilarPeticionesApi(page: Page): string[] {
  const peticiones: string[] = [];
  page.on('request', (peticion) => {
    if (peticion.url().startsWith('http://localhost:5031')) {
      peticiones.push(`${peticion.method()} ${peticion.url()}`);
    }
  });
  return peticiones;
}

/**
 * Espera a que terminen las animaciones con fin (entradas y fundidos) antes de medir con axe:
 * a mitad de un fundido los colores aún no son los finales y el contraste sale bajo.
 * Las animaciones infinitas (niebla a la deriva, cinta) se ignoran.
 */
export async function esperarAnimaciones(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}
