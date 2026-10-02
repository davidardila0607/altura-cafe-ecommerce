import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Page } from '@playwright/test';
import { API, expect, test } from './fixtures';

/*
 * Panel de administración (/admin).
 * Las credenciales NO están en el código: se leen de variables de entorno.
 *   ALTURA_ADMIN_EMAIL, ALTURA_ADMIN_PASSWORD     (cuenta con rol Administrador)
 *   ALTURA_CLIENTE_EMAIL, ALTURA_CLIENTE_PASSWORD (cuenta con rol Cliente)
 * Sin ellas, estas pruebas se omiten. Todo lo que crean lleva "e2e" en el nombre y se borra al final.
 */
const admin = { email: process.env['ALTURA_ADMIN_EMAIL'] ?? '', password: process.env['ALTURA_ADMIN_PASSWORD'] ?? '' };
const cliente = { email: process.env['ALTURA_CLIENTE_EMAIL'] ?? '', password: process.env['ALTURA_CLIENTE_PASSWORD'] ?? '' };

const NOMBRE_CAFE = 'Prueba e2e Altura';
const NOMBRE_VARIEDAD = 'Variedad e2e';
const IMAGEN = '../backend/seed/imagenes/03-pitalito-reserva-340g.png';
const IMAGEN_SVG = '../backend/seed/imagenes/03-pitalito-reserva-340g.svg';

test.describe('Panel de administración @una-vez', () => {
  test.describe.configure({ mode: 'serial' });
  // Las respuestas 401/403/409 que se provocan a propósito aparecen en la consola como
  // "Failed to load resource": son esperadas. Cualquier otro error de consola sigue fallando.
  test.use({ permitirErroresDeRed: true });
  test.skip(!admin.email || !cliente.email, 'Define ALTURA_ADMIN_* y ALTURA_CLIENTE_* para probar el panel.');

  async function ingresar(page: Page, cuenta: { email: string; password: string }): Promise<void> {
    await page.goto('/admin/ingresar');
    await page.getByLabel('Correo electrónico').fill(cuenta.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(cuenta.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
  }

  /** Borra por la API cualquier café o variedad de prueba que haya quedado (también si una prueba falla). */
  async function limpiar(request: APIRequestContext): Promise<void> {
    const login = await request.post(`${API}/auth/login`, { data: admin });
    const { token } = (await login.json()) as { token: string };
    const headers = { Authorization: `Bearer ${token}` };
    const cafes = (await (await request.get(`${API}/cafes`)).json()) as { id: number; nombre: string }[];
    for (const cafe of cafes.filter((c) => c.nombre.includes('e2e'))) {
      await request.delete(`${API}/cafes/${cafe.id}`, { headers });
    }
    const variedades = (await (await request.get(`${API}/variedades`)).json()) as { id: number; nombre: string }[];
    for (const variedad of variedades.filter((v) => v.nombre.includes('e2e'))) {
      await request.delete(`${API}/variedades/${variedad.id}`, { headers });
    }
  }

  test.beforeAll(async ({ request }) => limpiar(request));
  test.afterAll(async ({ request }) => limpiar(request));

  test('sin sesión, /admin lleva a /admin/ingresar', async ({ page }) => {
    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Panel de administración' })).toBeVisible();
  });

  test('el footer tiene un acceso discreto y el navbar público no', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByText('Acceso administrador')).toHaveCount(0);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Acceso administrador' }).click();
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });

  test('credenciales incorrectas muestran un error claro', async ({ page }) => {
    await ingresar(page, { email: admin.email, password: 'contrasena-incorrecta' });
    await expect(page.getByRole('alert')).toHaveText(/Correo o contraseña incorrectos\./);
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });

  test('una cuenta Cliente no entra al panel', async ({ page }) => {
    await ingresar(page, cliente);
    await expect(page.getByRole('alert')).toHaveText(/Esta cuenta no tiene permiso para administrar el inventario\./);
    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });

  test('crear café con imagen, verlo en la tienda, editarlo y eliminarlo (también su imagen)', async ({ page, request }) => {
    await ingresar(page, admin);
    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await expect(page.getByTestId('usuario-admin')).not.toBeEmpty();

    // ----- Crear -----
    await page.getByRole('button', { name: 'Nuevo café' }).click();
    const panel = page.getByRole('dialog', { name: 'Nuevo café' });
    await expect(panel).toBeVisible();

    // Validaciones antes de enviar.
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expect(panel.getByText('Escribe el nombre del café (máximo 100 caracteres).')).toBeVisible();
    await expect(panel.getByText('Elige una variedad.')).toBeVisible();

    // Imagen: tipo y tamaño se validan antes de subir.
    const archivo = panel.locator('#cafe-imagen');
    await archivo.setInputFiles(IMAGEN_SVG);
    await expect(panel.getByText('La imagen debe ser JPG, PNG o WebP.')).toBeVisible();
    await archivo.setInputFiles({ name: 'enorme.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await expect(panel.getByText('La imagen no puede pesar más de 5 MB.')).toBeVisible();
    await archivo.setInputFiles(IMAGEN);
    await expect(panel.getByRole('img', { name: 'Vista previa de la imagen del café' })).toBeVisible();

    await panel.getByLabel('Nombre').fill(NOMBRE_CAFE);
    await panel.getByLabel('Variedad').selectOption({ label: 'Geisha' });
    await panel.getByLabel('Presentación').selectOption({ label: '340 g' });
    await panel.getByLabel('Origen').fill('Huila');
    await panel.getByLabel('Stock (unidades)').fill('7');
    await panel.getByLabel('Precio (COP)').fill('45000');
    await panel.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText(`Café «${NOMBRE_CAFE}» creado.`)).toBeVisible({ timeout: 30_000 });
    const fila = page.getByTestId('fila-cafe').filter({ hasText: NOMBRE_CAFE });
    await expect(fila).toContainText(/\$\s45\.000/);

    // La API guardó la imagen de Cloudinary.
    const creado = ((await (await request.get(`${API}/cafes`)).json()) as { nombre: string; imagenUrl: string; imagenPublicId: string }[]).find(
      (c) => c.nombre === NOMBRE_CAFE,
    )!;
    expect(creado.imagenUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(creado.imagenPublicId).toMatch(/^cafes\//);

    // ----- Se ve en la tienda al recargar -----
    await page.goto('/productos?q=e2e');
    const tarjeta = page.locator('app-tarjeta-cafe').filter({ hasText: NOMBRE_CAFE });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.locator('img')).toHaveAttribute('src', /res\.cloudinary\.com/);

    // ----- Editar -----
    await page.goto('/admin/inventario');
    await page.getByRole('button', { name: `Editar ${NOMBRE_CAFE} 340 g` }).click();
    const edicion = page.getByRole('dialog', { name: 'Editar café' });
    await expect(edicion.getByLabel('Nombre')).toHaveValue(NOMBRE_CAFE);
    await edicion.getByLabel('Stock (unidades)').fill('3');
    await edicion.getByLabel('Precio (COP)').fill('47000');
    await edicion.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Café «${NOMBRE_CAFE}» actualizado.`)).toBeVisible();

    await page.goto('/productos?q=e2e');
    await expect(tarjeta.locator('.precio')).toHaveText(/\$\s47\.000/);
    await expect(tarjeta.locator('.disponibilidad')).toHaveText('Quedan 3');

    // ----- Eliminar con confirmación -----
    await page.goto('/admin/inventario');
    await page.getByRole('button', { name: `Eliminar ${NOMBRE_CAFE} 340 g` }).click();
    const confirmacion = page.getByRole('dialog', { name: `¿Eliminar «${NOMBRE_CAFE}» (340 g)?` });
    await expect(confirmacion).toContainText('Esta acción es irreversible');
    await confirmacion.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText(`Café «${NOMBRE_CAFE}» eliminado.`)).toBeVisible();
    await expect(page.getByTestId('fila-cafe').filter({ hasText: NOMBRE_CAFE })).toHaveCount(0);

    // La imagen ya no existe en Cloudinary: una versión transformada nueva (nunca pedida,
    // así que no está en caché) responde 404.
    const urlNueva = creado.imagenUrl.replace('/upload/', `/upload/w_${Date.now() % 900 + 50},e_grayscale/`);
    await expect.poll(async () => (await request.get(urlNueva)).status(), { timeout: 30_000 }).toBe(404);

    await page.goto('/productos?q=e2e');
    await expect(page.getByRole('heading', { name: 'No hay cafés que coincidan con tu búsqueda' })).toBeVisible();
  });

  test('crear, editar y eliminar una variedad; no se elimina una con cafés', async ({ page }) => {
    await ingresar(page, admin);
    await page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Variedades' }).click();
    await expect(page).toHaveURL(/\/admin\/variedades$/);

    await page.getByRole('button', { name: 'Nueva variedad' }).click();
    const panel = page.getByRole('dialog', { name: 'Nueva variedad' });
    await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
    await panel.getByLabel('Descripción').fill('Creada por las pruebas.');
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Variedad «${NOMBRE_VARIEDAD}» creada.`)).toBeVisible();

    // Duplicada: 409 con el mensaje de la API dentro del panel.
    await page.getByRole('button', { name: 'Nueva variedad' }).click();
    await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expect(panel.getByRole('alert')).toHaveText(/Ya existe una variedad con ese nombre\./);
    await panel.getByRole('button', { name: 'Cancelar' }).click();

    await page.getByRole('button', { name: `Editar variedad ${NOMBRE_VARIEDAD}` }).click();
    const edicion = page.getByRole('dialog', { name: 'Editar variedad' });
    await edicion.getByLabel('Descripción').fill('Descripción editada por las pruebas.');
    await edicion.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Variedad «${NOMBRE_VARIEDAD}» actualizada.`)).toBeVisible();
    await expect(page.getByTestId('fila-variedad').filter({ hasText: NOMBRE_VARIEDAD })).toContainText('Descripción editada');

    // Castillo tiene cafés: la API responde 409 y el aviso lo explica.
    await page.getByRole('button', { name: 'Eliminar variedad Castillo' }).click();
    await page.getByRole('dialog', { name: '¿Eliminar la variedad «Castillo»?' }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('No se puede eliminar una variedad que tiene cafés asociados.')).toBeVisible();
    await expect(page.getByTestId('fila-variedad').filter({ hasText: 'Castillo' })).toHaveCount(1);

    await page.getByRole('button', { name: `Eliminar variedad ${NOMBRE_VARIEDAD}` }).click();
    await page.getByRole('dialog', { name: `¿Eliminar la variedad «${NOMBRE_VARIEDAD}»?` }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText(`Variedad «${NOMBRE_VARIEDAD}» eliminada.`)).toBeVisible();
    await expect(page.getByTestId('fila-variedad').filter({ hasText: NOMBRE_VARIEDAD })).toHaveCount(0);
  });

  test.describe('respuestas 403 y 401', () => {
    test('un 403 muestra "No tienes permiso para esta acción"', async ({ page }) => {
      await ingresar(page, admin);
      await expect(page).toHaveURL(/\/admin\/inventario$/);
      await page.goto('/admin/variedades');
      await page.route(`${API}/variedades`, (ruta) =>
        ruta.request().method() === 'POST' ? ruta.fulfill({ status: 403 }) : ruta.continue(),
      );
      await page.getByRole('button', { name: 'Nueva variedad' }).click();
      const panel = page.getByRole('dialog', { name: 'Nueva variedad' });
      await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
      await panel.getByRole('button', { name: 'Guardar' }).click();
      await expect(panel.getByRole('alert')).toHaveText(/No tienes permiso para esta acción\./);
    });

    test('un 401 cierra la sesión y lleva a /admin/ingresar', async ({ page }) => {
      await ingresar(page, admin);
      await expect(page).toHaveURL(/\/admin\/inventario$/);
      await page.goto('/admin/variedades');
      await page.route(`${API}/variedades`, (ruta) =>
        ruta.request().method() === 'POST' ? ruta.fulfill({ status: 401 }) : ruta.continue(),
      );
      await page.getByRole('button', { name: 'Nueva variedad' }).click();
      const panel = page.getByRole('dialog', { name: 'Nueva variedad' });
      await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
      await panel.getByRole('button', { name: 'Guardar' }).click();
      await expect(page).toHaveURL(/\/admin\/ingresar$/);
      await expect(page.getByText('Tu sesión terminó. Vuelve a ingresar para continuar.')).toBeVisible();
    });
  });

  test('axe-core sin violaciones en el panel (ingreso, inventario, formulario y variedades)', async ({ page }) => {
    const revisar = async (nombre: string) => {
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
      expect(resultado.violations.map((v) => `${nombre}: ${v.id}`)).toEqual([]);
    };
    await page.goto('/admin/ingresar');
    await revisar('ingresar');
    await ingresar(page, admin);
    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await expect(page.getByTestId('fila-cafe').first()).toBeVisible();
    await revisar('inventario');
    await page.getByRole('button', { name: 'Nuevo café' }).click();
    await expect(page.getByRole('dialog', { name: 'Nuevo café' })).toBeVisible();
    await revisar('formulario');
    await page.keyboard.press('Escape');
    await page.goto('/admin/variedades');
    await expect(page.getByTestId('fila-variedad').first()).toBeVisible();
    await revisar('variedades');
  });

  test('cerrar sesión vuelve al ingreso y protege el panel', async ({ page }) => {
    await ingresar(page, admin);
    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
    expect(await page.evaluate(() => sessionStorage.getItem('altura.sesion'))).toBeNull();
    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });
});
