import { leerToken } from './token';

/** Arma un JWT de prueba (sin firma real): solo importa la parte central. */
function tokenDePrueba(claims: Record<string, unknown>): string {
  const base64url = (texto: string) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(texto)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(claims))}.firma`;
}

describe('leerToken', () => {
  it('traduce los claims de .NET (URIs largas) a nombre, correo, roles y expiración', () => {
    const token = tokenDePrueba({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '7',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'José Peña',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'jose@altura.test',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrador',
      exp: 2_000_000_000,
    });

    expect(leerToken(token)).toEqual({
      id: 7,
      nombre: 'José Peña',
      email: 'jose@altura.test',
      roles: ['Administrador'],
      expira: 2_000_000_000_000,
    });
  });

  it('acepta varios roles (la API los manda como lista)', () => {
    const token = tokenDePrueba({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['Administrador', 'Cliente'],
      exp: 1,
    });

    expect(leerToken(token).roles).toEqual(['Administrador', 'Cliente']);
  });
});
