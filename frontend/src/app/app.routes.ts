import { Routes } from '@angular/router';
import { requierePermiso } from './core/auth/guard';

export const routes: Routes = [
  {
    // Inicio y Productos comparten navbar y footer.
    path: '',
    loadComponent: () => import('./layout/sitio/sitio').then((m) => m.Sitio),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Altura | Café de especialidad',
        loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'productos',
        title: 'Nuestros cafés | Altura',
        loadComponent: () => import('./pages/productos/productos').then((m) => m.Productos),
      },
    ],
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Altura',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta | Altura',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  // ===== Administración: misma sesión de /login; solo entra el rol Administrador =====
  {
    path: 'admin',
    canMatch: [requierePermiso('inventario.gestionar')],
    loadComponent: () => import('./layout/admin/admin').then((m) => m.Admin),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inventario' },
      {
        path: 'inventario',
        title: 'Inventario | Altura',
        loadComponent: () => import('./pages/admin/inventario/inventario').then((m) => m.Inventario),
      },
      {
        path: 'variedades',
        title: 'Variedades | Altura',
        loadComponent: () => import('./pages/admin/variedades/variedades-admin').then((m) => m.VariedadesAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
