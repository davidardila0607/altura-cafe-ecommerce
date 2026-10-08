import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Locator, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { API, esperarAnimaciones, expect, limpiar, test } from './fixtures';

/*
 * Guía de pedidos: confirmar el pedido desde el carrito, Mis pedidos y pedidos en el panel.
 *
 * - Dos Clientes se registran con correos nuevos (e2e-pedidos-<número>@altura.test) y contraseñas
 *   aleatorias. El pedido usa cafés del catálogo: no cambia su stock (esta guía no lo descuenta).
 * - Las pruebas del panel necesitan ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD (como admin.e2e.ts).
 * - Los pedidos no se pueden borrar por la API: después de las pruebas se borran en PostgreSQL
 *   junto con los usuarios de prueba (ver CLAUDE.md).
 */
const admin = { email: process.env['ALTURA_ADMIN_EMAIL'] ?? '', password: process.env['ALTURA_ADMIN_PASSWORD'] ?? '' };
const marca = Date.now();
const clienteA = { nombre: 'Compradora pedidos e2e', email: `e2e-pedidos-a-${marca}@altura.test`, password: randomBytes(9).toString('base64url') };
const clienteB = { nombre: 'Curioso pedidos e2e', email: `e2e-pedidos-b-${marca}@altura.test`, password: randomBytes(9).toString('base64url') };

/** Id del pedido que crea el Cliente A (lo usan las pruebas siguientes). */
let pedidoId = 0;

const tarjeta = (page: Page, nombre: string, gramos: number): Locator =>
  page
    .getByTestId('catalogo')
    .locator('app-tarjeta-cafe')
    .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) })
    .filter({ hasText: `${gramos} g` });

const contador = (page: Page) => page.getByTestId('contador-carrito');

async function registrar(request: APIRequestContext, cuenta: typeof clienteA): Promise<void> {
  const respuesta = await request.post(`${API}/auth/Register`, { data: cuenta });
  expect(respuesta.status()).toBe(200);
}

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
  expect(resultado.violations.map((v) => `${nombre}: ${v.id} en ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe('Pedidos sin sesión', () => {
  test('/mis-pedidos lleva a /login', async ({ page }) => {
    await page.goto('/mis-pedidos');
    await expect(page).toHaveURL(/\/login\?volver=%2Fmis-pedidos$/);
    await page.goto('/mis-pedidos/1');
    await expect(page).toHaveURL(/\/login\?volver=%2Fmis-pedidos%2F1$/);
  });
});

test.describe('Pedidos del Cliente y del panel @una-vez', () => {
  test.describe.configure({ mode: 'serial' });
  // El 409 simulado y el 404 del pedido ajeno dejan "Failed to load resource" en la consola.
  test.use({ permitirErroresDeRed: true });

  test.beforeAll(async ({ request }) => {
    await registrar(request, clienteA);
    await registrar(request, clienteB);
  });

  test('el Cliente confirma el pedido desde el carrito y lo ve en Mis pedidos', async ({ page }) => {
    await iniciarSesion(page, clienteA, '/productos');
    await expect(page.getByTestId('catalogo').locator('app-tarjeta-cafe')).toHaveCount(25);

    // Dos cafés: Mesa de los Santos 340 g (46.000) y Pitalito 340 g (49.000).
    await tarjeta(page, 'Mesa de los Santos', 340).getByRole('button', { name: 'Agregar Mesa de los Santos 340 g al carrito' }).click();
    await expect(contador(page)).toHaveText('1');
    await tarjeta(page, 'Pitalito', 340).getByRole('button', { name: 'Agregar Pitalito 340 g al carrito' }).click();
    await expect(contador(page)).toHaveText('2');

    // Si la API rechaza el pedido (409), se muestra su mensaje y el carrito queda igual.
    await page.route(`${API}/Pedido/CrearPedido`, (ruta) =>
      ruta.fulfill({ status: 409, json: { mensaje: 'No hay stock suficiente de Pitalito (disponibles: 0).' } }),
    );
    await page.getByRole('button', { name: 'Carrito, 2 unidades' }).click();
    const panel = page.getByRole('dialog', { name: 'Tu carrito' });
    await panel.getByTestId('confirmar-pedido').click();
    const confirmacion = page.getByRole('dialog', { name: '¿Confirmar el pedido?' });
    await expect(confirmacion).toBeVisible();
    expect(limpiar(await confirmacion.locator('p').textContent())).toBe(
      'Se creará un pedido con 2 productos por $ 95.000. Tu carrito quedará vacío.',
    );
    await revisarAxe(page, 'confirmación del pedido');
    await confirmacion.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(panel.getByRole('alert')).toHaveText(/No hay stock suficiente de Pitalito/);
    await expect(panel.getByTestId('linea-carrito')).toHaveCount(2);
    await expect(contador(page)).toHaveText('2');
    await page.unroute(`${API}/Pedido/CrearPedido`);

    // Ahora sí: el pedido se crea y lleva a su detalle.
    await panel.getByTestId('confirmar-pedido').click();
    await confirmacion.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page).toHaveURL(/\/mis-pedidos\/\d+$/);
    pedidoId = Number(page.url().split('/').pop());
    await expect(page.getByTestId('aviso').filter({ hasText: 'Pedido creado' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido #${pedidoId}`);
    await expect(page.getByRole('main').getByTestId('estado-pedido')).toHaveText('Pendiente');
    await expect(page.getByTestId('pago-pendiente')).toHaveText(/Pago pendiente\. El pago en línea estará disponible pronto\./);
    await expect(page.getByTestId('linea-pedido')).toHaveCount(2);
    await expect(page.getByTestId('linea-pedido').filter({ hasText: 'Mesa de los Santos' })).toContainText(/1 ×\s\$\s46\.000/);
    await expect(page.getByTestId('total-pedido')).toHaveText(/\$\s95\.000/);
    await expect(contador(page)).toHaveCount(0); // el carrito quedó vacío
    await revisarAxe(page, 'detalle del pedido');

    // Mis pedidos, desde el menú de la cuenta.
    await page.getByRole('button', { name: `Cuenta de ${clienteA.nombre}` }).click();
    await page.getByTestId('menu-cuenta').getByRole('link', { name: 'Mis pedidos' }).click();
    await expect(page).toHaveURL(/\/mis-pedidos$/);
    const fila = page.getByTestId('fila-pedido');
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText(`Pedido #${pedidoId}`);
    await expect(fila).toContainText('Pendiente');
    await expect(fila).toContainText('2 productos');
    await expect(fila).toContainText(/\$\s95\.000/);
    await revisarAxe(page, 'mis pedidos');
    await fila.click();
    await expect(page).toHaveURL(new RegExp(`/mis-pedidos/${pedidoId}$`));

    // Un Cliente no entra a los pedidos del panel.
    await page.goto('/admin/pedidos');
    await expect(page).toHaveURL(/\/login\?permiso=denegado$/);
  });

  test('otro Cliente no puede abrir ese pedido y ve su lista vacía', async ({ page }) => {
    await iniciarSesion(page, clienteB, `/mis-pedidos/${pedidoId}`);
    await expect(page.getByTestId('pedido-no-encontrado')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pedido no encontrado');
    await revisarAxe(page, 'pedido no encontrado');
    await page.getByRole('link', { name: 'Ver mis pedidos' }).click();
    await expect(page.getByTestId('pedidos-vacio')).toContainText('Todavía no tienes pedidos');
    await expect(page.getByTestId('pedidos-vacio').getByRole('link', { name: 'Ver cafés' })).toHaveAttribute('href', '/productos');
    await revisarAxe(page, 'mis pedidos vacío');
  });

  test.describe('con el Administrador', () => {
    test.skip(!admin.email || !admin.password, 'Define ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD para probar el panel.');

    test.beforeAll(async ({ request }) => {
      const registro = await request.post(`${API}/auth/Register`, {
        data: { nombre: 'Administración e2e', email: admin.email, password: admin.password },
      });
      expect([200, 400]).toContain(registro.status());
    });

    test('/admin/pedidos muestra el pedido con el cliente, filtra por estado y despliega el detalle', async ({ page }) => {
      await iniciarSesion(page, admin, '/admin/pedidos');
      await expect(page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page');

      const fila = page.getByTestId('fila-pedido-admin').filter({ hasText: `#${pedidoId}` });
      await expect(fila).toContainText(clienteA.nombre);
      await expect(fila).toContainText(clienteA.email);
      await expect(fila).toContainText('Pendiente');
      await expect(fila).toContainText(/\$\s95\.000/);

      // Detalle desplegable.
      const boton = fila.getByRole('button', { name: `Detalle del pedido ${pedidoId}` });
      await expect(boton).toHaveAttribute('aria-expanded', 'false');
      await boton.click();
      await expect(boton).toHaveAttribute('aria-expanded', 'true');
      const detalle = page.getByTestId('detalle-pedido-admin');
      await expect(detalle).toContainText('Mesa de los Santos');
      await expect(detalle).toContainText('Pitalito');
      await revisarAxe(page, 'pedidos del panel');

      // Filtro por estado.
      const filtro = page.getByRole('group', { name: 'Filtrar por estado' });
      await filtro.getByRole('button', { name: /^Pendiente/ }).click();
      await expect(filtro.getByRole('button', { name: /^Pendiente/ })).toHaveAttribute('aria-pressed', 'true');
      await expect(fila).toBeVisible();
      await filtro.getByRole('button', { name: /^Rechazado/ }).click();
      await expect(page.getByTestId('fila-pedido-admin')).toHaveCount(0);
      await expect(page.getByText('No hay pedidos en estado Rechazado.')).toBeVisible();
      await filtro.getByRole('button', { name: /^Todos/ }).click();
      await expect(fila).toBeVisible();

      // A 375 px no hay desplazamiento horizontal (la navegación del panel tiene cuatro secciones).
      await page.setViewportSize({ width: 375, height: 812 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});
