import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cafe } from '../../../core/models/cafe';
import { EstadoError } from '../../../shared/estado-error/estado-error';
import { TarjetaCafe } from '../../../shared/tarjeta-cafe/tarjeta-cafe';

/** Cantidad de cafés de la selección de la casa. */
const CANTIDAD = 3;

/**
 * Elige los destacados: primero los que tienen stock, ordenados por precio descendente;
 * si no alcanzan, completa con los agotados (también por precio descendente).
 */
export function elegirDestacados(cafes: readonly Cafe[], cantidad = CANTIDAD): Cafe[] {
  const porPrecio = (a: Cafe, b: Cafe) => b.precio - a.precio;
  const conStock = cafes.filter((c) => c.stock > 0).sort(porPrecio);
  const agotados = cafes.filter((c) => c.stock <= 0).sort(porPrecio);
  return [...conStock, ...agotados].slice(0, cantidad);
}

@Component({
  selector: 'app-destacados',
  imports: [RouterLink, TarjetaCafe, EstadoError],
  templateUrl: './destacados.html',
  styleUrl: './destacados.css',
})
export class Destacados {
  readonly cafes = input.required<Cafe[]>();
  readonly cargando = input(false);
  readonly error = input(false);

  readonly reintentar = output<void>();
  readonly ver = output<number>();

  protected readonly destacados = computed(() => elegirDestacados(this.cafes()));
}
