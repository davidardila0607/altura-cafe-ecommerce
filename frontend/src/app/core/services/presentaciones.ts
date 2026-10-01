import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Presentacion } from '../models/presentacion';

/** Presentaciones disponibles (GET /api/presentaciones). */
@Service()
export class Presentaciones {
  private readonly http = inject(HttpClient);

  listar(): Observable<Presentacion[]> {
    return this.http.get<Presentacion[]>(`${environment.apiBaseUrl}/presentaciones`);
  }
}
