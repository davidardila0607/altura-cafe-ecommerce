import { of } from 'rxjs';
import { Cafes } from '../../core/services/cafes';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VistaRapida } from './vista-rapida';

describe('VistaRapida', () => {
  let component: VistaRapida;
  let fixture: ComponentFixture<VistaRapida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: Cafes, useValue: { listar: () => of([]), obtener: () => of() } }],
      imports: [VistaRapida],
    }).compileComponents();

    fixture = TestBed.createComponent(VistaRapida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
