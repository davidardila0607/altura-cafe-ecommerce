import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Locator, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { API, esperarAnimaciones, expect, limpiar, test } from './fixtures';

/*
 * Guía 2: carrito de compras y administración de usuarios.
 *
 * - El Cliente se registra desde /registro con un correo nuevo (e2e-carrito-<número>@altura.test)
 *   y una contraseña aleatoria; usa cafés del catálogo (no cambia su stock: el carrito no lo descuenta).
 * - Las pruebas con el Administrador necesitan ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD
 *   (igual que admin.e2e.ts); sin ellas se omiten. El café de prueba lleva "e2e" y se borra al final.
 * - Los usuarios de prueba se borran después en PostgreSQL (ver CLAUDE.md); sus carritos se van con ellos.
 */
const admin = { email: process.env['ALTURA_ADMIN_EMAIL'] ?? '', password: process.env['ALTURA_ADMIN_PASSWORD'] ?? '' };
const cliente = {
  nombre: 'Compradora e2e',
  email: `e2e-carrito-${Date.now()}@altura.test`,
  password: randomBytes(9).toString('base64url'),
};
const CAFE_PROPIO = 'Café e2e del carrito';

const tarjeta = (page: Page, nombre: string, gramos: number): Locator =>
  page
    .getByTestId('catalogo')
    .locator('app-tarjeta-cafe')
    .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) })
    .filter({ hasText: `${gramos} g` });

const contador = (page: Page) => page.getByTestId('contador-carrito');

async function iniciarSesion(page: Page, cuenta: { email: string; password: string }, volver: string): Promise<void> {
  await page.goto(`/login?volver=${encodeURIComponent(volver)}`);
  await page.getByLabel('Correo electrónico').fill(cuenta.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(cuenta.password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(volver.replace(/[?]/g, '\\?') + '$'));
}

async function revisarAxe(page: Page, nombre: string): Promise<void> {
  await esperarAnimaciones(page);
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(resultado.violations.map((v) => `${nombre}: ${v.id}`)).toEqual([]);
}

async function tokenAdmin(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/auth/Login`, { data: admin });
  expect(login.status(), 'La cuenta ALTURA_ADMIN_* debe poder iniciar sesión').toBe(200);
  return ((await login.json()) as { token: string }).token;
}

/** Borra los cafés de prueba de este archivo (también si una prueba falla). */
async function borrarCafePropio(request: APIRequestContext): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenAdmin(request)}` };
  const cafes = (await (await request.get(`${API}/cafes`)).json()) as { id: number; nombre: string }[];
  for (const cafe of cafes.filter((c) => c.nombre === CAFE_PROPIO)) {
    await request.delete(`${API}/cafes/${cafe.id}`, { headers });
  }
}

test.describe('Carrito sin sesión', () => {
  test('"Agregar" y el ícono del carrito llevan a /login', async ({ page }) => {
    await page.goto('/productos');
    await expect(page.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(25);
    await expect(contador(page)).toHaveCount(0);

    await tarjeta(page, 'Mesa de los Santos', 340).getByRole('button', { name: 'Agregar Mesa de los Santos 340 g al carrito' }).click();
    await expect(page).toHaveURL(/\/login\?volver=%2Fproductos$/);

    await page.goto('/productos');
    await page.getByRole('link', { name: 'Carrito (inicia sesión para usarlo)' }).click();
    await expect(page).toHaveURL(/\/login\?volver=%2Fproductos$/);

    // /carrito está protegida.
    await page.goto('/carrito');
    await expect(page).toHaveURL(/\/login\?volver=%2Fcarrito$/);
  });
});

test.describe('Carrito del Cliente y usuarios @una-vez', () => {
  test.describe.configure({ mode: 'serial' });

  test('el Cliente se registra, agrega cafés, cambia cantidades, quita y vacía el carrito', async ({ page }) => {
    // Registro e inicio de sesión.
    await page.goto('/registro');
    await page.getByLabel('Nombre completo').fill(cliente.nombre);
    await page.getByLabel('Correo electrónico').fill(cliente.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(cliente.password);
    await page.getByLabel('Confirmar contraseña').fill(cliente.password);
    await page.getByRole('button', { name: 'Registrarse' }).click();
    await expect(page).toHaveURL(/\/login\?cuenta=creada$/);
    await iniciarSesion(page, cliente, '/productos');
    await expect(page.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(25);
    await expect(page.getByRole('button', { name: 'Carrito, vacío' })).toBeVisible();
    await expect(contador(page)).toHaveCount(0);

    // Desde una card: 2 unidades de Mesa de los Santos 340 g (46.000 c/u).
    const mesa = tarjeta(page, 'Mesa de los Santos', 340);
    await mesa.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await mesa.getByRole('button', { name: 'Agregar Mesa de los Santos 340 g al carrito' }).click();
    const aviso = page.getByTestId('aviso').filter({ hasText: 'Agregado al carrito' });
    await expect(aviso).toBeVisible();
    await expect(aviso.getByRole('link', { name: 'Ver carrito' })).toHaveAttribute('href', '/carrito');
    await expect(contador(page)).toHaveText('2');

    // Desde la vista rápida: Inzá Reserva 340 g tiene 5 unidades (132.000 c/u).
    await page.getByRole('button', { name: 'Ver producto Inzá Reserva 340 g' }).click();
    const vista = page.getByRole('dialog', { name: 'Inzá Reserva' });
    await expect(vista).toBeVisible();
    await page.waitForFunction(() => !document.documentElement.classList.contains('transicion-vuelo'));
    await vista.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(vista.locator('app-agregar-carrito .mensaje')).toContainText('Agregado al carrito.');
    await expect(contador(page)).toHaveText('3');

    // Quedan 4 por agregar: el selector no pasa de 4.
    const aumentar = vista.getByRole('button', { name: 'Aumentar cantidad' });
    for (let i = 0; i < 3; i++) await aumentar.click();
    await expect(vista.locator('output')).toHaveText('4');
    await expect(aumentar).toBeDisabled();
    await vista.getByRole('button', { name: 'Agregar al carrito' }).click();
    await expect(contador(page)).toHaveText('7');
    await expect(vista.getByTestId('agregar-carrito')).toHaveText('Ya tienes todas las unidades disponibles');
    await expect(vista.getByTestId('agregar-carrito')).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(vista).toBeHidden();

    // Panel lateral.
    await page.getByRole('button', { name: 'Carrito, 7 unidades' }).click();
    const panel = page.getByRole('dialog', { name: 'Tu carrito' });
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('linea-carrito')).toHaveCount(2);
    await expect(panel.getByTestId('total-carrito')).toHaveText(/\$\s752\.000/);
    await revisarAxe(page, 'panel del carrito');
    await panel.getByRole('link', { name: 'Ver carrito completo' }).click();
    await expect(page).toHaveURL(/\/carrito$/);
    await expect(panel).toBeHidden();

    // Página /carrito: cantidades, subtotales y total en COP (dentro de <main>, no en el panel).
    const pagina = page.getByRole('main');
    const lineas = pagina.getByTestId('linea-carrito');
    const inza = lineas.filter({ hasText: 'Inzá Reserva' });
    const mesaLinea = lineas.filter({ hasText: 'Mesa de los Santos' });
    await expect(pagina.getByTestId('total-unidades')).toHaveText('7');
    await expect(pagina.getByTestId('total-carrito')).toHaveText(/\$\s752\.000/);
    expect(limpiar(await inza.getByTestId('subtotal').textContent())).toBe('Subtotal: $ 660.000');
    await expect(inza).toContainText('Geisha · Fermentado · 340 g');
    await expect(inza).toContainText(/\$\s132\.000\s+c\/u/);
    await expect(inza.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled(); // 5 = stock

    await inza.getByRole('button', { name: 'Disminuir cantidad' }).click();
    await expect(pagina.getByTestId('total-unidades')).toHaveText('6');
    await expect(pagina.getByTestId('total-carrito')).toHaveText(/\$\s620\.000/);
    await mesaLinea.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await expect(pagina.getByTestId('total-unidades')).toHaveText('7');
    await expect(contador(page)).toHaveText('7');
    await revisarAxe(page, 'página del carrito');

    // El carrito vive en la base de datos: sobrevive a recargar.
    await page.reload();
    await expect(pagina.getByTestId('total-unidades')).toHaveText('7');
    await expect(pagina.getByTestId('total-carrito')).toHaveText(/\$\s666\.000/);

    // Quitar un café.
    await pagina.getByRole('button', { name: 'Quitar Mesa de los Santos del carrito' }).click();
    await expect(lineas).toHaveCount(1);
    await expect(contador(page)).toHaveText('4');

    // Vaciar con confirmación.
    await pagina.getByRole('button', { name: 'Vaciar carrito' }).click();
    const confirmacion = page.getByRole('dialog', { name: '¿Vaciar el carrito?' });
    await expect(confirmacion).toBeVisible();
    await confirmacion.getByRole('button', { name: 'Vaciar carrito' }).click();
    await expect(pagina.getByTestId('carrito-vacio')).toContainText('Tu carrito está vacío');
    await expect(pagina.getByTestId('carrito-vacio').getByRole('link', { name: 'Ver cafés' })).toHaveAttribute('href', '/productos');
    await expect(contador(page)).toHaveCount(0);

    // Un Cliente no entra a la administración de usuarios.
    await page.goto('/admin/usuarios');
    await expect(page).toHaveURL(/\/login\?permiso=denegado$/);
  });

  test.describe('con el Administrador', () => {
    test.skip(!admin.email || !admin.password, 'Define ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD para probar el panel.');
    test.use({ permitirErroresDeRed: true });

    test.beforeAll(async ({ request }) => {
      const registro = await request.post(`${API}/auth/Register`, {
        data: { nombre: 'Administración e2e', email: admin.email, password: admin.password },
      });
      expect([200, 400]).toContain(registro.status());
      await borrarCafePropio(request);
      const creado = await request.post(`${API}/cafes`, {
        headers: { Authorization: `Bearer ${await tokenAdmin(request)}` },
        data: { nombre: CAFE_PROPIO, variedadId: 1, procesoId: 1, presentacionGramos: 340, origen: 'Huila', stock: 3, precio: 50000 },
      });
      expect(creado.status()).toBe(201);
    });
    test.afterAll(async ({ request }) => borrarCafePropio(request));

    test('el dueño de un café ve "Este café es tuyo"', async ({ page }) => {
      await iniciarSesion(page, admin, '/productos?q=e2e');
      const propio = tarjeta(page, CAFE_PROPIO, 340);
      await expect(propio.getByTestId('agregar-carrito')).toHaveText('Este café es tuyo');
      await expect(propio.getByTestId('agregar-carrito')).toBeDisabled();
    });

    test('/admin/usuarios: busca, cambia el rol de un usuario con confirmación y no deja cambiar el propio', async ({ page }) => {
      await iniciarSesion(page, admin, '/admin/usuarios');
      await expect(page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Usuarios' })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('note')).toHaveText(/El nuevo rol se aplica la próxima vez que el usuario inicie sesión\./);

      // La propia fila tiene el botón deshabilitado.
      await page.getByLabel('Buscar usuarios').fill(admin.email);
      const propia = page.getByTestId('fila-usuario');
      await expect(propia).toHaveCount(1);
      await expect(propia).toContainText('(tú)');
      await expect(propia.getByRole('button')).toBeDisabled();

      // Buscar al Cliente de prueba (sin tildes ni mayúsculas) y hacerlo Administrador.
      await page.getByLabel('Buscar usuarios').fill('COMPRADORA');
      const fila = page.getByTestId('fila-usuario').filter({ hasText: cliente.email });
      await expect(fila).toContainText('Cliente');
      await expect(fila).toContainText('0 cafés');
      await revisarAxe(page, 'usuarios');
      await fila.getByRole('button', { name: `Hacer Administrador a ${cliente.nombre}` }).click();
      const confirmacion = page.getByRole('dialog', { name: `¿Cambiar el rol de ${cliente.nombre} a Administrador?` });
      await expect(confirmacion).toContainText('El cambio se aplica la próxima vez que inicie sesión.');
      await confirmacion.getByRole('button', { name: 'Cambiar rol' }).click();
      await expect(page.getByText(`${cliente.nombre} ahora es Administrador.`)).toBeVisible();
      await expect(fila.locator('.rol')).toHaveText(/Administrador/);

      // Y de vuelta a Cliente.
      await fila.getByRole('button', { name: `Hacer Cliente a ${cliente.nombre}` }).click();
      await page.getByRole('dialog', { name: /a Cliente\?$/ }).getByRole('button', { name: 'Cambiar rol' }).click();
      await expect(fila.locator('.rol')).toHaveText(/Cliente/);
    });
  });
});
