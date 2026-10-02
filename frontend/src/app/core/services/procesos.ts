import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proceso } from '../models/proceso';

/** Procesos de beneficio (GET /api/procesos, público y solo lectura). */
@Service()
export class Procesos {
  private readonly http = inject(HttpClient);

  listar(): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(`${environment.apiBaseUrl}/procesos`);
  }
}
