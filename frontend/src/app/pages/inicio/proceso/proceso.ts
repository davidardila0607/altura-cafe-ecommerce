import { Component } from '@angular/core';
import { PASOS_PROCESO } from '../../../core/data/contenido-marca';
import { srcsetSitio, urlSitio } from '../../../core/utils/imagenes';
import { Revelar } from '../../../shared/revelar/revelar';

@Component({
  selector: 'app-proceso',
  imports: [Revelar],
  templateUrl: './proceso.html',
  styleUrl: './proceso.css',
})
export class Proceso {
  protected readonly pasos = PASOS_PROCESO.map((paso) => ({
    ...paso,
    src: urlSitio(paso.foto.publicId, 900),
    srcset: srcsetSitio(paso.foto.publicId, [480, 720, 960, 1280]),
  }));
}
