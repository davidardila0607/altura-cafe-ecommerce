import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
