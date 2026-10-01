import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaCafe } from './tarjeta-cafe';

describe('TarjetaCafe', () => {
  let component: TarjetaCafe;
  let fixture: ComponentFixture<TarjetaCafe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaCafe],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaCafe);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cafe', {
      id: 1, nombre: 'Café de prueba', variedadId: 1, variedadNombre: 'Castillo', presentacionGramos: 340,
      origen: 'Huila', stock: 3, precio: 42000, imagenUrl: null, imagenPublicId: null,
      disponible: true, estadoStock: 'Pocas unidades',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el stock bajo y emite el café completo al pulsar "Ver producto"', () => {
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.querySelector('.disponibilidad')?.textContent).toContain('Quedan 3');

    let emitido: unknown = null;
    component.ver.subscribe((cafe) => (emitido = cafe));
    elemento.querySelector<HTMLButtonElement>('button.ver')!.click();
    expect(emitido).toEqual(expect.objectContaining({ id: 1, nombre: 'Café de prueba' }));
  });
});
