import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Locator, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { API, esperarAnimaciones, expect, limpiar, llenarEnvio, test } from './fixtures';

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

    // "Confirmar pedido" pide los datos de envío; sin llenarlos, el formulario marca los errores.
    await page.getByRole('button', { name: 'Carrito, 2 unidades' }).click();
    const panel = page.getByRole('dialog', { name: 'Tu carrito' });
    await panel.getByTestId('confirmar-pedido').click();
    const formulario = page.getByRole('dialog', { name: 'Datos de envío' });
    await expect(formulario).toBeVisible();
    expect(limpiar(await formulario.locator('.resumen').textContent())).toBe(
      'Se creará un pedido con 2 productos por $ 95.000. Tu carrito quedará vacío y podrás pagarlo enseguida.',
    );
    await formulario.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(formulario.getByText('Escribe la dirección de entrega (máximo 200 caracteres).')).toBeVisible();
    await expect(formulario.getByLabel('Dirección')).toBeFocused();
    await formulario.getByLabel('Teléfono de contacto').fill('12ab');
    await expect(formulario.getByText('Escribe un teléfono de 7 a 15 dígitos, solo números.')).toBeVisible();
    await revisarAxe(page, 'datos de envío con errores');
    await llenarEnvio(page);

    // Si la API rechaza el pedido (409), el formulario muestra su mensaje y el carrito queda igual.
    await page.route(`${API}/Pedido/CrearPedido`, (ruta) =>
      ruta.fulfill({ status: 409, json: { mensaje: 'No hay stock suficiente de Pitalito (disponibles: 0).' } }),
    );
    await formulario.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(formulario.getByRole('alert')).toHaveText(/No hay stock suficiente de Pitalito/);
    await expect(panel.getByTestId('linea-carrito')).toHaveCount(2);
    await expect(contador(page)).toHaveText('2');
    await page.unroute(`${API}/Pedido/CrearPedido`);

    // Ahora sí: el pedido se crea con la dirección y lleva a su detalle, con el botón "Pagar".
    await formulario.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page).toHaveURL(/\/mis-pedidos\/\d+$/);
    pedidoId = Number(page.url().split('/').pop());
    await expect(page.getByTestId('aviso').filter({ hasText: 'Pedido creado' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido #${pedidoId}`);
    await expect(page.getByRole('main').getByTestId('estado-pedido')).toHaveText('Pendiente');
    await expect(page.getByText(`Referencia PEDIDO-${pedidoId}`)).toBeVisible();
    await expect(page.getByTestId('pago-pendiente')).toContainText('Pago pendiente.');
    await expect(page.getByTestId('pago-pendiente').getByTestId('boton-pagar')).toHaveText(/Pagar/);
    await expect(page.getByTestId('linea-pedido')).toHaveCount(2);
    await expect(page.getByTestId('linea-pedido').filter({ hasText: 'Mesa de los Santos' })).toContainText(/1 ×\s\$\s46\.000/);
    await expect(page.getByTestId('total-pedido')).toHaveText(/\$\s95\.000/);
    const envio = page.getByTestId('envio-pedido');
    await expect(envio).toContainText('Calle 45 # 12-30, apto 402');
    await expect(envio).toContainText('Bucaramanga, Santander');
    await expect(envio).toContainText('Teléfono 3001234567');
    await expect(envio).toContainText('Notas: Dejar en portería');
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
    // El pedido pendiente tiene "Pagar" en su fila (fuera del enlace al detalle).
    await expect(fila.locator('..').getByTestId('boton-pagar')).toHaveText(/Pagar/);
    await revisarAxe(page, 'mis pedidos');
    await fila.click();
    await expect(page).toHaveURL(new RegExp(`/mis-pedidos/${pedidoId}$`));

    // Un Cliente no entra al historial del panel (ni por la ruta vieja).
    await page.goto('/admin/historial');
    await expect(page).toHaveURL(/\/login\?permiso=denegado$/);
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

    test('la ruta vieja /admin/pedidos lleva al historial, que muestra el pedido pendiente', async ({ page }) => {
      await iniciarSesion(page, admin, '/admin/historial');
      await page.goto('/admin/pedidos');
      await expect(page).toHaveURL(/\/admin\/historial$/);
      await expect(page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');

      const fila = page.getByTestId('fila-historial').filter({ hasText: `PEDIDO-${pedidoId}` });
      await expect(fila).toContainText(clienteA.nombre);
      await expect(fila).toContainText(clienteA.email);
      await expect(fila).toContainText('Pendiente');
      await expect(fila).toContainText(/\$\s95\.000/);

      // Filtro por estado: el pedido está Pendiente.
      const estados = page.getByRole('group', { name: 'Estado' });
      await estados.getByRole('button', { name: 'Pendiente' }).click();
      await expect(estados.getByRole('button', { name: 'Pendiente' })).toHaveAttribute('aria-pressed', 'true');
      await expect(fila).toBeVisible();
      await estados.getByRole('button', { name: 'Pagado' }).click();
      await expect(fila).toHaveCount(0);
      await estados.getByRole('button', { name: 'Todos' }).click();
      await expect(fila).toBeVisible();

      // A 375 px no hay desplazamiento horizontal (la navegación del panel tiene cuatro secciones).
      await page.setViewportSize({ width: 375, height: 812 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  });
});
