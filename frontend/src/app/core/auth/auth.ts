import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaLogin, RespuestaRegistro, Sesion } from '../models/sesion';
import { Permiso, PERMISOS } from './permisos';
import { leerToken } from './token';

/** Clave de la sesión en localStorage (sobrevive a cerrar la pestaña hasta que el token expira). */
const CLAVE_SESION = 'altura.sesion';

/**
 * Sesión del usuario (Guía 1).
 *
 * - registrar(): POST /api/auth/Register → { mensaje }.
 * - iniciarSesion(): POST /api/auth/Login → { token }; el nombre, el correo y el rol
 *   se leen de los claims del token (token.ts), sin otra petición.
 * - La sesión vive en un signal y se copia en localStorage para sobrevivir a una recarga.
 * - Cuando el token expira, la sesión se cierra sola (un temporizador hasta la hora de "exp").
 * - tienePermiso(): consulta el mapa de permisos (permisos.ts) con los roles del usuario.
 */
@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  private readonly _sesion = signal<Sesion | null>(null);
  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  /** Por qué se cerró la sesión la última vez (para mostrarlo en /login). */
  readonly motivoCierre = signal<'expirada' | null>(null);

  constructor() {
    this.restaurar();
  }

  /** Crea la cuenta. Si el correo ya existe, la API responde 400 con { mensaje }. */
  async registrar(nombre: string, email: string, password: string): Promise<string> {
    const { mensaje } = await firstValueFrom(
      this.http.post<RespuestaRegistro>(`${environment.apiBaseUrl}/auth/Register`, { nombre, email, password }),
    );
    return mensaje;
  }

  /** Inicia sesión. Con un correo o una contraseña incorrectos la API responde 401. */
  async iniciarSesion(email: string, password: string): Promise<Sesion> {
    const { token } = await firstValueFrom(
      this.http.post<RespuestaLogin>(`${environment.apiBaseUrl}/auth/Login`, { email, password }),
    );
    const sesion: Sesion = { ...leerToken(token), token };
    this.guardar(sesion);
    this.motivoCierre.set(null);
    return sesion;
  }

  /** Borra la sesión. Si el usuario estaba en el panel, lo lleva a /login. */
  cerrarSesion(motivo: 'expirada' | null = null): void {
    clearTimeout(this.temporizador);
    this._sesion.set(null);
    this.motivoCierre.set(motivo);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Almacenamiento bloqueado: no hay nada que borrar.
    }
    if (motivo === 'expirada' || this.router.url.startsWith('/admin')) {
      void this.router.navigate(['/login']);
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
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento la sesión dura hasta recargar la página.
    }
    this.programarCierre(sesion.expira);
  }

  /** Recupera la sesión guardada (si no expiró) al recargar la página. */
  private restaurar(): void {
    try {
      const guardada = localStorage.getItem(CLAVE_SESION);
      const sesion = guardada ? (JSON.parse(guardada) as Sesion) : null;
      if (sesion && sesion.expira > Date.now()) {
        this._sesion.set(sesion);
        this.programarCierre(sesion.expira);
      } else if (sesion) {
        localStorage.removeItem(CLAVE_SESION);
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
