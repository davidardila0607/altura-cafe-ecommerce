import { API, cargarImagenesDeCards, expect, limpiar, test, vigilarPeticionesApi } from './fixtures';

const tarjeta = (page: import('@playwright/test').Page, nombre: string, gramos: number) =>
  page
    .locator('app-tarjeta-cafe')
    .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) })
    .filter({ hasText: `· ${gramos} g` });

test.describe('Home', () => {
  test('a. al abrir la app se muestra el Home', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Altura | Café de especialidad');
    await expect(page.getByRole('heading', { level: 1, name: 'Café de altura, tostado con intención' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Nuestros cafés' })).toBeVisible();
  });

  test('b. 6 cards con imágenes de Cloudinary, precio en COP y disponibilidad', async ({ page }) => {
    const imagenesCloudinary: { url: string; estado: number }[] = [];
    page.on('response', (r) => {
      if (r.url().startsWith('https://res.cloudinary.com/')) imagenesCloudinary.push({ url: r.url(), estado: r.status() });
    });

    await page.goto('/');
    const cards = page.locator('app-tarjeta-cafe');
    await expect(cards).toHaveCount(6);
    await cargarImagenesDeCards(page);

    for (const imagen of await page.locator('app-tarjeta-cafe img').all()) {
      const src = (await imagen.getAttribute('src')) ?? '';
      expect(src).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\/f_auto,q_auto,w_600\//);
    }
    expect(imagenesCloudinary.length).toBeGreaterThanOrEqual(6);
    expect(imagenesCloudinary.every((r) => r.estado === 200)).toBe(true);

    // Precio en COP con formato es-CO, por ejemplo "$ 42.000".
    for (const precio of await page.locator('app-tarjeta-cafe .precio').allTextContents()) {
      expect(limpiar(precio)).toMatch(/^\$ \d{1,3}(\.\d{3})+$/);
    }
    await expect(tarjeta(page, 'Mesa de los Santos', 340).locator('.precio')).toHaveText(/\$\s42\.000/);
    await expect(tarjeta(page, 'Tierradentro', 500).locator('.precio')).toHaveText(/\$\s118\.000/);

    // Disponibilidad: "N disponibles" o "Agotado".
    await expect(tarjeta(page, 'Mesa de los Santos', 340)).toContainText('24 disponibles');
    await expect(tarjeta(page, 'Pitalito Reserva', 340)).toContainText('8 disponibles');
    const sierra = tarjeta(page, 'Sierra Nevada', 500);
    await expect(sierra.locator('.badge-agotado')).toHaveText('Agotado');
    await expect(sierra).not.toContainText('disponibles');
    await expect(page.locator('.badge-agotado')).toHaveCount(1);
  });

  test('c. filtro por variedad y buscador', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('app-tarjeta-cafe');
    await expect(cards).toHaveCount(6);

    const chips = page.getByRole('group', { name: 'Filtrar por variedad' });
    await expect(chips.getByRole('button')).toHaveText(['Todas', 'Castillo', 'Geisha', 'Moka']);

    await chips.getByRole('button', { name: 'Geisha' }).click();
    await expect(chips.getByRole('button', { name: 'Geisha' })).toHaveAttribute('aria-pressed', 'true');
    await expect(cards).toHaveCount(2);
    for (const meta of await cards.locator('.meta').allTextContents()) expect(meta).toContain('Geisha');

    await chips.getByRole('button', { name: 'Castillo' }).click();
    await expect(cards).toHaveCount(3);

    await chips.getByRole('button', { name: 'Todas' }).click();
    await expect(cards).toHaveCount(6);

    const buscador = page.getByRole('searchbox', { name: 'Buscar cafés' });

    // Por origen, sin tildes.
    await buscador.fill('narino');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Volcán Galeras');

    // Por nombre.
    await buscador.fill('mesa');
    await expect(cards).toHaveCount(2);

    // Por variedad, combinado con el chip.
    await buscador.fill('castillo');
    await expect(cards).toHaveCount(3);
    await chips.getByRole('button', { name: 'Geisha' }).click();
    await expect(cards).toHaveCount(0);
    await expect(page.getByText('No hay cafés que coincidan con tu búsqueda')).toBeVisible();

    await page.getByRole('button', { name: 'Ver todos los cafés' }).click();
    await expect(cards).toHaveCount(6);
    await expect(buscador).toHaveValue('');
  });
});

test.describe('API caída', () => {
  // Las peticiones abortadas generan errores de red esperados en la consola.
  test.use({ permitirErroresDeRed: true });

  test('f. con la API caída se muestra el error y "Reintentar" recupera los cafés', async ({ page }) => {
    test.info().annotations.push({ type: 'nota', description: 'Simula la API apagada cortando las peticiones a /api.' });
    await page.route(`${API}/**`, (ruta) => ruta.abort('connectionrefused'));
    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText('No pudimos cargar los cafés');
    const reintentar = page.getByRole('button', { name: 'Reintentar' });
    await expect(reintentar).toBeVisible();
    await expect(page.locator('app-tarjeta-cafe')).toHaveCount(0);

    // La API "vuelve": Reintentar carga el catálogo.
    await page.unroute(`${API}/**`);
    await reintentar.click();
    await expect(page.locator('app-tarjeta-cafe')).toHaveCount(6);
  });
});

test.describe('Navegación', () => {
  test('d. usuario → /login, Regístrate → /registro, Inicia sesión → /login, logo → Home', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page).toHaveTitle('Iniciar sesión | Altura');
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    await page.getByRole('link', { name: 'Regístrate' }).click();
    await expect(page).toHaveURL(/\/registro$/);
    await expect(page).toHaveTitle('Crear cuenta | Altura');

    await page.getByRole('link', { name: 'Inicia sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByRole('link', { name: 'Altura, ir al inicio' }).click();
    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page.getByRole('heading', { level: 1, name: 'Café de altura, tostado con intención' })).toBeVisible();
  });

  test('ruta desconocida redirige al Home', async ({ page }) => {
    await page.goto('/no-existe');
    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page).toHaveTitle('Altura | Café de especialidad');
  });
});

test.describe('Formularios (solo visuales)', () => {
  test('e. Login: validaciones visibles y sin peticiones a la API al enviar', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const peticiones = vigilarPeticionesApi(page);

    const enviar = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
    await enviar.click();
    await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible();
    await expect(page.getByText('Escribe tu contraseña.')).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Correo electrónico').fill('correo-invalido');
    await expect(page.getByText('Escribe un correo válido, por ejemplo nombre@dominio.com.')).toBeVisible();

    // Mostrar / ocultar contraseña.
    const contrasena = page.getByLabel('Contraseña', { exact: true });
    await contrasena.fill('secreto1');
    await expect(contrasena).toHaveAttribute('type', 'password');
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

  test('e. Registro: validaciones visibles y sin peticiones a la API al enviar', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    const peticiones = vigilarPeticionesApi(page);

    const enviar = page.getByRole('button', { name: 'Registrarse' });
    await enviar.click();
    await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible();
    await expect(page.getByText('Escribe tu correo electrónico.')).toBeVisible();
    await expect(page.getByText('Escribe una contraseña.')).toBeVisible();
    await expect(page.getByText('Confirma tu contraseña.')).toBeVisible();

    await page.getByLabel('Nombre completo').fill('Ana María Rojas');
    await page.getByLabel('Correo electrónico').fill('ana@ejemplo');
    await expect(page.getByText('Escribe un correo válido, por ejemplo nombre@dominio.com.')).toBeVisible();
    await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com');

    const contrasena = page.getByLabel('Contraseña', { exact: true });
    const confirmacion = page.getByLabel('Confirmar contraseña');
    await contrasena.fill('123');
    await expect(page.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeVisible();
    await contrasena.fill('cafe2026');
    await confirmacion.fill('cafe2025');
    await confirmacion.blur();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();

    await page.getByRole('button', { name: 'Mostrar confirmación de contraseña' }).click();
    await expect(confirmacion).toHaveAttribute('type', 'text');

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
  for (const ancho of [1440, 375]) {
    test(`h. capturas de las tres vistas a ${ancho} px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: ancho === 375 ? 812 : 900 });

      await page.goto('/');
      await expect(page.locator('app-tarjeta-cafe')).toHaveCount(6);
      await cargarImagenesDeCards(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `e2e/capturas/home-${ancho}.png`, fullPage: true });

      for (const vista of ['login', 'registro']) {
        await page.goto(`/${vista}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `e2e/capturas/${vista}-${ancho}.png`, fullPage: true });
      }

      // Validaciones visibles (captura adicional del estado con errores).
      await page.getByRole('button', { name: 'Registrarse' }).click();
      await page.screenshot({ path: `e2e/capturas/registro-errores-${ancho}.png`, fullPage: true });
    });
  }

  test('h. menú móvil desplegado a 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const boton = page.getByRole('button', { name: 'Abrir menú' });
    await boton.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('searchbox', { name: 'Buscar cafés' })).toBeVisible();
    await page.screenshot({ path: 'e2e/capturas/home-menu-375.png' });

    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });
});
