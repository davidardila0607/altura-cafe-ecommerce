import { Page } from '@playwright/test';
import { API, cargarImagenesDeCards, expect, limpiar, test, vigilarPeticionesApi } from './fixtures';

const BASE = 'http://localhost:4200';

const tarjetas = (page: Page) => page.locator('app-tarjeta-cafe');
const nombresDeTarjetas = (page: Page) => tarjetas(page).locator('.nombre').allTextContents();
const lateral = (page: Page) => page.getByRole('complementary', { name: 'Filtros del catálogo' });
const resumen = (page: Page) => page.getByTestId('resumen');

async function esperarCatalogo(page: Page, cantidad: number): Promise<void> {
  await expect(page.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(cantidad);
}

test.describe('Inicio', () => {
  test('es la primera vista y muestra 3 destacados de la API con imágenes de Cloudinary', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Altura | Café de especialidad');
    await expect(page.getByRole('heading', { level: 1, name: 'Café de altura, tostado con intención' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explorar cafés' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuestra historia' })).toBeVisible();

    const destacados = page.getByTestId('destacados').locator('app-tarjeta-cafe');
    await expect(destacados).toHaveCount(3);

    // Con stock primero y por precio descendente (Sierra Nevada está agotado).
    await expect(destacados.locator('.nombre')).toHaveText(['Tierradentro', 'Pitalito Reserva', 'Mesa de los Santos']);

    for (const imagen of await destacados.locator('img').all()) {
      await imagen.scrollIntoViewIfNeeded();
      expect(await imagen.getAttribute('src')).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/upload\/f_auto,q_auto,w_600\//);
      await expect.poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }

    // Card completa: precio en COP, disponibilidad y "Ver producto".
    const primera = destacados.first();
    await expect(primera.locator('.precio')).toHaveText(/\$\s118\.000/);
    await expect(primera.locator('.disponibilidad')).toHaveText('Quedan 5');
    await expect(primera.getByRole('button', { name: /Ver producto/ })).toBeVisible();
  });

  test('"Nuestra historia" desplaza al proceso y la página tiene todas sus secciones', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Nuestra historia' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'De la montaña a tu taza' })).toBeInViewport();

    for (const titulo of ['Selección de la casa', 'Orígenes', 'Las variedades de la casa', 'Encuentra el café de tu próxima mañana']) {
      await expect(page.getByRole('heading', { level: 2, name: titulo })).toBeAttached();
    }
    // Variedades desde la API, cada una con enlace al catálogo filtrado.
    await expect(page.getByRole('link', { name: /^Ver cafés (Castillo|Geisha|Moka)$/ })).toHaveCount(3);
    await expect(page.getByRole('contentinfo')).toContainText(String(new Date().getFullYear()));
  });

  test('el mapa de orígenes muestra los cafés de la región y lleva al catálogo filtrado', async ({ page }) => {
    await page.goto('/');
    const marcador = page.getByRole('button', { name: 'Nariño: 1 café' });
    await marcador.scrollIntoViewIfNeeded();
    await marcador.click();

    await expect(marcador).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 3, name: 'Nariño' })).toBeVisible();
    await expect(page.locator('app-origenes .lista')).toContainText('Volcán Galeras');

    await page.getByRole('link', { name: 'Ver cafés de Nariño' }).click();
    await expect(page).toHaveURL(/\/productos\?origen=narino$/);
    await esperarCatalogo(page, 1);
    await expect(tarjetas(page).locator('.nombre')).toHaveText('Volcán Galeras');
    await expect(lateral(page).getByRole('button', { name: 'Nariño' })).toHaveAttribute('aria-pressed', 'true');
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
    await esperarCatalogo(page, 6);

    await nav.getByRole('link', { name: 'Inicio', exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Café de altura, tostado con intención');

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

  test('una ruta desconocida redirige al Inicio', async ({ page }) => {
    await page.goto('/no-existe');
    await expect(page).toHaveURL(`${BASE}/`);
  });
});

test.describe('Productos', () => {
  test('filtros combinables y orden actualizan la grilla y la URL', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 6);
    await expect(resumen(page)).toHaveText('6 cafés');

    await lateral(page).getByRole('button', { name: 'Castillo' }).click();
    await expect(page).toHaveURL(/variedad=castillo/);
    await esperarCatalogo(page, 3);

    await lateral(page).getByRole('button', { name: '500 g' }).click();
    await expect(page).toHaveURL(/presentacion=500/);
    await esperarCatalogo(page, 2);
    await expect(resumen(page)).toHaveText('2 de 6 cafés');

    await lateral(page).getByRole('switch', { name: 'Solo disponibles' }).check();
    await expect(page).toHaveURL(/disponibles=1/);
    await esperarCatalogo(page, 1);
    await expect(tarjetas(page).locator('.nombre')).toHaveText('Mesa de los Santos');

    await lateral(page).getByRole('button', { name: /Limpiar filtros/ }).click();
    await esperarCatalogo(page, 6);
    await expect(page).toHaveURL(`${BASE}/productos`);

    const orden = page.getByRole('combobox', { name: 'Ordenar por' });
    await orden.selectOption('precio-asc');
    await expect(page).toHaveURL(/orden=precio-asc/);
    await expect.poll(() => nombresDeTarjetas(page)).toEqual([
      'Mesa de los Santos', 'Volcán Galeras', 'Mesa de los Santos', 'Sierra Nevada', 'Pitalito Reserva', 'Tierradentro',
    ]);

    await orden.selectOption('precio-desc');
    await expect.poll(async () => (await nombresDeTarjetas(page))[0]).toBe('Tierradentro');

    await orden.selectOption('nombre');
    await expect.poll(async () => (await nombresDeTarjetas(page))[0]).toBe('Mesa de los Santos');
  });

  test('búsqueda sin tildes desde el navbar y desde el catálogo, reflejada en la URL', async ({ page }) => {
    await page.goto('/');
    const buscador = page.getByRole('searchbox', { name: 'Buscar cafés' });
    await buscador.fill('narino');
    await buscador.press('Enter');

    await expect(page).toHaveURL(`${BASE}/productos?q=narino`);
    await esperarCatalogo(page, 1);
    await expect(tarjetas(page).locator('.nombre')).toHaveText('Volcán Galeras');
    await expect(buscador).toHaveValue('narino');

    // En /productos filtra mientras se escribe.
    await buscador.fill('MESA');
    await esperarCatalogo(page, 2);
    await expect(page).toHaveURL(/q=MESA/);

    // Por variedad.
    await buscador.fill('geisha');
    await esperarCatalogo(page, 2);

    await buscador.fill('zzz');
    await expect(page.getByRole('heading', { name: 'No hay cafés que coincidan con tu búsqueda' })).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar filtros' }).last().click();
    await esperarCatalogo(page, 6);
  });

  test('recargar la página conserva filtros, orden y búsqueda', async ({ page }) => {
    await page.goto('/productos?variedad=castillo&presentacion=500&orden=precio-asc');
    await esperarCatalogo(page, 2);
    await page.reload();

    await esperarCatalogo(page, 2);
    await expect(lateral(page).getByRole('button', { name: 'Castillo' })).toHaveAttribute('aria-pressed', 'true');
    await expect(lateral(page).getByRole('button', { name: '500 g' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toHaveValue('precio-asc');
    await expect.poll(() => nombresDeTarjetas(page)).toEqual(['Mesa de los Santos', 'Sierra Nevada']);
  });

  test('cards: precio en COP, disponibilidad con alerta y agotado', async ({ page }) => {
    await page.goto('/productos');
    await esperarCatalogo(page, 6);
    await cargarImagenesDeCards(page);

    for (const precio of await tarjetas(page).locator('.precio').allTextContents()) {
      expect(limpiar(precio)).toMatch(/^\$ \d{1,3}(\.\d{3})+$/);
    }
    const tarjeta = (nombre: string, gramos: number) =>
      tarjetas(page).filter({ has: page.getByRole('heading', { name: nombre, exact: true }) }).filter({ hasText: `${gramos} g` });

    await expect(tarjeta('Tierradentro', 500).locator('.disponibilidad')).toHaveText('Quedan 5');
    await expect(tarjeta('Tierradentro', 500).locator('.disponibilidad')).toHaveAttribute('data-tipo', 'bajo');
    await expect(tarjeta('Sierra Nevada', 500).locator('.disponibilidad')).toHaveText('Agotado');
    await expect(tarjeta('Mesa de los Santos', 340).locator('.disponibilidad')).toHaveText('24 disponibles');
    await expect(tarjeta('Mesa de los Santos', 340).locator('.precio')).toHaveText(/\$\s42\.000/);
  });

  test('vista rápida: abre con datos de la API y se cierra con Escape, X y clic fuera', async ({ page }) => {
    const detalle = page.waitForResponse((r) => r.url().startsWith(`${API}/cafes/`) && r.status() === 200);
    await page.goto('/productos');
    await esperarCatalogo(page, 6);

    await page.getByRole('button', { name: 'Ver producto Volcán Galeras 340 g' }).click();
    await detalle;
    const vista = page.getByRole('dialog', { name: 'Volcán Galeras' });
    await expect(vista).toBeVisible();
    await expect(vista.locator('.precio')).toHaveText(/\$\s54\.000/);
    await expect(vista.locator('.ficha')).toContainText('Moka');
    await expect(vista.locator('.ficha')).toContainText('Nariño');
    await expect(vista.locator('.ficha')).toContainText('340 g');
    await expect(vista.getByRole('button', { name: /Agregar al carrito/ })).toBeDisabled();
    await expect(vista.getByRole('button', { name: /Agregar al carrito/ })).toContainText('Próximamente');

    // Selector de cantidad.
    await vista.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await expect(vista.locator('output')).toHaveText('2');

    // El foco queda dentro del panel.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(vista).toBeHidden();

    await page.getByRole('button', { name: 'Ver producto Tierradentro 500 g' }).click();
    const otra = page.getByRole('dialog', { name: 'Tierradentro' });
    await expect(otra).toBeVisible();
    await otra.getByRole('button', { name: 'Cerrar vista rápida' }).click();
    await expect(otra).toBeHidden();

    await page.getByRole('button', { name: 'Ver producto Pitalito Reserva 340 g' }).click();
    await expect(page.getByRole('dialog', { name: 'Pitalito Reserva' })).toBeVisible();
    await page.mouse.click(40, 400);
    await expect(page.getByRole('dialog', { name: 'Pitalito Reserva' })).toBeHidden();
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
    await esperarCatalogo(page, 6);
  });
});

test.describe('Formularios (solo visuales)', () => {
  test('Login: validaciones visibles y sin peticiones a la API al enviar', async ({ page }) => {
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

    await page.getByLabel('Correo electrónico').fill('cliente@ejemplo.com');
    await enviar.click();
    await expect(page.getByRole('status').filter({ hasText: 'próximamente' })).toHaveText(
      'El inicio de sesión estará disponible próximamente.',
    );
    await page.waitForTimeout(500);
    expect(peticiones, 'El formulario no debe llamar a la API').toEqual([]);
  });

  test('Registro: validaciones visibles y sin peticiones a la API al enviar', async ({ page }) => {
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
    await confirmacion.fill('cafe2025');
    await confirmacion.blur();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();

    await confirmacion.fill('cafe2026');
    await expect(page.getByText('Las contraseñas no coinciden.')).toHaveCount(0);
    await enviar.click();
    await expect(page.getByRole('status').filter({ hasText: 'próximamente' })).toHaveText(
      'El registro estará disponible próximamente.',
    );
    await page.waitForTimeout(500);
    expect(peticiones, 'El formulario no debe llamar a la API').toEqual([]);
  });
});

test.describe('Capturas', () => {
  // Movimiento reducido: las capturas muestran el estado final (sin revelados pendientes).
  test.use({ reducedMotion: 'reduce' });

  for (const ancho of [1440, 375]) {
    test(`vistas y vista rápida a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ancho === 375 ? 812 : 900 });

      for (const [ruta, nombre] of [['/', 'inicio'], ['/productos', 'productos'], ['/login', 'login'], ['/registro', 'registro']]) {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        for (const imagen of await page.locator('img').all()) {
          await imagen.scrollIntoViewIfNeeded();
          await expect.poll(() => imagen.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `e2e/capturas/${nombre}-${ancho}.png`, fullPage: true });
      }

      await page.goto('/productos');
      await esperarCatalogo(page, 6);
      await page.getByRole('button', { name: 'Ver producto Volcán Galeras 340 g' }).click();
      const vista = page.getByRole('dialog', { name: 'Volcán Galeras' });
      await expect(vista.locator('img')).toBeVisible();
      await expect.poll(() => vista.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.screenshot({ path: `e2e/capturas/vista-rapida-${ancho}.png` });

      if (ancho === 375) {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Filtrar' }).click();
        await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible();
        await page.screenshot({ path: 'e2e/capturas/productos-filtros-375.png' });
      }
    });
  }
});
