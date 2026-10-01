import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Destacados } from './destacados';

describe('Destacados', () => {
  let component: Destacados;
  let fixture: ComponentFixture<Destacados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Destacados],
    }).compileComponents();

    fixture = TestBed.createComponent(Destacados);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cafes', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
