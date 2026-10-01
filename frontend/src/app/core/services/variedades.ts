import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Variedad } from '../models/variedad';

/** Acceso de solo lectura a las variedades (GET /api/variedades). */
@Service()
export class Variedades {
  private readonly http = inject(HttpClient);

  listar(): Observable<Variedad[]> {
    return this.http.get<Variedad[]>(`${environment.apiBaseUrl}/variedades`);
  }
}
