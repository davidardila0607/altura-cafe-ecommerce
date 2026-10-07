import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, UsuarioAdmin } from '../models/usuario';

/** Administración de usuarios (solo Administrador; el interceptor agrega el token). */
@Service()
export class Usuarios {
  private readonly http = inject(HttpClient);

  /** GET /api/usuarios */
  listar(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${environment.apiBaseUrl}/usuarios`);
  }

  /** PUT /api/usuarios/{id}/rol → { mensaje }. 404 si no existe; 409 si es el propio rol. */
  cambiarRol(id: number, rol: Rol): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${environment.apiBaseUrl}/usuarios/${id}/rol`, { rol });
  }
}
