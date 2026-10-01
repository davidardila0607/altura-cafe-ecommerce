import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { marcaVariedad } from '../../../core/data/contenido-marca';
import { Cafe } from '../../../core/models/cafe';
import { Variedad } from '../../../core/models/variedad';
import { contarCafes, normalizarTexto } from '../../../core/utils/texto';
import { EstadoError } from '../../../shared/estado-error/estado-error';

@Component({
  selector: 'app-variedades',
  imports: [RouterLink, EstadoError],
  templateUrl: './variedades.html',
  styleUrl: './variedades.css',
})
export class Variedades {
  /** GET /api/variedades */
  readonly variedades = input.required<Variedad[]>();
  /** Para contar cuántos cafés hay de cada variedad. */
  readonly cafes = input<Cafe[]>([]);
  readonly cargando = input(false);
  readonly error = input(false);
  readonly reintentar = output<void>();

  /** Variedades de la API + su texto editorial y color de marca (asociados por nombre). */
  protected readonly filas = computed(() =>
    this.variedades().map((v) => {
      const marca = marcaVariedad(v.nombre);
      const cantidad = this.cafes().filter((c) => c.variedadId === v.id).length;
      return {
        id: v.id,
        nombre: v.nombre,
        clave: normalizarTexto(v.nombre),
        color: marca.color,
        colorTexto: marca.colorTexto,
        texto: marca.texto || v.descripcion || '',
        conteo: cantidad ? contarCafes(cantidad) : null,
      };
    }),
  );
}
