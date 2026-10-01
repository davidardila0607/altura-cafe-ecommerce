import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FOTOS_SITIO } from '../../core/data/contenido-marca';
import { srcsetSitio, urlSitio } from '../../core/utils/imagenes';
import { Logo } from '../logo/logo';

/** Panel de marca de Login y Registro: fotografía protagonista. En móvil se reduce a un encabezado. */
@Component({
  selector: 'app-panel-marca',
  imports: [RouterLink, Logo],
  templateUrl: './panel-marca.html',
  styleUrl: './panel-marca.css',
})
export class PanelMarca {
  readonly frase = input('Café de origen, tostado para ti');

  protected readonly foto = FOTOS_SITIO.acceso;
  protected readonly src = urlSitio(this.foto.publicId, 1200);
  protected readonly srcset = srcsetSitio(this.foto.publicId, [480, 800, 1200, 1600]);
}
