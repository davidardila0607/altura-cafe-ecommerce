import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { departamentoDeOrigen } from '../../../core/data/contenido-marca';
import { DEPARTAMENTOS, Departamento, VIEWBOX_COLOMBIA } from '../../../core/data/mapa-colombia';
import { Cafe } from '../../../core/models/cafe';
import { optimizarImagenCloudinary } from '../../../core/utils/imagenes';
import { contarCafes, normalizarTexto } from '../../../core/utils/texto';
import { EstadoError } from '../../../shared/estado-error/estado-error';

interface Region {
  /** Valor del filtro ?origen= en /productos. */
  readonly clave: string;
  readonly nombre: string;
  readonly departamento?: Departamento;
  readonly cafes: Cafe[];
}

const [, , ANCHO_MAPA, ALTO_MAPA] = VIEWBOX_COLOMBIA.split(' ').map(Number);

@Component({
  selector: 'app-origenes',
  imports: [RouterLink, CurrencyPipe, EstadoError],
  templateUrl: './origenes.html',
  styleUrl: './origenes.css',
})
export class Origenes {
  readonly cafes = input.required<Cafe[]>();
  readonly cargando = input(false);
  readonly error = input(false);
  readonly reintentar = output<void>();

  protected readonly viewBox = VIEWBOX_COLOMBIA;
  protected readonly departamentos = DEPARTAMENTOS;
  protected readonly contarCafes = contarCafes;

  /** Orígenes calculados a partir de los cafés de la API (nada quemado). */
  protected readonly regiones = computed<Region[]>(() => {
    const porClave = new Map<string, Region>();
    for (const cafe of this.cafes()) {
      const nombre = cafe.origen.split(',')[0].trim();
      const clave = normalizarTexto(nombre);
      const region = porClave.get(clave) ?? { clave, nombre, departamento: departamentoDeOrigen(nombre), cafes: [] };
      region.cafes.push(cafe);
      porClave.set(clave, region);
    }
    return [...porClave.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });

  protected readonly conMarcador = computed(() => this.regiones().filter((r) => r.departamento));
  protected readonly sinMarcador = computed(() => this.regiones().filter((r) => !r.departamento));
  protected readonly clavesConCafe = computed(() => new Set(this.conMarcador().map((r) => r.departamento!.clave)));

  private readonly seleccion = signal<string | null>(null);
  protected readonly activa = computed(
    () => this.regiones().find((r) => r.clave === this.seleccion()) ?? this.conMarcador()[0] ?? this.regiones()[0],
  );

  protected seleccionar(clave: string): void {
    this.seleccion.set(clave);
  }

  /**
   * La etiqueta va a la izquierda del punto cuando hay otro marcador muy cerca a su derecha
   * y a la misma altura (por ejemplo Cauca y Huila), para que no se tapen.
   */
  protected readonly etiquetaIzquierda = computed(() => {
    const marcadores = this.conMarcador().map((r) => r.departamento!);
    return new Set(
      marcadores
        .filter((d) => marcadores.some((o) => o !== d && o.x - d.x > 0 && o.x - d.x < 90 && Math.abs(o.y - d.y) < 30))
        .map((d) => d.clave),
    );
  });

  protected posicionX(d: Departamento): number {
    return (d.x / ANCHO_MAPA) * 100;
  }

  protected posicionY(d: Departamento): number {
    return (d.y / ALTO_MAPA) * 100;
  }

  protected miniatura(cafe: Cafe): string | null {
    return optimizarImagenCloudinary(cafe.imagenUrl, 'f_auto,q_auto,w_160');
  }
}
