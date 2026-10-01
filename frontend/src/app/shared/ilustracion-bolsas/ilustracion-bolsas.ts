import { Component, input } from '@angular/core';

interface BolsaIlustrada {
  readonly x: number;
  readonly suelo: number;
  readonly escala: number;
  readonly color: string;
  readonly variedad: string;
  readonly gramos: number;
}

/** Contorno de la bolsa stand-up (mismo dibujo que las imágenes de producto), en coordenadas locales. */
const CONTORNO_BOLSA =
  'M -250,-760 L 250,-760 Q 258,-760 258,-750 L 258,-704 C 263,-520 266,-210 253,-46 Q 249,-8 212,-3 Q 0,7 -212,-3 Q -249,-8 -253,-46 C -266,-210 -263,-520 -258,-704 L -258,-750 Q -258,-760 -250,-760 Z';

/** Curvas de nivel concéntricas: la referencia visual a la altitud. */
function curvasDeNivel(cx: number, cy: number): string[] {
  const curvas: string[] = [];
  for (let radio = 26; radio <= 360; radio += 21) {
    const puntos: string[] = [];
    for (let k = 0; k <= 120; k++) {
      const t = (k / 120) * Math.PI * 2;
      const r =
        radio *
        (1 + 0.09 * Math.sin(3 * t + radio * 0.019) + 0.05 * Math.cos(5 * t - radio * 0.03) + 0.025 * Math.sin(7 * t));
      puntos.push(`${(cx + r * Math.cos(t) * 1.2).toFixed(1)},${(cy + r * Math.sin(t) * 0.78).toFixed(1)}`);
    }
    curvas.push(`M${puntos.join(' L')} Z`);
  }
  return curvas;
}

const CURVAS = curvasDeNivel(330, 250);

/**
 * Ilustración propia (SVG en línea) de tres bolsas de Altura sobre curvas de nivel.
 * Decorativa: se oculta a lectores de pantalla.
 */
@Component({
  selector: 'app-ilustracion-bolsas',
  templateUrl: './ilustracion-bolsas.html',
  styleUrl: './ilustracion-bolsas.css',
  host: {
    '[class.oscuro]': "tono() === 'oscuro'",
    'aria-hidden': 'true',
  },
})
export class IlustracionBolsas {
  /** 'claro' para fondos crema; 'oscuro' para el panel espresso del login. */
  readonly tono = input<'claro' | 'oscuro'>('claro');

  protected readonly contorno = CONTORNO_BOLSA;
  protected readonly curvas = CURVAS;

  // Las de atrás primero; la Geisha de 500 g queda al frente sin tapar las etiquetas de las otras.
  protected readonly bolsas: readonly BolsaIlustrada[] = [
    { x: 126, suelo: 468, escala: 0.4, color: 'var(--alt-cafe)', variedad: 'Castillo', gramos: 340 },
    { x: 536, suelo: 468, escala: 0.4, color: 'var(--alt-terracota)', variedad: 'Moka', gramos: 340 },
    { x: 330, suelo: 494, escala: 0.5, color: 'var(--alt-verde)', variedad: 'Geisha', gramos: 500 },
  ];
}
