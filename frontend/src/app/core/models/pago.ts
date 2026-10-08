/**
 * Pagos (guía 3, Wompi). Coinciden con los DTOs del backend (JSON en camelCase).
 */

/** Respuesta de POST /api/Pedido/{id}/PrepararPago (WompiPagoDto). */
export interface WompiPagoDto {
  publicKey: string;
  /** "PEDIDO-15" */
  reference: string;
  /** Total en centavos (45.000 COP = 4.500.000). */
  amountInCents: number;
  currency: string;
  /** SHA-256 calculado en el servidor; el secreto de integridad nunca llega al navegador. */
  integritySignature: string;
  redirectUrl: string;
  /** true: pasarela de pruebas de Altura (/pago/simulador); false: Web Checkout de Wompi. */
  modoSimulado: boolean;
}

/** Respuesta de SimularPago y ConfirmarPago. */
export interface ResultadoPago {
  estado: string | null;
  transactionId: string;
}
