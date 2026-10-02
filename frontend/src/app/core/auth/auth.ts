import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaLogin, Sesion, UsuarioActual } from '../models/sesion';
import { Permiso, PERMISOS } from './permisos';

/** Clave de la sesión en sessionStorage (se borra al cerrar la pestaña). */
const CLAVE_SESION = 'altura.sesion';

/**
 * Sesión del panel de administración.
 *
 * - iniciarSesion(): POST /api/auth/login → token; GET /api/auth/me → nombre y roles.
 * - La sesión vive en un signal y se copia en sessionStorage para sobrevivir a una recarga.
 * - Cuando el token expira, la sesión se cierra sola (un temporizador hasta la hora de "exp").
 * - tienePermiso(): consulta el mapa de permisos (permisos.ts) con los roles del usuario.
 *
 * El Login y el Registro públicos (/login, /registro) NO usan este servicio: son solo visuales.
 */
@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  private readonly _sesion = signal<Sesion | null>(null);
  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  /** Por qué se cerró la sesión la última vez (para mostrarlo en la pantalla de ingreso). */
  readonly motivoCierre = signal<'expirada' | null>(null);

  constructor() {
    this.restaurar();
  }

  /** Devuelve la sesión si el usuario puede gestionar el inventario; si no, lanza un error. */
  async iniciarSesion(email: string, password: string): Promise<Sesion> {
    const { token } = await firstValueFrom(
      this.http.post<RespuestaLogin>(`${environment.apiBaseUrl}/auth/login`, { email, password }),
    );
    // Todavía no hay sesión guardada: el token se envía a mano en esta petición.
    const usuario = await firstValueFrom(
      this.http.get<UsuarioActual>(`${environment.apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const sesion: Sesion = { ...usuario, token, expira: expiracionDelToken(token) };
    this.guardar(sesion);
    this.motivoCierre.set(null);
    return sesion;
  }

  cerrarSesion(motivo: 'expirada' | null = null): void {
    clearTimeout(this.temporizador);
    this._sesion.set(null);
    this.motivoCierre.set(motivo);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      // Almacenamiento bloqueado: no hay nada que borrar.
    }
    if (this.router.url.startsWith('/admin') && !this.router.url.startsWith('/admin/ingresar')) {
      void this.router.navigate(['/admin/ingresar']);
    }
  }

  /** true si alguno de los roles del usuario está en la lista del permiso. */
  tienePermiso(permiso: Permiso): boolean {
    const roles = this._sesion()?.roles ?? [];
    const permitidos: readonly string[] = PERMISOS[permiso];
    return roles.some((rol) => permitidos.includes(rol));
  }

  private guardar(sesion: Sesion): void {
    this._sesion.set(sesion);
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento la sesión dura hasta recargar la página.
    }
    this.programarCierre(sesion.expira);
  }

  /** Recupera la sesión guardada (si no expiró) al recargar la página. */
  private restaurar(): void {
    try {
      const guardada = sessionStorage.getItem(CLAVE_SESION);
      const sesion = guardada ? (JSON.parse(guardada) as Sesion) : null;
      if (sesion && sesion.expira > Date.now()) {
        this._sesion.set(sesion);
        this.programarCierre(sesion.expira);
      } else if (sesion) {
        sessionStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // Datos dañados o almacenamiento bloqueado: se empieza sin sesión.
    }
  }

  private programarCierre(expira: number): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.cerrarSesion('expirada'), Math.max(0, expira - Date.now()));
  }
}

/**
 * Lee la fecha de expiración ("exp", en segundos) de la parte central del JWT.
 * Un JWT son tres textos en Base64URL separados por puntos: cabecera.datos.firma.
 */
function expiracionDelToken(token: string): number {
  const datos = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const { exp } = JSON.parse(atob(datos)) as { exp: number };
  return exp * 1000;
}
