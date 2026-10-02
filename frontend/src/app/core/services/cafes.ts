import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cafe, CafeGuardar } from '../models/cafe';

/**
 * Catálogo de cafés. Las lecturas son públicas; crear, actualizar y eliminar requieren la
 * sesión del panel (el interceptor agrega el token).
 */
@Service()
export class Cafes {
  private readonly http = inject(HttpClient);

  /** GET /api/cafes */
  listar(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${environment.apiBaseUrl}/cafes`);
  }

  /** GET /api/cafes/{id} */
  obtener(id: number): Observable<Cafe> {
    return this.http.get<Cafe>(`${environment.apiBaseUrl}/cafes/${id}`);
  }

  /** POST /api/cafes */
  crear(datos: CafeGuardar): Observable<Cafe> {
    return this.http.post<Cafe>(`${environment.apiBaseUrl}/cafes`, datos);
  }

  /** PUT /api/cafes/{id} */
  actualizar(id: number, datos: CafeGuardar): Observable<Cafe> {
    return this.http.put<Cafe>(`${environment.apiBaseUrl}/cafes/${id}`, datos);
  }

  /** DELETE /api/cafes/{id} (el backend borra también su imagen de Cloudinary) */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/cafes/${id}`);
  }
}
