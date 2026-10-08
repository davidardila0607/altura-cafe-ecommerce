import { Component, computed, input } from '@angular/core';
import { Resena } from '../../../core/data/resenas';

/**
 * Una reseña: avatar con la inicial, nombre, ciudad y fecha, estrellas (con su texto para
 * lectores de pantalla: "5 de 5 estrellas"), comentario y el café que compró.
 */
@Component({
  selector: 'app-tarjeta-resena',
  template: `
    <article class="tarjeta">
      <div class="autor">
        <span class="avatar" [style.background]="resena().color" aria-hidden="true">{{ inicial() }}</span>
        <div>
          <p class="nombre">{{ resena().nombre }}</p>
          <p class="lugar">{{ resena().ciudad }}, {{ resena().hace }}</p>
        </div>
      </div>
      <p class="estrellas">
        <span class="visually-hidden">{{ resena().estrellas }} de 5 estrellas</span>
        @for (n of [1, 2, 3, 4, 5]; track n) {
          <i class="bi" [class.bi-star-fill]="n <= resena().estrellas" [class.bi-star]="n > resena().estrellas" aria-hidden="true"></i>
        }
      </p>
      <p class="comentario">{{ resena().comentario }}</p>
      <p class="cafe">Compró {{ resena().cafe }}</p>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    .tarjeta {
      padding: var(--esp-5);
      border-radius: var(--radio-tarjeta);
      background: var(--papel);
      box-shadow: var(--sombra-1);
    }
    .autor {
      display: flex;
      align-items: center;
      gap: var(--esp-3);
    }
    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      color: var(--bosque);
      font-weight: 750;
    }
    .nombre {
      font-weight: 700;
    }
    .lugar,
    .cafe {
      color: var(--texto-suave);
      font-size: var(--fs-200);
    }
    .estrellas {
      display: flex;
      gap: 0.15rem;
      margin-block: var(--esp-3) var(--esp-2);
      color: var(--cereza);
      font-size: var(--fs-200);
    }
    .comentario {
      line-height: 1.55;
    }
    .cafe {
      margin-top: var(--esp-3);
      padding-top: var(--esp-3);
      border-top: 1px solid var(--linea);
    }
  `,
})
export class TarjetaResena {
  readonly resena = input.required<Resena>();
  protected readonly inicial = computed(() => this.resena().nombre.charAt(0));
}
