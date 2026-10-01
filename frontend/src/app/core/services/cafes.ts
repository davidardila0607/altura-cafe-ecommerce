import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cafe } from '../models/cafe';

/** Acceso de solo lectura al catálogo de cafés (GET /api/cafes). */
@Service()
export class Cafes {
  private readonly http = inject(HttpClient);

  listar(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${environment.apiBaseUrl}/cafes`);
  }
}
