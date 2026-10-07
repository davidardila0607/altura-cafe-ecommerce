import { convertToParamMap } from '@angular/router';
import { Cafe } from '../../core/models/cafe';
import { aplicarFiltros, contarFiltrosActivos, contarPor, FILTROS_VACIOS, filtrosAUrl, filtrosDesdeUrl } from './catalogo';

const cafe = (id: number, variedadNombre: string, procesoNombre: string, presentacionGramos: number): Cafe => ({
  id, nombre: `Café ${id}`, variedadId: 1, variedadNombre, procesoId: 1, procesoNombre, presentacionGramos,
  origen: 'Huila', stock: 10, precio: 40000 + id, imagenUrl: null, imagenPublicId: null, usuarioId: 1, usuarioNombre: 'Administración', disponible: true,
  estadoStock: 'Disponible',
});

const cafes = [
  cafe(1, 'Bourbon Rosado', 'Honey', 340),
  cafe(2, 'Bourbon Rosado', 'Lavado', 340),
  cafe(3, 'Bourbon Rosado', 'Honey', 500),
  cafe(4, 'Caturra', 'Honey', 340),
];

describe('catálogo', () => {
  it('lee y escribe el proceso en la URL (normalizado)', () => {
    const filtros = filtrosDesdeUrl(convertToParamMap({ variedad: 'Bourbon Rosado', proceso: 'Honey', presentacion: '340' }));
    expect(filtros.variedad).toBe('bourbon rosado');
    expect(filtros.proceso).toBe('honey');
    expect(contarFiltrosActivos(filtros)).toBe(3);
    expect(filtrosAUrl(filtros)).toEqual(expect.objectContaining({ proceso: 'honey', variedad: 'bourbon rosado', presentacion: 340 }));
  });

  it('combina variedad, proceso y presentación', () => {
    const filtros = { ...FILTROS_VACIOS, variedad: 'bourbon rosado', proceso: 'honey', presentacion: 340 };
    expect(aplicarFiltros(cafes, filtros).map((c) => c.id)).toEqual([1]);
  });

  it('el buscador también encuentra por proceso y por variedad', () => {
    expect(aplicarFiltros(cafes, { ...FILTROS_VACIOS, q: 'honey' }).length).toBe(3);
    expect(aplicarFiltros(cafes, { ...FILTROS_VACIOS, q: 'rosado' }).length).toBe(3);
  });

  it('cuenta cafés por proceso', () => {
    expect(contarPor(cafes, 'procesoNombre')).toEqual({ honey: 3, lavado: 1 });
  });
});
