import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Origenes } from './origenes';

describe('Origenes', () => {
  let component: Origenes;
  let fixture: ComponentFixture<Origenes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Origenes],
    }).compileComponents();

    fixture = TestBed.createComponent(Origenes);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cafes', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
