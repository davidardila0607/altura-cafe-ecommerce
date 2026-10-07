import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Auth } from './auth';

const ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NOMBRE = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

function tokenDePrueba(rol: string): string {
  const datos = btoa(JSON.stringify({ [NOMBRE]: 'Ana', [ROL]: rol, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `cabecera.${datos.replace(/=+$/, '')}.firma`;
}

describe('Auth', () => {
  let auth: Auth;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(Auth);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.cerrarSesion();
  });

  it('inicia sesión con POST /auth/Login y lee el nombre y el rol del token', async () => {
    const promesa = auth.iniciarSesion('ana@altura.test', 'secreta');
    const peticion = http.expectOne(`${environment.apiBaseUrl}/auth/Login`);
    expect(peticion.request.body).toEqual({ email: 'ana@altura.test', password: 'secreta' });
    peticion.flush({ token: tokenDePrueba('Administrador') });

    const sesion = await promesa;
    expect(sesion.nombre).toBe('Ana');
    expect(auth.tienePermiso('inventario.gestionar')).toBe(true);
    expect(localStorage.getItem('altura.sesion')).toContain('Ana');
  });

  it('un Cliente no tiene el permiso de inventario', async () => {
    const promesa = auth.iniciarSesion('ana@altura.test', 'secreta');
    http.expectOne(`${environment.apiBaseUrl}/auth/Login`).flush({ token: tokenDePrueba('Cliente') });
    await promesa;

    expect(auth.autenticado()).toBe(true);
    expect(auth.tienePermiso('inventario.gestionar')).toBe(false);
  });

  it('registra con POST /auth/Register y devuelve el mensaje de la API', async () => {
    const promesa = auth.registrar('Ana', 'ana@altura.test', 'secreta');
    http
      .expectOne(`${environment.apiBaseUrl}/auth/Register`)
      .flush({ mensaje: 'Usuario registrado correctamente.' });

    expect(await promesa).toBe('Usuario registrado correctamente.');
  });
});
