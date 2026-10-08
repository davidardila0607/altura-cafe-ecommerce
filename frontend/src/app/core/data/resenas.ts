/**
 * Reseñas de ejemplo de la sección de cierre del Inicio.
 *
 * SON FICTICIAS: contenido de marca de un proyecto académico (no hay reseñas reales ni una
 * plataforma de reseñas detrás). Los cafés sí son del catálogo (backend/seed/catalogo.json).
 * El avatar usa los tonos suaves de la paleta (alba, liquen, helecho…) con la inicial en bosque.
 */
export interface Resena {
  nombre: string;
  ciudad: string;
  estrellas: 4 | 5;
  /** Fecha relativa, ya escrita (no se calcula: las reseñas son de ejemplo). */
  hace: string;
  cafe: string;
  comentario: string;
  /** Fondo del avatar: un tono suave de la paleta (la inicial va en bosque, contraste alto). */
  color: string;
}

export const RESENAS: readonly Resena[] = [
  {
    nombre: 'Laura M.',
    ciudad: 'Bogotá',
    estrellas: 5,
    hace: 'hace 2 semanas',
    cafe: 'Rosa del Huila 340 g',
    comentario:
      'Lo preparo en V60 y las notas a frutos rojos se sienten desde el primer sorbo. La bolsa trae válvula y el aroma se conserva días después de abrirla.',
    color: 'var(--alba)',
  },
  {
    nombre: 'Andrés P.',
    ciudad: 'Medellín',
    estrellas: 5,
    hace: 'hace 1 mes',
    cafe: 'Mesa de los Santos 500 g',
    comentario: 'Lo muelo grueso para prensa francesa y queda limpio, sin amargor. Llegó en dos días hábiles.',
    color: 'var(--liquen)',
  },
  {
    nombre: 'Camila R.',
    ciudad: 'Cali',
    estrellas: 4,
    hace: 'hace 3 semanas',
    cafe: 'Volcán Galeras 340 g',
    comentario:
      'Buena acidez y cuerpo medio. Le quito una estrella porque la caja llegó golpeada, aunque la bolsa estaba intacta.',
    color: 'var(--helecho)',
  },
  {
    nombre: 'Julián T.',
    ciudad: 'Bucaramanga',
    estrellas: 5,
    hace: 'hace 5 días',
    cafe: 'Chicamocha 340 g',
    comentario: 'Café de mi tierra y se nota el cuidado. Tostión pareja y en espresso aparece clarito el chocolate amargo.',
    color: 'var(--niebla-honda)',
  },
  {
    nombre: 'Valentina G.',
    ciudad: 'Manizales',
    estrellas: 5,
    hace: 'hace 2 meses',
    cafe: 'Inzá Reserva 340 g',
    comentario: 'Es para ocasiones especiales y lo vale. Dulce, floral y muy limpio: lo tomé sin azúcar por primera vez.',
    color: 'var(--liquen-hondo)',
  },
  {
    nombre: 'Sebastián O.',
    ciudad: 'Pasto',
    estrellas: 5,
    hace: 'hace 1 semana',
    cafe: 'Buesaco 340 g',
    comentario: 'Rico y balanceado, con un final a panela. Ojalá saquen una bolsa de 500 g de este origen.',
    color: 'var(--alba)',
  },
  {
    nombre: 'Daniela C.',
    ciudad: 'Barranquilla',
    estrellas: 5,
    hace: 'hace 3 semanas',
    cafe: 'Sierra Nevada 500 g',
    comentario:
      'Con este calor lo tomo en cold brew y queda suave y achocolatado. El envío a la costa fue más rápido de lo que esperaba.',
    color: 'var(--liquen)',
  },
  {
    nombre: 'Felipe A.',
    ciudad: 'Pereira',
    estrellas: 5,
    hace: 'hace 1 mes',
    cafe: 'Pitalito Reserva 340 g',
    comentario: 'Lo que dice la ficha de cata es lo que uno siente en la taza: caramelo y mandarina. Voy por la tercera bolsa.',
    color: 'var(--helecho)',
  },
  {
    nombre: 'Mariana L.',
    ciudad: 'Popayán',
    estrellas: 5,
    hace: 'hace 4 días',
    cafe: 'Tierradentro 500 g',
    comentario: 'Llegó bien sellado y oliendo a café recién tostado. Lo llevé a la oficina y todos preguntaron cuál era.',
    color: 'var(--niebla-honda)',
  },
  {
    nombre: 'Ricardo B.',
    ciudad: 'Santa Marta',
    estrellas: 4,
    hace: 'hace 2 semanas',
    cafe: 'Minca 340 g',
    comentario: 'Notas a nuez y cacao, muy fácil de tomar. Lo prefiero un poco más oscuro, pero para filtrado está muy bien.',
    color: 'var(--liquen-hondo)',
  },
];

/** Promedio de las reseñas de ejemplo (8 de 5 estrellas y 2 de 4 = 4,8). */
export const PROMEDIO_RESENAS = RESENAS.reduce((suma, r) => suma + r.estrellas, 0) / RESENAS.length;
