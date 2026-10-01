import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IlustracionBolsas } from './ilustracion-bolsas';

describe('IlustracionBolsas', () => {
  let component: IlustracionBolsas;
  let fixture: ComponentFixture<IlustracionBolsas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IlustracionBolsas],
    }).compileComponents();

    fixture = TestBed.createComponent(IlustracionBolsas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
