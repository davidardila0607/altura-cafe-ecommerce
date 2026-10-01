import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Variedades } from './variedades';

describe('Variedades', () => {
  let service: Variedades;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Variedades);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
