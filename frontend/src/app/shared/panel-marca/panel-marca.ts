import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IlustracionBolsas } from '../ilustracion-bolsas/ilustracion-bolsas';
import { Logo } from '../logo/logo';

/** Panel izquierdo de Login y Registro. En móvil se reduce a un encabezado. */
@Component({
  selector: 'app-panel-marca',
  imports: [RouterLink, Logo, IlustracionBolsas],
  templateUrl: './panel-marca.html',
  styleUrl: './panel-marca.css',
})
export class PanelMarca {
  readonly frase = input('Café de origen, tostado para ti');
}
