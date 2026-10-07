import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { renameSync, rmSync } from 'node:fs';
import { API, cargarImagenesDeCards, expect, limpiar, test, vigilarPeticionesApi } from './fixtures';

const BASE = 'http://localhost:4200';

const tarjetas = (page: Page) => page.locator('app-tarjeta-cafe');
const nombresDeTarjetas = (page: Page) => tarjetas(page).locator('.nombre').allTextContents();
const lateral = (page: Page) => page.getByRole('complementary', { name: 'Filtros del catálogo' });
const resumen = (page: Page) => page.getByTestId('resumen');
const altimetro = (page: Page) => page.locator('app-altimetro');

async function esperarCatalogo(page: Page, cantidad: number): Promise<void> {
  await expect(page.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(cantidad);
}

/** Espera a que termine el vuelo de la bolsa (durante una View Transition no se reciben clics). */
async function esperarFinDelVuelo(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.documentElement.classList.contains('transicion-vuelo'));
}

/** Recorre la página hasta el final (dispara revelados, ScrollTrigger e imágenes diferidas). */
async function recorrer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
}

test.describe('Inicio', () => {
  test('es la primera vista y muestra 3 destacados de la API con imágenes de Cloudinary', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Altura | Café de especialidad');
    await expect(page.getByRole('heading', { level: 1, name: 'Altura, café de especialidad colombiano' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorar cafés' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver el proceso' })).toBeVisible();

    const destacados = page.getByTestId('destacados').locator('app-tarjeta-cafe');
    await expect(destacados).toHaveCount(3);

    // Con stock primero y por precio descendente.
    await expect(destacados.locator('.nombre')).toHaveText(['Inzá Reserva', 'Rosa del Huila', 'San Agustín']);

    for (const imagen of await destacados.locator('img').all()) {
      await imagen.scrollIntoViewIfNeeded();
      expect(await imagen.getAttribute('src')).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/upload\/c_crop,g_center,w_0\.86,h_0\.86\/f_auto,q_auto,w_600\//);
      await expect.poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }

    // Card completa: variedad, proceso, precio en COP, disponibilidad y "Ver producto".
    const primera = destacados.first();
    await expect(primera.locator('app-etiqueta-cafe')).toHaveText([/Geisha/, /Fermentado/]);
    await expect(primera.locator('.precio')).toHaveText(/\$\s132\.000/);
    await expect(primera.locator('.disponibilidad')).toHaveText('Quedan 5');
    await expect(primera.getByRole('button', { name: /Ver producto/ })).toBeVisible();
  });

  test('"Ver el proceso" lleva al proceso y la página tiene todas sus etapas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ver el proceso' }).click();
    await expect(page.locator('#proceso')).toBeFocused();
    await expect(page.locator('#proceso')).toBeInViewport();

    for (const titulo of ['Selección de la casa', 'De la montaña a tu taza', 'Orígenes', 'Las variedades de la casa', 'Llegaste a la cumbre.']) {
      await expect(page.getByRole('heading', { level: 2, name: titulo })).toBeAttached();
    }
    // Los cuatro pasos del proceso.
    await expect(page.locator('app-proceso .nombre-paso')).toHaveText(['Origen', 'Cosecha', 'Tueste', 'Taza']);
    // Las 9 variedades desde la API, cada una con enlace al catálogo filtrado.
    const variedades = page.locator('app-variedades');
    await expect(variedades.getByRole('link', { name: /^Ver cafés / })).toHaveCount(9);
    await variedades.getByRole('link', { name: 'Ver cafés Bourbon Rosado' }).click();
    await expect(page).toHaveURL(/\/productos\?variedad=bourbon%20rosado$/);
    await esperarCatalogo(page, 2);
  });

  test('la cinta de notas usa los orígenes de la API y el pie muestra el año', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-cinta-notas .palabra').first()).toBeAttached();
    await expect(page.locator('app-cinta-notas')).toContainText('Nariño');
    await expect(page.getByRole('contentinfo')).toContainText(String(new Date().getFullYear()));
  });

  test('el altímetro sube del valle a la cumbre con el scroll', async ({ page }) => {
    await page.goto('/');
    await expect(altimetro(page).locator('.numero')).toHaveText('1.200');
    await expect(altimetro(page).locator('.etapa')).toHaveText('Valle');

    // La etapa depende de la sección que ocupa la pantalla: se alinea Orígenes arriba.
    await page.getByRole('heading', { level: 2, name: 'Orígenes' }).evaluate((titulo) => titulo.scrollIntoView({ block: 'start' }));
    await expect(altimetro(page).locator('.etapa')).toHaveText('Cordillera');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(altimetro(page).locator('.numero')).toHaveText('2.100');
    await expect(altimetro(page).locator('.etapa')).toHaveText('Cumbre');
  });

  test('el mapa de orígenes muestra los cafés de la región y lleva al catálogo filtrado', async ({ page }) => {
    await page.goto('/');
    // Cinco orígenes con cafés: Santander, Huila, Nariño, Magdalena y Cauca.
    await expect(page.locator('app-origenes').getByRole('button', { name: /: \d+ cafés?$/ })).toHaveCount(5);
    const marcador = page.getByRole('button', { name: 'Nariño: 5 cafés' });
    await marcador.scrollIntoViewIfNeeded();
    await marcador.click();

    await expect(marcador).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 3, name: 'Nariño' })).toBeVisible();
    await expect(page.locator('app-origenes .lista')).toContainText('Volcán Galeras');
    await expect(page.locator('app-origenes .lista')).toContainText('Buesaco');

    // Con el teclado: con el mouse, el camino hasta el botón puede pasar sobre el marcador de
    // Cauca, que se activa al pasar por encima (ver "Problemas conocidos" en CLAUDE.md).
    await page.getByRole('link', { name: 'Ver cafés de Nariño' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/productos\?origen=narino$/);
    await esperarCatalogo(page, 5);
    for (const origen of await tarjetas(page).locator('.origen').allTextContents()) {
      expect(origen).toContain('Nariño');
    }
    await expect(lateral(page).getByRole('button', { name: 'Nariño' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('el proceso se ancla y la pista avanza en horizontal con el scroll @movimiento', async ({ page }) => {
    await page.goto('/');
    const seccion = page.locator('#proceso');
    await expect(seccion).toHaveClass(/anclado/);

    const posicion = () => page.locator('app-proceso .pista').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    await seccion.scrollIntoViewIfNeeded();
    const inicio = await posicion();
    await page.mouse.wheel(0, 1600);
    await expect.poll(posicion).toBeLessThan(inicio - 200);
  });

  test('con movimiento reducido el proceso es una fila con scroll y no hay parallax @reducido', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#proceso')).not.toHaveClass(/anclado/);
    const pista = page.locator('app-proceso .pista');
    await expect(pista).toHaveCSS('overflow-x', 'auto');

    // La palabra del hero no se mueve al bajar.
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    await expect(page.locator('app-hero .palabra')).toHaveCSS('transform', 'none');
  });
});

test.describe('Navegación', () => {
  test('Inicio ↔ Productos con estado activo y título de pestaña', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });

    await expect(nav.getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', { name: 'Productos', exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/productos`);
    await expect(page).toHaveTitle('Nuestros cafés | Altura');
    await expect(nav.getByRole('link', { name: 'Productos', exact: true })).toHaveAttribute('aria-current', 'page');
    await esperarCatalogo(page, 25);

    await nav.getByRole('link', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Altura, café de especialidad colombiano');

    await page.getByRole('link', { name: 'Explorar cafés' }).first().click();
    await expect(page).toHaveURL(`${BASE}/productos`);
  });

  test('usuario → login → registro → login, y el logo vuelve al Inicio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Iniciar sesión' }).first().click();
    await expect(page).toHaveURL(`${BASE}/login`);
    await expect(page).toHaveTitle('Iniciar sesión | Altura');

    await page.getByRole('link', { name: 'Regístrate' }).click();
    await expect(page).toHaveURL(`${BASE}/registro`);
    await expect(page).toHaveTitle('Crear cuenta | Altura');

    await page.getByRole('link', { name: 'Inicia sesión' }).click();
    await expect(page).toHaveURL(`${BASE}/login`);

    await page.getByRole('link', { name: 'Altura, ir al inicio' }).click();
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test('el navbar se vuelve sólido al bajar', async ({ page }) => {
    await page.goto('/');
    const barra = page.locator('app-navbar .barra');
    await expect(barra).not.toHaveClass(/solida/);
    await page.mouse.wheel(0, 600);
    await expect(barra).toHaveClass(/solida/);
  });

  test('en móvil el menú se abre con el botón y se cierra al navegar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const alternar = page.getByRole('button', { name: 'Abrir menú' });
    await alternar.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Productos', exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/productos`);
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('una ruta desconocida redirige al Inicio', async ({ page }) => {
    await page.goto('/no-existe');
    await expect(page).toHaveURL(`${BASE}/`);
  });
});

test.describe('Productos', () => {
  test('filtros combinables (variedad, proceso y presentación) y orden actualizan la grilla y la URL', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    await expect(resumen(page)).toHaveText('25 cafés');

    // Cada chip muestra cuántos cafés tiene.
    await expect(lateral(page).getByRole('button', { name: 'Castillo' })).toHaveAccessibleName('Castillo 6 cafés');
    await lateral(page).getByRole('button', { name: 'Castillo' }).click();
    await expect(page).toHaveURL(/variedad=castillo/);
    await esperarCatalogo(page, 6);

    await lateral(page).getByRole('button', { name: 'Honey' }).click();
    await expect(page).toHaveURL(/proceso=honey/);
    await esperarCatalogo(page, 2);

    await lateral(page).getByRole('button', { name: '500 g' }).click();
    await expect(page).toHaveURL(/variedad=castillo&proceso=honey&presentacion=500/);
    await esperarCatalogo(page, 1);
    await expect(resumen(page)).toHaveText('1 de 25 cafés');
    await expect(tarjetas(page).locator('.nombre')).toHaveText('Tierradentro');
    await expect(tarjetas(page).locator('app-etiqueta-cafe')).toHaveText([/Castillo/, /Honey/]);

    // Todos los cafés del catálogo están disponibles: el interruptor no quita ninguno.
    await lateral(page).getByRole('switch', { name: 'Solo disponibles' }).check();
    await expect(page).toHaveURL(/disponibles=1/);
    await esperarCatalogo(page, 1);

    await lateral(page).getByRole('button', { name: /Limpiar filtros/ }).click();
    await esperarCatalogo(page, 25);
    await expect(page).toHaveURL(`${BASE}/productos`);

    const orden = page.getByRole('combobox', { name: 'Ordenar por' });
    await orden.selectOption('precio-asc');
    await expect(page).toHaveURL(/orden=precio-asc/);
    await expect.poll(async () => (await nombresDeTarjetas(page)).slice(0, 3)).toEqual(['Sierra Nevada', 'Mesa de los Santos', 'Pitalito']);

    await orden.selectOption('precio-desc');
    await expect.poll(async () => (await nombresDeTarjetas(page))[0]).toBe('Inzá Reserva');

    await orden.selectOption('nombre');
    await expect.poll(async () => (await nombresDeTarjetas(page))[0]).toBe('Altiplano Sur');
  });

  test('el bloque de procesos va arriba de la grilla, filtra y marca el proceso activo sin mover la página', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    const guia = page.getByRole('region', { name: 'Tres procesos, tres tazas' });
    await expect(guia.getByRole('listitem')).toHaveCount(3);
    await expect(guia).toContainText('Se seca con parte del mucílago');

    // Va arriba de la grilla (no intercalado) y es compacto.
    await expect(page.getByTestId('catalogo').locator('app-guia-procesos')).toHaveCount(0);
    const cajaGuia = (await guia.boundingBox())!;
    const cajaGrilla = (await page.getByTestId('catalogo').boundingBox())!;
    expect(cajaGuia.y + cajaGuia.height).toBeLessThan(cajaGrilla.y);
    expect(cajaGuia.height).toBeLessThan(240);

    // Pulsar "Ver 8 cafés" aplica el mismo filtro de la barra lateral, sin llevar la página arriba.
    await page.evaluate(() => window.scrollTo(0, 400));
    const honey = guia.getByRole('button', { name: 'Ver 8 cafés Honey' });
    await honey.click();
    await expect(page).toHaveURL(/proceso=honey/);
    await esperarCatalogo(page, 8);
    await expect(honey).toHaveAttribute('aria-pressed', 'true');
    await expect(lateral(page).getByRole('button', { name: 'Honey' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

    // Pulsarlo otra vez quita el filtro.
    await honey.click();
    await esperarCatalogo(page, 25);
    await expect(honey).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(`${BASE}/productos`);
  });

  test('todas las cards miden lo mismo y sus textos quedan alineados', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    // Ninguna card es más grande que las demás.
    await expect(tarjetas(page).and(page.locator('.destacada'))).toHaveCount(0);
    // Alto de la card y posición del nombre, el origen y el precio: idénticos en las 25.
    const medidas = await tarjetas(page).evaluateAll((cards) =>
      cards.map((card) => {
        const arriba = card.getBoundingClientRect().top;
        const y = (selector: string) => Math.round(card.querySelector(selector)!.getBoundingClientRect().top - arriba);
        return [Math.round(card.getBoundingClientRect().height), y('img'), y('.nombre'), y('.origen'), y('.precio')].join('/');
      }),
    );
    expect(new Set(medidas).size).toBe(1);
    // 3 columnas a 1440 px.
    const columnas = await tarjetas(page).evaluateAll((cards) => new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left))).size);
    expect(columnas).toBe(3);
  });

  test('las 9 variedades: "Ver las 9 variedades" muestra el resto y la elegida sigue visible', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    const panel = lateral(page);
    await expect(panel.getByRole('button', { name: 'Bourbon Rosado' })).toHaveCount(0);

    const verMas = panel.getByRole('button', { name: 'Ver las 9 variedades' });
    await expect(verMas).toHaveAttribute('aria-expanded', 'false');
    await verMas.click();
    await expect(panel.getByRole('button', { name: 'Ver menos variedades' })).toHaveAttribute('aria-expanded', 'true');

    await panel.getByRole('button', { name: 'Bourbon Rosado' }).click();
    await expect(page).toHaveURL(/variedad=bourbon%20rosado/);
    await esperarCatalogo(page, 2);

    // Al plegar la lista, la variedad elegida no se esconde.
    await panel.getByRole('button', { name: 'Ver menos variedades' }).click();
    await expect(panel.getByRole('button', { name: 'Bourbon Rosado' })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('button', { name: 'Bourbon Amarillo' })).toHaveCount(0);
  });

  test('búsqueda sin tildes desde el navbar y desde el catálogo (también por variedad y proceso)', async ({ page }) => {
    await page.goto('/');
    const buscador = page.getByRole('searchbox', { name: 'Buscar cafés' });
    await buscador.fill('narino');
    await buscador.press('Enter');

    await expect(page).toHaveURL(`${BASE}/productos?q=narino`);
    await esperarCatalogo(page, 5);
    await expect(buscador).toHaveValue('narino');

    // En /productos filtra mientras se escribe.
    await buscador.fill('MESA');
    await esperarCatalogo(page, 2);
    await expect(page).toHaveURL(/q=MESA/);

    // Por proceso y por variedad.
    await buscador.fill('honey');
    await esperarCatalogo(page, 8);
    for (const proceso of await tarjetas(page).locator('app-etiqueta-cafe.proceso').allTextContents()) {
      expect(proceso).toContain('Honey');
    }
    await buscador.fill('rosado');
    await esperarCatalogo(page, 2);
    await expect(tarjetas(page).locator('.nombre')).toHaveText(['Rosa del Huila', 'Rosa del Huila']);

    // Estado vacío con su acción.
    await buscador.fill('zzz');
    await expect(page.getByRole('heading', { name: 'No hay cafés que coincidan con tu búsqueda' })).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar filtros' }).last().click();
    await esperarCatalogo(page, 25);
  });

  test('recargar la página conserva variedad, proceso, presentación y orden', async ({ page }) => {
    await page.goto('/productos?variedad=caturra&proceso=lavado&presentacion=500&orden=precio-asc');
    await esperarCatalogo(page, 2);
    await page.reload();

    await esperarCatalogo(page, 2);
    await expect(lateral(page).getByRole('button', { name: 'Caturra' })).toHaveAttribute('aria-pressed', 'true');
    await expect(lateral(page).getByRole('button', { name: 'Lavado' })).toHaveAttribute('aria-pressed', 'true');
    await expect(lateral(page).getByRole('button', { name: '500 g' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('precio-asc');
    await expect.poll(() => nombresDeTarjetas(page)).toEqual(['Pitalito', 'Volcán Galeras']);
  });

  test('cards: variedad y proceso, precio en COP y disponibilidad con alerta', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    await cargarImagenesDeCards(page);

    for (const precio of await tarjetas(page).locator('.precio').allTextContents()) {
      expect(limpiar(precio)).toMatch(/^\$ \d{1,3}(\.\d{3})+$/);
    }
    const tarjeta = (nombre: string, gramos: number) =>
      tarjetas(page).filter({ has: page.getByRole('heading', { name: nombre, exact: true }) }).filter({ hasText: `${gramos} g` });

    await expect(tarjeta('Inzá Reserva', 340).locator('.disponibilidad')).toHaveText('Quedan 5');
    await expect(tarjeta('Inzá Reserva', 340).locator('.disponibilidad')).toHaveAttribute('data-tipo', 'bajo');
    await expect(tarjeta('Mesa de los Santos', 340).locator('.disponibilidad')).toHaveText('30 disponibles');
    await expect(tarjeta('Mesa de los Santos', 340).locator('.precio')).toHaveText(/\$\s46\.000/);
    await expect(tarjeta('Rosa del Huila', 500).locator('app-etiqueta-cafe')).toHaveText([/Bourbon Rosado/, /Fermentado/]);
    // Ningún café del catálogo está agotado.
    await expect(tarjetas(page).locator('.disponibilidad', { hasText: 'Agotado' })).toHaveCount(0);
  });

  test('vista rápida: datos de la API, color de la variedad y cierre con Escape, X y clic fuera', async ({ page }) => {
    const detalle = page.waitForResponse((r) => r.url().startsWith(`${API}/cafes/`) && r.status() === 200);
    await page.goto('/productos');
    await esperarCatalogo(page, 25);

    await page.getByRole('button', { name: 'Ver producto Volcán Galeras 340 g' }).click();
    await detalle;
    const vista = page.getByRole('dialog', { name: 'Volcán Galeras' });
    await expect(vista).toBeVisible();
    await esperarFinDelVuelo(page);
    await expect(vista.locator('.precio')).toHaveText(/\$\s54\.000/);
    await expect(vista.locator('app-etiqueta-cafe')).toHaveText([/Caturra/, /Lavado/]);
    await expect(vista.locator('.ficha')).toContainText('Caturra');
    await expect(vista.locator('.ficha')).toContainText('Lavado');
    await expect(vista.locator('.ficha')).toContainText('Taza limpia y brillante');
    await expect(vista.locator('.ficha')).toContainText('Nariño');
    await expect(vista.locator('.ficha')).toContainText('340 g');
    await expect(vista.locator('.notas')).toContainText('Caramelo');
    // El fondo de la escena toma el color de la variedad (Caturra).
    await expect(vista.locator('.escena')).toHaveCSS('background-color', 'rgb(59, 107, 52)');
    // Guía 2: sin sesión el botón está activo y lleva a /login (ver carrito.e2e.ts).
    await expect(vista.getByRole('button', { name: 'Agregar al carrito' })).toBeEnabled();

    // Selector de cantidad.
    await vista.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await expect(vista.locator('output')).toHaveText('2');

    // El foco queda dentro del panel.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(vista).toBeHidden();

    await page.getByRole('button', { name: 'Ver producto Inzá Reserva 340 g' }).click();
    const otra = page.getByRole('dialog', { name: 'Inzá Reserva' });
    await expect(otra).toBeVisible();
    await esperarFinDelVuelo(page);
    await expect(otra.locator('.escena')).toHaveCSS('background-color', 'rgb(45, 106, 94)'); // Geisha
    await expect(otra.locator('.ficha')).toContainText('Fermentado');
    await otra.getByRole('button', { name: 'Cerrar vista rápida' }).click();
    await expect(otra).toBeHidden();

    await page.getByRole('button', { name: 'Ver producto Pitalito Reserva 340 g' }).click();
    await expect(page.getByRole('dialog', { name: 'Pitalito Reserva' })).toBeVisible();
    await esperarFinDelVuelo(page);
    await page.mouse.click(30, 450);
    await expect(page.getByRole('dialog', { name: 'Pitalito Reserva' })).toBeHidden();
  });

  test('la bolsa vuela de la card a la vista rápida y vuelve al cerrar @movimiento', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    await cargarImagenesDeCards(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Se registra qué elementos llevan el nombre de transición "bolsa" durante el vuelo.
    await page.evaluate(() => {
      (window as unknown as { vuelos: number }).vuelos = 0;
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = ((cambio: () => void) => {
        if (document.querySelector('img[data-bolsa]') && document.documentElement.classList.contains('transicion-vuelo')) {
          (window as unknown as { vuelos: number }).vuelos++;
        }
        return original(cambio);
      }) as typeof document.startViewTransition;
    });

    // Toda la card es clicable: se pulsa sobre la bolsa, que debe seguir en pantalla para volver a ella.
    const bolsa = page.locator('img[data-bolsa]').first();
    await bolsa.evaluate((img) => img.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const caja = (await bolsa.boundingBox())!;
    await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
    const vista = page.getByRole('dialog', { name: 'Inzá Reserva' });
    await expect(vista).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { vuelos: number }).vuelos)).toBe(1);
    await expect(vista.locator('.bolsa img')).toHaveCSS('view-transition-name', 'bolsa');
    await esperarFinDelVuelo(page);

    await page.keyboard.press('Escape');
    await expect(vista).toBeHidden();
    await expect.poll(() => page.evaluate(() => (window as unknown as { vuelos: number }).vuelos)).toBe(2);
    // Al terminar, ninguna card conserva el nombre de la transición.
    await expect.poll(() => page.locator('img[data-bolsa]').evaluateAll((imgs) => imgs.filter((i) => (i as HTMLElement).style.viewTransitionName).length)).toBe(0);
  });

  test('en móvil los filtros van en una hoja con buscador', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/productos');
    await esperarCatalogo(page, 25);
    // Sin desplazamiento horizontal de la página (el bloque de procesos tiene su propia fila con scroll).
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('region', { name: 'Tres procesos, tres tazas' }).getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: /^Filtrar/ }).click();
    const hoja = page.getByRole('dialog', { name: 'Filtros' });
    await expect(hoja).toBeVisible();
    await hoja.getByRole('button', { name: 'Caturra' }).click();
    await expect(page).toHaveURL(/variedad=caturra/);
    await hoja.getByRole('button', { name: 'Fermentado' }).click();
    await expect(page).toHaveURL(/variedad=caturra&proceso=fermentado/);
    await hoja.getByRole('button', { name: 'Ver 1 de 25 cafés' }).click();
    await expect(hoja).toBeHidden();
    await expect(page.getByRole('button', { name: /^Filtrar/ })).toContainText('2');
    await expect(tarjetas(page).locator('.nombre')).toHaveText('Inzá');
  });
});

test.describe('API caída', () => {
  // Las peticiones abortadas generan errores de red esperados en la consola.
  test.use({ permitirErroresDeRed: true });

  test('Inicio y Productos muestran el error con "Reintentar" y se recuperan', async ({ page }) => {
    await page.route(`${API}/**`, (ruta) => ruta.abort('connectionrefused'));

    await page.goto('/');
    await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar los cafés' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' }).first()).toBeVisible();

    await page.goto('/productos');
    const error = page.getByRole('alert').filter({ hasText: 'No pudimos cargar los cafés' });
    await expect(error).toBeVisible();

    await page.unroute(`${API}/**`);
    await error.getByRole('button', { name: 'Reintentar' }).click();
    await esperarCatalogo(page, 25);
  });
});

// El envío real (Register y Login contra la API) se prueba en admin.e2e.ts.
test.describe('Formularios de acceso: validaciones', () => {
  test('Login: validaciones visibles y sin peticiones a la API mientras el formulario es inválido', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const peticiones = vigilarPeticionesApi(page);

    const enviar = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
    await enviar.click();
    await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible();
    await expect(page.getByText('Escribe tu contraseña.')).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Correo electrónico')).toBeFocused();

    await page.getByLabel('Correo electrónico').fill('correo-invalido');
    await expect(page.getByText('Escribe un correo válido, por ejemplo nombre@dominio.com.')).toBeVisible();

    const contrasena = page.getByLabel('Contraseña', { exact: true });
    await contrasena.fill('secreto1');
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(contrasena).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await expect(contrasena).toHaveAttribute('type', 'password');

    // Visto de campo válido.
    await page.getByLabel('Correo electrónico').fill('cliente@ejemplo.com');
    await expect(page.locator('.campo-acceso').first()).toHaveClass(/valido/);
    await page.waitForTimeout(500);
    expect(peticiones, 'Un formulario inválido no debe llamar a la API').toEqual([]);
  });

  test('Registro: validaciones, medidor de seguridad y sin peticiones a la API mientras es inválido', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    const peticiones = vigilarPeticionesApi(page);

    const enviar = page.getByRole('button', { name: 'Registrarse' });
    await enviar.click();
    for (const mensaje of ['Escribe tu nombre completo.', 'Escribe tu correo electrónico.', 'Escribe una contraseña.', 'Confirma tu contraseña.']) {
      await expect(page.getByText(mensaje)).toBeVisible();
    }

    await page.getByLabel('Nombre completo').fill('Ana María Rojas');
    await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com');
    const contrasena = page.getByLabel('Contraseña', { exact: true });
    const confirmacion = page.getByLabel('Confirmar contraseña');
    await contrasena.fill('123');
    await expect(page.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeVisible();
    await contrasena.fill('cafe2026');
    await expect(page.locator('.medidor .lleno')).toHaveCount(2);
    await expect(page.locator('#registro-contrasena-ayuda')).toContainText('aceptable');
    await confirmacion.fill('cafe2025');
    await confirmacion.blur();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();

    await enviar.click();
    await page.waitForTimeout(500);
    expect(peticiones, 'Un formulario inválido no debe llamar a la API').toEqual([]);

    await confirmacion.fill('cafe2026');
    await expect(page.getByText('Las contraseñas no coinciden.')).toHaveCount(0);
  });
});

test.describe('Accesibilidad', () => {
  for (const ancho of [1440, 375]) {
    test(`axe-core sin violaciones en todas las vistas a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ancho === 375 ? 812 : 900 });
      const revisar = async (nombre: string) => {
        const resultado = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(resultado.violations.map((v) => `${nombre}: ${v.id}`)).toEqual([]);
      };

      for (const [ruta, nombre] of [['/', 'inicio'], ['/productos', 'productos'], ['/productos?q=zzz', 'vacío'], ['/productos?variedad=geisha&proceso=lavado', 'filtrado'], ['/login', 'login'], ['/registro', 'registro']]) {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await recorrer(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(600);
        await revisar(nombre);
      }

      await page.goto('/productos');
      await esperarCatalogo(page, 25);
      await page.getByRole('button', { name: 'Ver producto Volcán Galeras 340 g' }).click();
      await expect(page.getByRole('dialog', { name: 'Volcán Galeras' })).toBeVisible();
      await page.waitForTimeout(700);
      await revisar('vista rápida');
    });
  }
});

test.describe('Capturas', () => {
  // Movimiento reducido: las capturas muestran el estado final (sin revelados pendientes).
  test.use({ reducedMotion: 'reduce' });

  for (const ancho of [1440, 375]) {
    test(`vistas y vista rápida a ${ancho} px @una-vez`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ancho === 375 ? 812 : 900 });

      for (const [ruta, nombre] of [['/', 'inicio'], ['/productos', 'productos'], ['/login', 'login'], ['/registro', 'registro']]) {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        for (const imagen of await page.locator('img').all()) {
          await imagen.scrollIntoViewIfNeeded();
          await expect.poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        await page.screenshot({ path: `e2e/capturas/${nombre}-${ancho}.png`, fullPage: true });
      }

      await page.goto('/productos');
      await esperarCatalogo(page, 25);
      await page.getByRole('button', { name: 'Ver producto Volcán Galeras 340 g' }).click();
      const vista = page.getByRole('dialog', { name: 'Volcán Galeras' });
      await expect(vista.locator('img')).toBeVisible();
      await expect.poll(() => vista.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.screenshot({ path: `e2e/capturas/vista-rapida-${ancho}.png` });

      if (ancho === 375) {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: /^Filtrar/ }).click();
        await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible();
        await page.screenshot({ path: 'e2e/capturas/productos-filtros-375.png' });
      }
    });
  }

  test('grabación del hero y de la apertura de la vista rápida @movimiento', async ({ browser }) => {
    const carpeta = 'e2e/capturas/video';
    rmSync(carpeta, { recursive: true, force: true });
    const contexto = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: carpeta, size: { width: 1440, height: 900 } },
      reducedMotion: 'no-preference',
    });
    const pagina = await contexto.newPage();

    await pagina.goto('/');
    await pagina.waitForTimeout(2800); // entrada del hero
    for (let i = 0; i < 30; i++) {
      await pagina.mouse.wheel(0, 40); // parallax de las crestas
      await pagina.waitForTimeout(30);
    }
    await pagina.waitForTimeout(800);

    await pagina.goto('/productos');
    await expect(pagina.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(25);
    await pagina.waitForTimeout(1200);
    const bolsa = (await pagina.locator('img[data-bolsa]').first().boundingBox())!;
    await pagina.mouse.move(bolsa.x + bolsa.width / 2, bolsa.y + bolsa.height / 3, { steps: 12 }); // inclinación de la card
    await pagina.waitForTimeout(600);
    await pagina.mouse.click(bolsa.x + bolsa.width / 2, bolsa.y + bolsa.height / 3);
    await pagina.waitForTimeout(1500);
    await pagina.keyboard.press('Escape');
    await pagina.waitForTimeout(1200);

    const video = pagina.video();
    await contexto.close();
    renameSync(await video!.path(), 'e2e/capturas/hero-y-vista-rapida.webm');
  });
});
