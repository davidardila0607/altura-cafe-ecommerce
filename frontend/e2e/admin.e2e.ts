import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { API, esperarAnimaciones, expect, test } from './fixtures';

/*
 * Usuarios (Guía 1: registro, login y JWT) y panel de administración (/admin).
 *
 * La cuenta Administrador NO está en el código: se lee de variables de entorno.
 *   ALTURA_ADMIN_EMAIL, ALTURA_ADMIN_PASSWORD
 * Ese correo debe estar en "Admin:Correos" de appsettings.Development.json (por ejemplo
 * e2e-admin@altura.test) para que se registre como Administrador. Si la cuenta no existe,
 * las pruebas la registran por la API. Sin las variables, estas pruebas se omiten.
 *
 * El Cliente se registra desde /registro en cada ejecución, con un correo nuevo
 * (e2e-cliente-<número>@altura.test) y una contraseña aleatoria.
 *
 * Los cafés y variedades que se crean llevan "e2e" en el nombre y se borran al final.
 * Los usuarios e2e no se pueden borrar por la API: se borran en PostgreSQL (ver CLAUDE.md).
 */
const admin = { email: process.env['ALTURA_ADMIN_EMAIL'] ?? '', password: process.env['ALTURA_ADMIN_PASSWORD'] ?? '' };
const cliente = {
  nombre: 'Cliente e2e',
  email: `e2e-cliente-${Date.now()}@altura.test`,
  password: randomBytes(9).toString('base64url'),
};

const NOMBRE_CAFE = 'Prueba e2e Altura';
const NOMBRE_VARIEDAD = 'Variedad e2e';
const IMAGEN = '../backend/seed/imagenes/08-pitalito-reserva-340g.png';
const IMAGEN_SVG = '../backend/seed/imagenes/08-pitalito-reserva-340g.svg';

test.describe('Usuarios y panel de administración @una-vez', () => {
  test.describe.configure({ mode: 'serial' });
  // Las respuestas 400/401/403/409 que se provocan a propósito aparecen en la consola como
  // "Failed to load resource": son esperadas. Cualquier otro error de consola sigue fallando.
  test.use({ permitirErroresDeRed: true });
  test.skip(!admin.email || !admin.password, 'Define ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD para probar el panel.');

  /** Inicia sesión desde /login; `volver` es la página a la que regresa al entrar. */
  async function iniciarSesion(page: Page, cuenta: { email: string; password: string }, volver = '/admin'): Promise<void> {
    await page.goto(`/login?volver=${encodeURIComponent(volver)}`);
    await page.getByLabel('Correo electrónico').fill(cuenta.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(cuenta.password);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  }

  async function tokenAdmin(request: APIRequestContext): Promise<string> {
    const login = await request.post(`${API}/auth/Login`, { data: admin });
    expect(login.status(), 'La cuenta ALTURA_ADMIN_* debe poder iniciar sesión').toBe(200);
    return ((await login.json()) as { token: string }).token;
  }

  /** Borra por la API cualquier café o variedad de prueba que haya quedado (también si una prueba falla). */
  async function limpiar(request: APIRequestContext): Promise<void> {
    const headers = { Authorization: `Bearer ${await tokenAdmin(request)}` };
    const cafes = (await (await request.get(`${API}/cafes`)).json()) as { id: number; nombre: string }[];
    for (const cafe of cafes.filter((c) => c.nombre.includes('e2e'))) {
      await request.delete(`${API}/cafes/${cafe.id}`, { headers });
    }
    const variedades = (await (await request.get(`${API}/variedades`)).json()) as { id: number; nombre: string }[];
    for (const variedad of variedades.filter((v) => v.nombre.includes('e2e'))) {
      await request.delete(`${API}/variedades/${variedad.id}`, { headers });
    }
  }

  test.beforeAll(async ({ request }) => {
    // Registra la cuenta Administrador si todavía no existe (400 = ya existía).
    const registro = await request.post(`${API}/auth/Register`, {
      data: { nombre: 'Administración e2e', email: admin.email, password: admin.password },
    });
    expect([200, 400]).toContain(registro.status());
    await limpiar(request);
  });
  test.afterAll(async ({ request }) => limpiar(request));

  test('sin sesión, /admin lleva a /login y el footer tiene un acceso discreto', async ({ page }) => {
    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/login\?volver=%2Fadmin%2Finventario$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByText('Acceso administrador')).toHaveCount(0);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Acceso administrador' }).click();
    await expect(page).toHaveURL(/\/login\?volver=%2Fadmin$/);
  });

  test('registrar un Cliente desde /registro; repetir el correo muestra el mensaje del backend', async ({ page, request }) => {
    const llenar = async () => {
      await page.goto('/registro');
      await page.getByLabel('Nombre completo').fill(cliente.nombre);
      await page.getByLabel('Correo electrónico').fill(cliente.email);
      await page.getByLabel('Contraseña', { exact: true }).fill(cliente.password);
      await page.getByLabel('Confirmar contraseña').fill(cliente.password);
      await page.getByRole('button', { name: 'Registrarse' }).click();
    };

    await llenar();
    await expect(page).toHaveURL(/\/login\?cuenta=creada$/);
    await expect(page.getByRole('status')).toHaveText('Cuenta creada. Ahora inicia sesión.');

    // La API guardó el usuario: puede iniciar sesión.
    expect((await request.post(`${API}/auth/Login`, { data: cliente })).status()).toBe(200);

    await llenar();
    await expect(page.getByRole('alert')).toHaveText(/El usuario ya existe\./);
    await expect(page).toHaveURL(/\/registro$/);
  });

  test('una contraseña incorrecta muestra "Usuario o contraseña incorrectos."', async ({ page }) => {
    await iniciarSesion(page, { email: cliente.email, password: 'contrasena-incorrecta' });
    await expect(page.getByRole('alert')).toHaveText(/Usuario o contraseña incorrectos\./);
    await expect(page).toHaveURL(/\/login/);
  });

  test('el Cliente inicia sesión: el menú muestra su nombre, no muestra el panel y no puede entrar a /admin', async ({ page }) => {
    const navbar = page.getByRole('navigation', { name: 'Navegación principal' });
    await page.goto('/productos');
    await navbar.getByRole('link', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/login\?volver=%2Fproductos$/);
    await page.getByLabel('Correo electrónico').fill(cliente.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(cliente.password);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

    // Vuelve a la página anterior, con la inicial del nombre en el navbar.
    await expect(page).toHaveURL(/\/productos$/);
    const cuenta = page.getByRole('button', { name: `Cuenta de ${cliente.nombre}` });
    await expect(cuenta).toHaveText('C');
    await cuenta.click();
    await expect(cuenta).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByTestId('menu-cuenta');
    await expect(menu).toContainText(cliente.nombre);
    await expect(menu).toContainText(cliente.email);
    await expect(menu.getByRole('link', { name: 'Panel de administración' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(cuenta).toBeFocused();

    // La sesión sobrevive a una recarga (localStorage).
    await page.reload();
    await expect(cuenta).toBeVisible();

    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/login\?permiso=denegado$/);
    await expect(page.getByRole('status')).toContainText('No tienes permiso para entrar al panel de administración.');

    // Cerrar sesión desde el menú del navbar.
    await page.goto('/productos');
    await cuenta.click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(navbar.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('altura.sesion'))).toBeNull();
  });

  test('el Administrador entra al panel desde el menú, crea un café ("Creado por" con su nombre), lo edita y lo elimina', async ({ page, request }) => {
    await iniciarSesion(page, admin, '/');
    await expect(page).toHaveURL(/localhost:4200\/$/);
    const nombreAdmin = (await page.evaluate(() => JSON.parse(localStorage.getItem('altura.sesion') ?? '{}').nombre)) as string;
    await page.getByRole('button', { name: `Cuenta de ${nombreAdmin}` }).click();
    await page.getByTestId('menu-cuenta').getByRole('link', { name: 'Panel de administración' }).click();
    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await expect(page.getByTestId('usuario-admin')).toHaveText(nombreAdmin);

    // ----- Crear -----
    await page.getByRole('button', { name: 'Nuevo café' }).click();
    const panel = page.getByRole('dialog', { name: 'Nuevo café' });
    await expect(panel).toBeVisible();

    // Validaciones antes de enviar.
    await panel.getByRole('button', { name: 'Guardar' }).click();
    await expect(panel.getByText('Escribe el nombre del café (máximo 100 caracteres).')).toBeVisible();
    await expect(panel.getByText('Elige una variedad.')).toBeVisible();
    await expect(panel.getByText('Elige un proceso.')).toBeVisible();

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
    await panel.getByLabel('Proceso').selectOption({ label: 'Honey' });
    await panel.getByLabel('Presentación').selectOption({ label: '340 g' });
    await panel.getByLabel('Origen').fill('Huila');
    await panel.getByLabel('Stock (unidades)').fill('7');
    await panel.getByLabel('Precio (COP)').fill('45000');
    await panel.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText(`Café «${NOMBRE_CAFE}» creado.`)).toBeVisible({ timeout: 30_000 });
    const fila = page.getByTestId('fila-cafe').filter({ hasText: NOMBRE_CAFE });
    await expect(fila).toContainText(/\$\s45\.000/);
    await expect(fila).toContainText('Geisha · Honey · 340 g');
    // Guía 1: el dueño del café es quien inició sesión.
    await expect(fila.getByTestId('creado-por')).toHaveText(nombreAdmin);

    // La API guardó la imagen de Cloudinary y el dueño.
    const creado = (
      (await (await request.get(`${API}/cafes`)).json()) as {
        nombre: string;
        procesoNombre: string;
        imagenUrl: string;
        imagenPublicId: string;
        usuarioNombre: string;
      }[]
    ).find((c) => c.nombre === NOMBRE_CAFE)!;
    expect(creado.imagenUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(creado.imagenPublicId).toMatch(/^cafes\//);
    expect(creado.procesoNombre).toBe('Honey');
    expect(creado.usuarioNombre).toBe(nombreAdmin);

    // ----- Se ve en la tienda al recargar -----
    await page.goto('/productos?q=e2e');
    const tarjeta = page.locator('app-tarjeta-cafe').filter({ hasText: NOMBRE_CAFE });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.locator('img')).toHaveAttribute('src', /res\.cloudinary\.com/);
    await expect(tarjeta.locator('app-etiqueta-cafe')).toHaveText([/Geisha/, /Honey/]);

    // ----- Editar -----
    await page.goto('/admin/inventario');
    await page.getByRole('button', { name: `Editar ${NOMBRE_CAFE} 340 g` }).click();
    const edicion = page.getByRole('dialog', { name: 'Editar café' });
    await expect(edicion.getByLabel('Nombre')).toHaveValue(NOMBRE_CAFE);
    // El formulario de edición trae el proceso guardado; se cambia a Fermentado.
    await expect(edicion.getByLabel('Proceso').locator('option:checked')).toHaveText('Honey');
    await edicion.getByLabel('Proceso').selectOption({ label: 'Fermentado' });
    await edicion.getByLabel('Stock (unidades)').fill('3');
    await edicion.getByLabel('Precio (COP)').fill('47000');
    await edicion.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText(`Café «${NOMBRE_CAFE}» actualizado.`)).toBeVisible();
    // Editar no cambia el dueño.
    await expect(fila.getByTestId('creado-por')).toHaveText(nombreAdmin);

    await page.goto('/productos?q=e2e');
    await expect(tarjeta.locator('.precio')).toHaveText(/\$\s47\.000/);
    await expect(tarjeta.locator('.disponibilidad')).toHaveText('Quedan 3');
    await expect(tarjeta.locator('app-etiqueta-cafe')).toHaveText([/Geisha/, /Fermentado/]);

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
    const urlNueva = creado.imagenUrl.replace('/upload/', `/upload/w_${(Date.now() % 900) + 50},e_grayscale/`);
    await expect.poll(async () => (await request.get(urlNueva)).status(), { timeout: 30_000 }).toBe(404);

    await page.goto('/productos?q=e2e');
    await expect(page.getByRole('heading', { name: 'No hay cafés que coincidan con tu búsqueda' })).toBeVisible();
  });

  test('crear, editar y eliminar una variedad; no se elimina una con cafés', async ({ page, request }) => {
    await iniciarSesion(page, admin);
    await expect(page).toHaveURL(/\/admin\/inventario$/);
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

    // Con un café de la variedad (creado por la API), la API responde 409 y el aviso lo explica.
    const headers = { Authorization: `Bearer ${await tokenAdmin(request)}` };
    const variedades = (await (await request.get(`${API}/variedades`)).json()) as { id: number; nombre: string }[];
    const variedadId = variedades.find((v) => v.nombre === NOMBRE_VARIEDAD)!.id;
    const cafe = await request.post(`${API}/cafes`, {
      headers,
      data: { nombre: 'Café e2e de la variedad', variedadId, procesoId: 1, presentacionGramos: 340, origen: 'Huila', stock: 1, precio: 40000 },
    });
    expect(cafe.status()).toBe(201);
    const { id: cafeId } = (await cafe.json()) as { id: number };

    await page.getByRole('button', { name: `Eliminar variedad ${NOMBRE_VARIEDAD}` }).click();
    await page.getByRole('dialog', { name: `¿Eliminar la variedad «${NOMBRE_VARIEDAD}»?` }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('No se puede eliminar una variedad que tiene cafés asociados.')).toBeVisible();
    await expect(page.getByTestId('fila-variedad').filter({ hasText: NOMBRE_VARIEDAD })).toHaveCount(1);

    // Sin cafés ya se puede eliminar.
    expect((await request.delete(`${API}/cafes/${cafeId}`, { headers })).status()).toBe(204);
    await page.getByRole('button', { name: `Eliminar variedad ${NOMBRE_VARIEDAD}` }).click();
    await page.getByRole('dialog', { name: `¿Eliminar la variedad «${NOMBRE_VARIEDAD}»?` }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText(`Variedad «${NOMBRE_VARIEDAD}» eliminada.`)).toBeVisible();
    await expect(page.getByTestId('fila-variedad').filter({ hasText: NOMBRE_VARIEDAD })).toHaveCount(0);
  });

  test.describe('respuestas 403 y 401', () => {
    test('un 403 muestra "No tienes permiso para esta acción"', async ({ page }) => {
      await iniciarSesion(page, admin, '/admin/variedades');
      await expect(page).toHaveURL(/\/admin\/variedades$/);
      await page.route(`${API}/variedades`, (ruta) =>
        ruta.request().method() === 'POST' ? ruta.fulfill({ status: 403 }) : ruta.continue(),
      );
      await page.getByRole('button', { name: 'Nueva variedad' }).click();
      const panel = page.getByRole('dialog', { name: 'Nueva variedad' });
      await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
      await panel.getByRole('button', { name: 'Guardar' }).click();
      await expect(panel.getByRole('alert')).toHaveText(/No tienes permiso para esta acción\./);
    });

    test('un 401 cierra la sesión y lleva a /login', async ({ page }) => {
      await iniciarSesion(page, admin, '/admin/variedades');
      await expect(page).toHaveURL(/\/admin\/variedades$/);
      await page.route(`${API}/variedades`, (ruta) =>
        ruta.request().method() === 'POST' ? ruta.fulfill({ status: 401 }) : ruta.continue(),
      );
      await page.getByRole('button', { name: 'Nueva variedad' }).click();
      const panel = page.getByRole('dialog', { name: 'Nueva variedad' });
      await panel.getByLabel('Nombre').fill(NOMBRE_VARIEDAD);
      await panel.getByRole('button', { name: 'Guardar' }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('status')).toHaveText('Tu sesión terminó. Vuelve a iniciar sesión.');
      expect(await page.evaluate(() => localStorage.getItem('altura.sesion'))).toBeNull();
    });
  });

  test('axe-core sin violaciones (login con aviso, menú de cuenta, inventario, formulario y variedades)', async ({ page }) => {
    const revisar = async (nombre: string) => {
      await esperarAnimaciones(page);
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
      expect(resultado.violations.map((v) => `${nombre}: ${v.id}`)).toEqual([]);
    };
    await page.goto('/login?cuenta=creada');
    await expect(page.getByRole('status')).toBeVisible();
    await revisar('login');

    await iniciarSesion(page, admin, '/productos');
    await expect(page).toHaveURL(/\/productos$/);
    await page.getByRole('button', { name: /^Cuenta de / }).click();
    await expect(page.getByTestId('menu-cuenta')).toBeVisible();
    await revisar('menú de cuenta');

    await page.goto('/admin/inventario');
    await expect(page.getByRole('table')).toBeVisible();
    await revisar('inventario');
    await page.getByRole('button', { name: 'Nuevo café' }).click();
    await expect(page.getByRole('dialog', { name: 'Nuevo café' })).toBeVisible();
    await revisar('formulario');
    await page.keyboard.press('Escape');
    await page.goto('/admin/variedades');
    await expect(page.getByTestId('fila-variedad').first()).toBeVisible();
    await revisar('variedades');
  });

  test('cerrar sesión en el panel lleva a /login y protege el panel', async ({ page }) => {
    await iniciarSesion(page, admin);
    await expect(page).toHaveURL(/\/admin\/inventario$/);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('altura.sesion'))).toBeNull();
    await page.goto('/admin/inventario');
    await expect(page).toHaveURL(/\/login\?volver=%2Fadmin%2Finventario$/);
  });
});
