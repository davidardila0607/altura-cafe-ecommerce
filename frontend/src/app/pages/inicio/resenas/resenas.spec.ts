import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RESENAS } from '../../../core/data/resenas';
import { Resenas } from './resenas';

describe('Resenas', () => {
  let fixture: ComponentFixture<Resenas>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Resenas] }).compileComponents();
    fixture = TestBed.createComponent(Resenas);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('muestra el título, el promedio y la rueda con las 10 reseñas más su copia oculta', () => {
    expect(elemento.querySelector('h2')?.textContent).toContain('Lo que dicen de Altura');
    expect(elemento.querySelector('.numero')?.textContent?.trim()).toBe('4,8');
    const listas = elemento.querySelectorAll('.rueda .lista');
    expect(listas.length).toBe(4); // 2 columnas × (original + copia)
    const visibles = [...listas].filter((l) => l.getAttribute('aria-hidden') !== 'true');
    expect(visibles.reduce((n, l) => n + l.querySelectorAll('li').length, 0)).toBe(RESENAS.length);
    expect(elemento.querySelector('.estrellas .visually-hidden, app-tarjeta-resena .visually-hidden')?.textContent).toMatch(/de 5 estrellas/);
  });

  it('el botón pausa y reanuda la rueda', () => {
    const boton = elemento.querySelector<HTMLButtonElement>('.pausa')!;
    boton.click();
    fixture.detectChanges();
    expect(elemento.querySelector('.rueda')?.classList).toContain('pausada');
    expect(boton.textContent).toContain('Reanudar reseñas');
  });
});
