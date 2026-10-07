import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Procesos } from './procesos';

describe('Procesos', () => {
  let service: Procesos;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Procesos);
    http = TestBed.inject(HttpTestingController);
  });

  it('pide la lista a GET /api/procesos', () => {
    let nombres: string[] = [];
    service.listar().subscribe((procesos) => (nombres = procesos.map((p) => p.nombre)));

    const peticion = http.expectOne(`${environment.apiBaseUrl}/procesos`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([
      { id: 1, nombre: 'Lavado', descripcion: null },
      { id: 2, nombre: 'Honey', descripcion: null },
    ]);

    expect(nombres).toEqual(['Lavado', 'Honey']);
    http.verify();
  });
});
