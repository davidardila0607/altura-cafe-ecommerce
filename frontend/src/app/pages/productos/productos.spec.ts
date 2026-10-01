import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Cafes } from '../../core/services/cafes';
import { Variedades } from '../../core/services/variedades';
import { Presentaciones } from '../../core/services/presentaciones';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Productos } from './productos';

describe('Productos', () => {
  let component: Productos;
  let fixture: ComponentFixture<Productos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Cafes, useValue: { listar: () => of([]), obtener: () => of() } }, { provide: Variedades, useValue: { listar: () => of([]), obtener: () => of() } }, { provide: Presentaciones, useValue: { listar: () => of([]), obtener: () => of() } }],
      imports: [Productos],
    }).compileComponents();

    fixture = TestBed.createComponent(Productos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
