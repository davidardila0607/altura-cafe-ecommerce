import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  protected readonly anio = new Date().getFullYear();
}
