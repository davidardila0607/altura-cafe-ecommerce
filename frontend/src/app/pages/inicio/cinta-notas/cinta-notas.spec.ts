import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cafe } from '../../../core/models/cafe';
import { CintaNotas } from './cinta-notas';

const cafe = (id: number, variedadNombre: string, origen: string): Cafe => ({
  id, nombre: `Café ${id}`, variedadId: 1, variedadNombre, procesoId: 1, procesoNombre: 'Lavado', presentacionGramos: 340, origen, stock: 5,
  precio: 40000, imagenUrl: null, imagenPublicId: null, disponible: true, estadoStock: 'Pocas unidades',
});

describe('CintaNotas', () => {
  let fixture: ComponentFixture<CintaNotas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CintaNotas] }).compileComponents();
    fixture = TestBed.createComponent(CintaNotas);
  });

  it('sin cafés no muestra la cinta', async () => {
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.cinta')).toBeNull();
  });

  it('junta orígenes y notas de cata sin repetir (dos vueltas para el bucle)', async () => {
    fixture.componentRef.setInput('cafes', [cafe(1, 'Geisha', 'Huila'), cafe(2, 'Geisha', 'Huila, Colombia')]);
    await fixture.whenStable();
    const palabras = [...fixture.nativeElement.querySelectorAll('.palabra')].map((e: Element) => e.textContent?.trim());
    // Huila + 3 notas de Geisha = 4 palabras, repetidas dos veces.
    expect(palabras).toEqual(['Huila', 'Jazmín', 'Bergamota', 'Fruta de hueso', 'Huila', 'Jazmín', 'Bergamota', 'Fruta de hueso']);
  });
});
