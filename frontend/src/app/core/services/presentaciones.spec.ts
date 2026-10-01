import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Presentaciones } from './presentaciones';

describe('Presentaciones', () => {
  let service: Presentaciones;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Presentaciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
