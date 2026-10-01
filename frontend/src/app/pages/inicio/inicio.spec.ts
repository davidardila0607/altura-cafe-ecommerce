import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Cafes } from '../../core/services/cafes';
import { Variedades } from '../../core/services/variedades';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Cafes, useValue: { listar: () => of([]), obtener: () => of() } }, { provide: Variedades, useValue: { listar: () => of([]), obtener: () => of() } }],
      imports: [Inicio],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
