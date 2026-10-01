import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FOTOS_SITIO } from '../../../core/data/contenido-marca';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';

/** Cierre del Inicio: una invitación clara al catálogo. */
@Component({
  selector: 'app-cierre',
  imports: [RouterLink],
  template: `
    <section class="cierre" aria-labelledby="cierre-titulo">
      <div class="contenedor rejilla">
        <div class="texto">
          <h2 id="cierre-titulo" class="titulo-cierre">Encuentra el café de tu próxima mañana</h2>
          <p class="bajada">Filtra por variedad, origen o presentación y elige el que más se parezca a ti.</p>
          <a class="btn btn-primary btn-lg" routerLink="/productos">Explorar cafés</a>
        </div>
        <img
          class="foto"
          [src]="src"
          [attr.srcset]="srcset"
          sizes="(min-width: 768px) 30vw, 60vw"
          [alt]="foto.alt"
          width="900"
          height="1125"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  `,
  styles: `
    .cierre {
      padding-block: var(--seccion);
      background: var(--alt-crema-hondo);
    }
    .rejilla {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 20rem);
      gap: var(--esp-6) clamp(2rem, 6vw, 6rem);
      align-items: center;
    }
    .titulo-cierre {
      max-width: 15ch;
      margin: 0 0 var(--esp-5);
      font-size: var(--fs-800);
      font-weight: 430;
      line-height: var(--lh-ajustado);
      letter-spacing: -0.03em;
    }
    .bajada {
      max-width: 34rem;
      margin: 0 0 var(--esp-6);
      font-size: var(--fs-400);
      color: var(--alt-texto-suave);
    }
    .foto {
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: var(--radio-tarjeta);
      box-shadow: var(--sombra-2);
      transform: rotate(2deg);
    }
    @media (max-width: 767.98px) {
      .rejilla {
        grid-template-columns: minmax(0, 1fr);
      }
      .foto {
        width: 62%;
        justify-self: end;
      }
    }
  `,
})
export class Cierre {
  protected readonly foto = FOTOS_SITIO.acceso;
  protected readonly src = urlSitio(this.foto.publicId, 700);
  protected readonly srcset = srcsetSitio(this.foto.publicId, [480, 700, 960]);
}
