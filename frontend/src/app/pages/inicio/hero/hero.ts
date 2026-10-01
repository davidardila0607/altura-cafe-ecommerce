import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FOTOS_SITIO } from '../../../core/data/contenido-marca';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';
import { movimientoReducido } from '../../../core/utils/medios';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  protected readonly foto = FOTOS_SITIO.hero;
  protected readonly src = urlSitio(this.foto.publicId, 1280);
  protected readonly srcset = srcsetSitio(this.foto.publicId, [480, 720, 960, 1280, 1600]);

  /** "Nuestra historia" desplaza a la sección del proceso. */
  protected irAHistoria(): void {
    const destino = document.getElementById('proceso');
    if (!destino) {
      return;
    }
    destino.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'start' });
    destino.focus({ preventScroll: true });
  }
}
