import { Routes } from '@angular/router';
import { requierePermiso, requiereSesion } from './core/auth/guard';

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
      {
        // Guía 2: sin sesión, el guard lleva a /login?volver=/carrito.
        path: 'carrito',
        title: 'Tu carrito | Altura',
        canMatch: [requiereSesion],
        loadComponent: () => import('./pages/carrito/carrito').then((m) => m.PaginaCarrito),
      },
      {
        // Guía de pedidos: los pedidos del usuario y el detalle de uno (solo con sesión).
        path: 'mis-pedidos',
        title: 'Mis pedidos | Altura',
        canMatch: [requiereSesion],
        loadComponent: () => import('./pages/mis-pedidos/mis-pedidos').then((m) => m.MisPedidos),
      },
      {
        path: 'mis-pedidos/:id',
        title: 'Detalle del pedido | Altura',
        canMatch: [requiereSesion],
        loadComponent: () => import('./pages/mis-pedidos/detalle-pedido').then((m) => m.DetallePedido),
      },
      {
        // Guía 3: pasarela de pruebas (modo simulación) y resultado del pago (solo con sesión).
        path: 'pago/simulador',
        title: 'Pasarela de pruebas | Altura',
        canMatch: [requiereSesion],
        loadComponent: () => import('./pages/pago/pasarela-pruebas').then((m) => m.PasarelaPruebas),
      },
      {
        path: 'pago/resultado',
        title: 'Resultado del pago | Altura',
        canMatch: [requiereSesion],
        loadComponent: () => import('./pages/pago/resultado-pago').then((m) => m.ResultadoPago),
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
      {
        // Historial de compras (antes "Pedidos"; la ruta vieja redirige aquí).
        path: 'historial',
        title: 'Historial de compras | Altura',
        loadComponent: () => import('./pages/admin/historial/historial-admin').then((m) => m.HistorialAdmin),
      },
      { path: 'pedidos', redirectTo: 'historial' },
      {
        path: 'usuarios',
        title: 'Usuarios | Altura',
        canMatch: [requierePermiso('usuarios.gestionar')],
        loadComponent: () => import('./pages/admin/usuarios/usuarios-admin').then((m) => m.UsuariosAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
