import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FOTOS_SITIO } from '../../../core/data/contenido-marca';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';
import { Magnetico } from '../../../shared/movimiento/magnetico';
import { Revelar } from '../../../shared/revelar/revelar';

/** Cierre del Inicio ("Cumbre"): llegaste arriba; una invitación clara al catálogo. */
@Component({
  selector: 'app-cierre',
  imports: [RouterLink, Magnetico, Revelar],
  template: `
    <section class="cierre sobre-oscuro" aria-labelledby="cierre-titulo">
      <img class="cresta" src="paisaje/cresta-4.svg" alt="" aria-hidden="true" width="1440" height="600" />
      <div class="contenedor rejilla" appRevelar>
        <div class="texto">
          <h2 id="cierre-titulo" class="display revelar-texto">Llegaste a la cumbre.</h2>
          <p class="bajada revelar-texto">Ahora elige el café que va a bajar contigo hasta tu mesa.</p>
          <a class="boton boton-primario revelar-texto" appMagnetico routerLink="/productos">Explorar cafés</a>
        </div>
        <img
          class="foto revelar-imagen"
          [src]="src"
          [attr.srcset]="srcset"
          sizes="(min-width: 768px) 30vw, 60vw"
          [alt]="foto.alt"
          width="900"
          height="1350"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .cierre {
      position: relative;
      padding: var(--seccion) 0 calc(var(--seccion) + 2rem);
      background: var(--bosque);
      color: var(--texto-claro);
    }
    /* La cresta oscura une la sección clara de arriba con esta. */
    .cresta {
      position: absolute;
      left: 0;
      bottom: calc(100% - 1px);
      width: 100%;
      height: clamp(4rem, 10vw, 9rem);
    }
    .rejilla {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
      gap: var(--esp-7) clamp(2rem, 6vw, 6rem);
      align-items: center;
    }
    .display {
      max-width: 10ch;
    }
    .bajada {
      margin: var(--esp-5) 0 var(--esp-6);
      color: var(--texto-claro-suave);
    }
    .foto {
      width: 100%;
      aspect-ratio: 2 / 3;
      object-fit: cover;
      border-radius: var(--radio-tarjeta);
    }
    @media (max-width: 767.98px) {
      .rejilla {
        grid-template-columns: minmax(0, 1fr);
      }
      .foto {
        width: 70%;
        justify-self: end;
      }
    }
  `,
})
export class Cierre {
  protected readonly foto = FOTOS_SITIO.taza;
  protected readonly src = urlSitio(this.foto.publicId, 700);
  protected readonly srcset = srcsetSitio(this.foto.publicId, [480, 700, 960]);
}
