import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from '../../core/auth/auth';
import { Cafe } from '../../core/models/cafe';
import { AgregarCarrito } from './agregar-carrito';

const ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const CAFE: Cafe = {
  id: 51, nombre: 'Pitalito', variedadId: 2, variedadNombre: 'Caturra', procesoId: 1, procesoNombre: 'Lavado',
  presentacionGramos: 340, origen: 'Huila', stock: 4, precio: 45000, imagenUrl: null, imagenPublicId: null,
  usuarioId: 5, usuarioNombre: 'Administrador Altura', disponible: true, estadoStock: 'Pocas unidades',
};

async function crear(cafe: Partial<Cafe> = {}) {
  const fixture = TestBed.createComponent(AgregarCarrito);
  fixture.componentRef.setInput('cafe', { ...CAFE, ...cafe });
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

async function iniciarSesion(id: number) {
  const auth = TestBed.inject(Auth);
  const http = TestBed.inject(HttpTestingController);
  const datos = btoa(JSON.stringify({ [ID]: String(id), exp: Math.floor(Date.now() / 1000) + 3600 }));
  const login = auth.iniciarSesion('ana@altura.test', 'secreta');
  http.expectOne(`${environment.apiBaseUrl}/auth/Login`).flush({ token: `c.${datos.replace(/=+$/, '')}.f` });
  await login;
}

describe('AgregarCarrito', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('sin sesión, "Agregar al carrito" lleva a /login con ?volver=', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const elemento = await crear();

    elemento.querySelector<HTMLButtonElement>('[data-testid="agregar-carrito"]')!.click();
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { volver: '/' } });
  });

  it('el dueño del café ve "Este café es tuyo" (deshabilitado)', async () => {
    await iniciarSesion(5);
    const elemento = await crear();
    const boton = elemento.querySelector<HTMLButtonElement>('[data-testid="agregar-carrito"]')!;
    expect(boton.textContent).toContain('Este café es tuyo');
    expect(boton.disabled).toBe(true);
  });

  it('un café sin stock muestra "Agotado"', async () => {
    const elemento = await crear({ stock: 0 });
    expect(elemento.querySelector('[data-testid="agregar-carrito"]')?.textContent).toContain('Agotado');
  });
});
