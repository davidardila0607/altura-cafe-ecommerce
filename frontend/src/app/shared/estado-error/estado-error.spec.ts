import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoError } from './estado-error';

describe('EstadoError', () => {
  let component: EstadoError;
  let fixture: ComponentFixture<EstadoError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoError],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoError);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
