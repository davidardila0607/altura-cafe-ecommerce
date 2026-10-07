import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { CarritoDto } from '../models/carrito';
import { Carrito } from './carrito';

const ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const URL = `${environment.apiBaseUrl}/Carrito`;

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

describe('Carrito', () => {
  let carrito: Carrito;
  let auth: Auth;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(Auth);
    carrito = TestBed.inject(Carrito);
    http = TestBed.inject(HttpTestingController);

    // Inicia sesión: el carrito se carga solo con GET /Carrito/GetCarrito.
    const login = auth.iniciarSesion('ana@altura.test', 'secreta');
    http.expectOne(`${environment.apiBaseUrl}/auth/Login`).flush({ token: tokenDePrueba() });
    await login;
    TestBed.tick();
    http.expectOne(`${URL}/GetCarrito`).flush(CARRITO);
    await Promise.resolve();
  });

  afterEach(() => http.verify());

  it('se carga al iniciar sesión y es la fuente del contador', () => {
    expect(carrito.totalUnidades()).toBe(2);
    expect(carrito.cantidadDe(51)).toBe(2);
    expect(carrito.cantidadDe(99)).toBe(0);
  });

  it('agrega con POST /Carrito/AgregarProducto y vuelve a pedir el carrito', async () => {
    const promesa = carrito.agregar(51, 3);
    const peticion = http.expectOne(`${URL}/AgregarProducto`);
    expect(peticion.request.body).toEqual({ productId: 51, cantidad: 3 });
    peticion.flush({ mensaje: 'Producto agregado al carrito.' });
    await Promise.resolve();
    http.expectOne(`${URL}/GetCarrito`).flush({ ...CARRITO, totalUnidades: 5 });

    expect(await promesa).toBe('Producto agregado al carrito.');
    expect(carrito.totalUnidades()).toBe(5);
  });

  it('se vacía en memoria al cerrar sesión', () => {
    auth.cerrarSesion();
    TestBed.tick();
    expect(carrito.totalUnidades()).toBe(0);
    expect(carrito.productos()).toEqual([]);
  });
});
