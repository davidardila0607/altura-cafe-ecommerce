import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Altura | Café de especialidad',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
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
