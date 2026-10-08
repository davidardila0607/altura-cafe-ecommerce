import AxeBuilder from '@axe-core/playwright';
import { APIRequestContext, Locator, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { API, esperarAnimaciones, expect, llenarEnvio, test } from './fixtures';

/*
 * Guía 3 (Wompi en modo simulación) e historial de compras.
 *
 * - Un Cliente nuevo compra con la pasarela de pruebas: un pedido aprobado y otro rechazado y
 *   reintentado. Los pagos aprobados DESCUENTAN STOCK de cafés reales del catálogo, así que estas
 *   pruebas necesitan la cuenta Administrador de pruebas (ALTURA_ADMIN_EMAIL y
 *   ALTURA_ADMIN_PASSWORD) para devolver el stock al terminar; sin ellas se omiten.
 * - La API debe tener WompiSettings:ModoSimulado = true (el valor de appsettings).
 * - Los pedidos y el usuario de prueba se borran después en PostgreSQL (ver CLAUDE.md).
 */
const admin = { email: process.env['ALTURA_ADMIN_EMAIL'] ?? '', password: process.env['ALTURA_ADMIN_PASSWORD'] ?? '' };
const cliente = {
  nombre: 'Compradora pagos e2e',
  email: `e2e-pagos-${Date.now()}@altura.test`,
  password: randomBytes(9).toString('base64url'),
};

/** Cafés que se compran (nombre, gramos) y su stock original, para restaurarlo. */
const COMPRAS = [
  { nombre: 'Pitalito', gramos: 340 },
  { nombre: 'La Unión', gramos: 340 },
];
interface CafeApi {
  id: number;
  nombre: string;
  presentacionGramos: number;
  stock: number;
  [clave: string]: unknown;
}
const originales: CafeApi[] = [];

const tarjeta = (page: Page, nombre: string, gramos: number): Locator =>
  page
    .getByTestId('catalogo')
    .locator('app-tarjeta-cafe')
    .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) })
    .filter({ hasText: `${gramos} g` });

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
  expect(resultado.violations.map((v) => `${nombre}: ${v.id} en ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function tokenAdmin(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/auth/Login`, { data: admin });
  expect(login.status(), 'La cuenta ALTURA_ADMIN_* debe poder iniciar sesión').toBe(200);
  return ((await login.json()) as { token: string }).token;
}

async function cafesDelCatalogo(request: APIRequestContext): Promise<CafeApi[]> {
  const todos = (await (await request.get(`${API}/cafes`)).json()) as CafeApi[];
  return COMPRAS.map((c) => todos.find((x) => x.nombre === c.nombre && x.presentacionGramos === c.gramos)!);
}

/** Confirma el pedido del carrito con los datos de envío y devuelve su número. */
async function confirmarPedido(page: Page): Promise<number> {
  await page.goto('/carrito');
  await page.getByRole('main').getByTestId('confirmar-pedido').click();
  await llenarEnvio(page);
  await page.getByRole('dialog', { name: 'Datos de envío' }).getByRole('button', { name: 'Confirmar pedido' }).click();
  await expect(page).toHaveURL(/\/mis-pedidos\/\d+$/);
  return Number(page.url().split('/').pop());
}

test.describe('Pago con la pasarela de pruebas e historial @una-vez', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!admin.email || !admin.password, 'Define ALTURA_ADMIN_EMAIL y ALTURA_ADMIN_PASSWORD (hacen falta para devolver el stock).');

  let aprobado = 0;
  let reintentado = 0;

  test.beforeAll(async ({ request }) => {
    const registroAdmin = await request.post(`${API}/auth/Register`, {
      data: { nombre: 'Administración e2e', email: admin.email, password: admin.password },
    });
    expect([200, 400]).toContain(registroAdmin.status());
    expect((await request.post(`${API}/auth/Register`, { data: cliente })).status()).toBe(200);
    originales.push(...(await cafesDelCatalogo(request)));
  });

  // Devuelve el stock que descontaron los pagos aprobados (también si una prueba falla).
  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${await tokenAdmin(request)}` };
    for (const original of originales) {
      const actual = (await (await request.get(`${API}/cafes/${original.id}`)).json()) as CafeApi;
      const respuesta = await request.put(`${API}/cafes/${original.id}`, {
        headers,
        data: { ...actual, stock: original.stock },
      });
      expect(respuesta.status()).toBe(200);
    }
  });

  test('compra completa: datos de envío, Pagar, pasarela de pruebas y pago aprobado', async ({ page, request }) => {
    await iniciarSesion(page, cliente, '/productos');
    const pitalito = tarjeta(page, 'Pitalito', 340);
    await pitalito.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await pitalito.getByRole('button', { name: 'Agregar Pitalito 340 g al carrito' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('2');
    await tarjeta(page, 'La Unión', 340).getByRole('button', { name: 'Agregar La Unión 340 g al carrito' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('3');

    aprobado = await confirmarPedido(page);

    // Pagar → pasarela de pruebas de Altura (modo simulación).
    await page.getByTestId('pago-pendiente').getByTestId('boton-pagar').click();
    await expect(page).toHaveURL(/\/pago\/simulador\?/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pasarela de pruebas');
    await expect(page.getByTestId('aviso-simulacion')).toHaveText(
      /Modo simulación: no se procesan pagos reales\. Esta pantalla reemplaza la pasarela de Wompi mientras no hay llaves de Sandbox\./,
    );
    await expect(page.getByTestId('referencia-pasarela')).toHaveText(`PEDIDO-${aprobado}`);
    await expect(page.getByTestId('monto-pasarela')).toHaveText(/\$\s149\.000/);
    await expect(page.getByTestId('linea-pedido')).toHaveCount(2);
    await revisarAxe(page, 'pasarela de pruebas');

    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
    await expect(page).toHaveURL(new RegExp(`/pago/resultado\\?id=SIM-[^&]+&pedido=${aprobado}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¡Pago aprobado!');
    await expect(page.getByTestId('resultado-pago')).toContainText(`#${aprobado}`);
    await expect(page.getByTestId('envio-pedido')).toContainText('Calle 45 # 12-30, apto 402');
    await expect(page.getByTestId('total-pedido')).toHaveText(/\$\s149\.000/);
    await revisarAxe(page, 'pago aprobado');

    // El stock se descontó (2 Pitalito y 1 La Unión).
    const despues = await cafesDelCatalogo(request);
    expect(despues.map((c) => c.stock)).toEqual([originales[0].stock - 2, originales[1].stock - 1]);

    // En Mis pedidos: Pagado y sin botón "Pagar".
    await page.getByRole('link', { name: 'Ver mis pedidos' }).click();
    const fila = page.getByTestId('fila-pedido').filter({ hasText: `Pedido #${aprobado}` });
    await expect(fila).toContainText('Pagado');
    await expect(fila.locator('..').getByTestId('boton-pagar')).toHaveCount(0);
  });

  test('pago rechazado, "Intentar de nuevo" con una referencia nueva y aprobado', async ({ page }) => {
    await iniciarSesion(page, cliente, '/productos');
    await tarjeta(page, 'Pitalito', 340).getByRole('button', { name: 'Agregar Pitalito 340 g al carrito' }).click();
    await expect(page.getByTestId('contador-carrito')).toHaveText('1');
    reintentado = await confirmarPedido(page);

    await page.getByTestId('pago-pendiente').getByTestId('boton-pagar').click();
    await page.getByRole('button', { name: 'Simular pago rechazado' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('El pago fue rechazado');
    await expect(page.getByRole('link', { name: 'Ver mis pedidos' })).toBeVisible();
    await revisarAxe(page, 'pago rechazado');

    // "Intentar de nuevo": el pedido vuelve a Pendiente con la referencia PEDIDO-{id}-2.
    await page.getByTestId('boton-pagar').click();
    await expect(page.getByTestId('referencia-pasarela')).toHaveText(`PEDIDO-${reintentado}-2`);
    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¡Pago aprobado!');

    // El Cliente no entra al historial.
    await page.goto('/admin/historial');
    await expect(page).toHaveURL(/\/login\?permiso=denegado$/);
  });

  test('el Administrador ve las compras en el historial, filtra y abre el detalle', async ({ page }) => {
    await iniciarSesion(page, admin, '/admin/historial');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Historial de compras');
    await expect(page.getByTestId('compras-pagadas')).toHaveText(/^\d+$/);
    await expect(page.getByTestId('ingresos')).toHaveText(/\$\s/);

    // Búsqueda por el correo del cliente: sus dos compras.
    await page.getByLabel('Buscar').fill(cliente.email);
    const filas = page.getByTestId('fila-historial');
    await expect(filas).toHaveCount(2);
    await expect(page.getByTestId('compras-pagadas')).toHaveText('2');
    await expect(page.getByTestId('unidades-vendidas')).toHaveText('4');
    await expect(page.getByTestId('ingresos')).toHaveText(/\$\s198\.000/);
    const fila = filas.filter({ hasText: `PEDIDO-${aprobado}` });
    await expect(fila).toContainText(cliente.nombre);
    await expect(fila).toContainText('Pagado');
    await expect(fila).toContainText(/\$\s149\.000/);
    await expect(filas.filter({ hasText: `PEDIDO-${reintentado}-2` })).toContainText('Pagado');

    // Estado y fechas (días de Colombia).
    const estados = page.getByRole('group', { name: 'Estado' });
    await estados.getByRole('button', { name: 'Rechazado' }).click();
    await expect(filas).toHaveCount(0);
    await expect(page.getByText('Ninguna compra coincide con los filtros.')).toBeVisible();
    await estados.getByRole('button', { name: 'Pagado' }).click();
    await expect(filas).toHaveCount(2);
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    await page.getByLabel('Desde').fill(hoy);
    await page.getByLabel('Hasta').fill(hoy);
    await expect(filas).toHaveCount(2);
    await page.getByLabel('Desde').fill('2020-01-01');
    await page.getByLabel('Hasta').fill('2020-01-31');
    await expect(filas).toHaveCount(0);
    await expect(page.getByTestId('compras-pagadas')).toHaveText('0');
    await page.getByRole('button', { name: 'Quitar filtros' }).first().click();
    await page.getByLabel('Buscar').fill(cliente.email);
    await expect(filas).toHaveCount(2);
    await revisarAxe(page, 'historial');

    // Panel lateral con el resumen completo.
    await fila.getByRole('button', { name: `Ver detalle de PEDIDO-${aprobado}` }).click();
    const panel = page.getByTestId('panel-compra');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { level: 2, name: `PEDIDO-${aprobado}` })).toBeVisible();
    await expect(panel).toContainText(cliente.email);
    await expect(panel).toContainText(/SIM-/);
    await expect(panel.getByTestId('linea-pedido')).toHaveCount(2);
    await expect(panel.getByTestId('linea-pedido').filter({ hasText: 'Pitalito' })).toContainText(/2 ×\s\$\s49\.000/);
    await expect(panel.getByTestId('total-pedido')).toHaveText(/\$\s149\.000/);
    await expect(panel.getByTestId('envio-pedido')).toContainText('Bucaramanga, Santander');
    await expect(panel.getByTestId('envio-pedido')).toContainText('Teléfono 3001234567');
    await revisarAxe(page, 'detalle de la compra');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });
});
