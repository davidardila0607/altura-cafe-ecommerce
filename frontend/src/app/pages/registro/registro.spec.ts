import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Registro } from './registro';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [Registro],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el medidor sube con la seguridad de la contraseña', async () => {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('#registro-contrasena');
    const llenos = () => fixture.nativeElement.querySelectorAll('.medidor .lleno').length;

    campo.value = 'abc';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(llenos()).toBe(0);

    campo.value = 'montana7';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(llenos()).toBe(2); // 6+ caracteres y un número

    campo.value = 'Montana7cafe';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(llenos()).toBe(4);
    expect(fixture.nativeElement.querySelector('#registro-contrasena-ayuda').textContent).toContain('fuerte');
  });
});
