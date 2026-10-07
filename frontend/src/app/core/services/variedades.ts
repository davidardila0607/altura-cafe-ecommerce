import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Variedad, VariedadGuardar } from '../models/variedad';

/** Variedades: lectura pública; escritura con la sesión del panel. */
@Service()
export class Variedades {
  private readonly http = inject(HttpClient);

  listar(): Observable<Variedad[]> {
    return this.http.get<Variedad[]>(`${environment.apiBaseUrl}/variedades`);
  }

  /** POST /api/variedades */
  crear(datos: VariedadGuardar): Observable<Variedad> {
    return this.http.post<Variedad>(`${environment.apiBaseUrl}/variedades`, datos);
  }

  /** PUT /api/variedades/{id} (responde 204 sin cuerpo) */
  actualizar(id: number, datos: VariedadGuardar): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/variedades/${id}`, datos);
  }

  /** DELETE /api/variedades/{id} (409 si tiene cafés asociados) */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/variedades/${id}`);
  }
}
