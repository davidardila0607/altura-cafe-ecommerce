import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cafe } from '../models/cafe';

/** Acceso de solo lectura al catálogo de cafés. */
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
}
