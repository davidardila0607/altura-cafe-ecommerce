import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Variedades } from './variedades';

describe('Variedades', () => {
  let component: Variedades;
  let fixture: ComponentFixture<Variedades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Variedades],
    }).compileComponents();

    fixture = TestBed.createComponent(Variedades);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('variedades', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
