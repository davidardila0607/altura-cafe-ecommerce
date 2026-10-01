import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Cafes } from './cafes';

describe('Cafes', () => {
  let service: Cafes;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Cafes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
