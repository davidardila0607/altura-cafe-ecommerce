import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { CarritoDto } from '../models/carrito';
import { DatosEnvioDto, PedidoDto, sePuedePagar, unidadesDe } from '../models/pedido';
import { urlCheckoutWompi } from './pagos';
import { Carrito } from './carrito';
import { Pedidos } from './pedidos';

const ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const URL = `${environment.apiBaseUrl}/Pedido`;
const URL_CARRITO = `${environment.apiBaseUrl}/Carrito`;

function tokenDePrueba(): string {
  const datos = btoa(JSON.stringify({ [ID]: '7', exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `cabecera.${datos.replace(/=+$/, '')}.firma`;
}

const CARRITO: CarritoDto = {
  carritoId: 1,
  productos: [
    { productoId: 51, nombre: 'Pitalito', imagenUrl: null, precio: 45000, cantidad: 2, subtotal: 90000,
      variedad: 'Caturra', proceso: 'Lavado', presentacionGramos: 340, stock: 10 },
  ],
  total: 90000,
  totalUnidades: 2,
};

const VACIO: CarritoDto = { carritoId: 1, productos: [], total: 0, totalUnidades: 0 };

const ENVIO: DatosEnvioDto = {
  direccionEnvio: 'Calle 45 # 12-30',
  ciudad: 'Bucaramanga',
  departamento: 'Santander',
  telefono: '3001234567',
  notasEntrega: null,
};

describe('Pedidos', () => {
  let pedidos: Pedidos;
  let carrito: Carrito;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const auth = TestBed.inject(Auth);
    carrito = TestBed.inject(Carrito);
    pedidos = TestBed.inject(Pedidos);
    http = TestBed.inject(HttpTestingController);

    const login = auth.iniciarSesion('ana@altura.test', 'secreta');
    http.expectOne(`${environment.apiBaseUrl}/auth/Login`).flush({ token: tokenDePrueba() });
    await login;
    TestBed.tick();
    http.expectOne(`${URL_CARRITO}/GetCarrito`).flush(CARRITO);
    await Promise.resolve();
  });

  afterEach(() => http.verify());

  it('crea el pedido con POST /Pedido/CrearPedido y los datos de envío; el contador vuelve a 0', async () => {
    const promesa = pedidos.crear(ENVIO);
    const peticion = http.expectOne(`${URL}/CrearPedido`);
    expect(peticion.request.body).toEqual(ENVIO);
    peticion.flush({ mensaje: 'Pedido creado correctamente.', pedidoId: 12 });
    await Promise.resolve();
    http.expectOne(`${URL_CARRITO}/GetCarrito`).flush(VACIO);

    expect(await promesa).toEqual({ mensaje: 'Pedido creado correctamente.', pedidoId: 12 });
    expect(carrito.totalUnidades()).toBe(0);
  });

  it('si la API responde 409, lanza el error y el carrito queda igual', async () => {
    const promesa = pedidos.crear(ENVIO);
    http
      .expectOne(`${URL}/CrearPedido`)
      .flush({ mensaje: 'No puedes comprar tus propios productos.' }, { status: 409, statusText: 'Conflict' });
    await Promise.resolve();
    http.expectOne(`${URL_CARRITO}/GetCarrito`).flush(CARRITO);

    await expect(promesa).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(carrito.totalUnidades()).toBe(2);
  });

  it('suma las unidades de un pedido', () => {
    const pedido: PedidoDto = {
      id: 1,
      fecha: '2026-10-07T20:00:00Z',
      estado: 'Pendiente',
      total: 154000,
      referenciaWompi: 'PEDIDO-1',
      ...ENVIO,
      productos: [
        { productoId: 51, nombre: 'Mesa de los Santos', imagenUrl: null, cantidad: 2, precio: 46000 },
        { productoId: 52, nombre: 'Mesa de los Santos', imagenUrl: null, cantidad: 1, precio: 62000 },
      ],
    };
    expect(unidadesDe(pedido)).toBe(3);
    expect(sePuedePagar(pedido)).toBe(true);
    expect(sePuedePagar({ ...pedido, estado: 'Pagado' })).toBe(false);
  });

  it('pide el historial solo con los filtros que tienen valor', () => {
    pedidos.historial({ estado: 'Pagado', desde: '2026-10-01', hasta: '', texto: ' ana ' }).subscribe();
    const peticion = http.expectOne((r) => r.url === `${URL}/Historial`);
    expect(peticion.request.params.keys()).toEqual(['estado', 'desde', 'texto']);
    expect(peticion.request.params.get('texto')).toBe('ana');
    peticion.flush({ comprasPagadas: 0, unidadesVendidas: 0, ingresos: 0, pedidos: [] });
  });
});

describe('urlCheckoutWompi', () => {
  it('arma la URL del Web Checkout con los parámetros de la documentación de Wompi', () => {
    const url = new globalThis.URL(
      urlCheckoutWompi({
        publicKey: 'pub_test_ABC',
        reference: 'PEDIDO-15',
        amountInCents: 4500000,
        currency: 'COP',
        integritySignature: 'abc123',
        redirectUrl: 'http://localhost:4200/pago/resultado',
        modoSimulado: false,
      }),
    );
    expect(url.origin + url.pathname).toBe('https://checkout.wompi.co/p/');
    expect(url.searchParams.get('public-key')).toBe('pub_test_ABC');
    expect(url.searchParams.get('currency')).toBe('COP');
    expect(url.searchParams.get('amount-in-cents')).toBe('4500000');
    expect(url.searchParams.get('reference')).toBe('PEDIDO-15');
    expect(url.searchParams.get('signature:integrity')).toBe('abc123');
    expect(url.searchParams.get('redirect-url')).toBe('http://localhost:4200/pago/resultado');
  });
});
