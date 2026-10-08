import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { CarritoDto } from '../models/carrito';
import { PedidoDto, unidadesDe } from '../models/pedido';
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

  it('crea el pedido con POST /Pedido/CrearPedido y el contador del carrito vuelve a 0', async () => {
    const promesa = pedidos.crear();
    http.expectOne(`${URL}/CrearPedido`).flush({ mensaje: 'Pedido creado correctamente.', pedidoId: 12 });
    await Promise.resolve();
    http.expectOne(`${URL_CARRITO}/GetCarrito`).flush(VACIO);

    expect(await promesa).toEqual({ mensaje: 'Pedido creado correctamente.', pedidoId: 12 });
    expect(carrito.totalUnidades()).toBe(0);
  });

  it('si la API responde 409, lanza el error y el carrito queda igual', async () => {
    const promesa = pedidos.crear();
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
      productos: [
        { productoId: 51, nombre: 'Mesa de los Santos', imagenUrl: null, cantidad: 2, precio: 46000 },
        { productoId: 52, nombre: 'Mesa de los Santos', imagenUrl: null, cantidad: 1, precio: 62000 },
      ],
    };
    expect(unidadesDe(pedido)).toBe(3);
  });
});
