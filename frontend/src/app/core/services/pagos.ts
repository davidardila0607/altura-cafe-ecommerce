import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultadoPago, WompiPagoDto } from '../models/pago';

/** Dirección del Web Checkout de Wompi (docs.wompi.co, "Widget & Checkout Web"). */
const CHECKOUT_WOMPI = 'https://checkout.wompi.co/p/';

/**
 * Al ir a Wompi real, el pedido se guarda aquí: Wompi vuelve a /pago/resultado solo con
 * ?id=<transacción>, sin el número del pedido.
 */
export const CLAVE_PEDIDO_EN_PAGO = 'altura.pedidoEnPago';

/**
 * URL del Web Checkout con los parámetros que pide Wompi (los nombres son los de su
 * documentación, con guiones y dos puntos). La firma la calculó el backend.
 */
export function urlCheckoutWompi(pago: WompiPagoDto): string {
  const parametros = new URLSearchParams({
    'public-key': pago.publicKey,
    currency: pago.currency,
    'amount-in-cents': String(pago.amountInCents),
    reference: pago.reference,
    'signature:integrity': pago.integritySignature,
    'redirect-url': pago.redirectUrl,
  });
  return `${CHECKOUT_WOMPI}?${parametros}`;
}

/**
 * Pagos de pedidos (guía 3). PrepararPago devuelve los datos firmados; según modoSimulado se va
 * a la pasarela de pruebas de Altura o al checkout de Wompi.
 */
@Service()
export class Pagos {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiBaseUrl}/Pedido`;

  /** POST /api/Pedido/{id}/PrepararPago (404 si no existe; 409 si ya está pagado o sin stock). */
  preparar(pedidoId: number): Promise<WompiPagoDto> {
    return firstValueFrom(this.http.post<WompiPagoDto>(`${this.url}/${pedidoId}/PrepararPago`, null));
  }

  /** POST /api/Pedido/{id}/SimularPago (solo en modo simulación). */
  simular(pedidoId: number, aprobado: boolean): Promise<ResultadoPago> {
    return firstValueFrom(this.http.post<ResultadoPago>(`${this.url}/${pedidoId}/SimularPago`, { aprobado }));
  }

  /** POST /api/Pedido/{id}/ConfirmarPago (Wompi real: la API consulta la transacción). */
  confirmar(pedidoId: number, transactionId: string): Promise<ResultadoPago> {
    return firstValueFrom(this.http.post<ResultadoPago>(`${this.url}/${pedidoId}/ConfirmarPago`, { transactionId }));
  }

  /** Prepara el pago y lleva a la pasarela que corresponda. Lanza el error de la API si falla. */
  async pagar(pedidoId: number): Promise<void> {
    const pago = await this.preparar(pedidoId);

    if (pago.modoSimulado) {
      await this.router.navigate(['/pago/simulador'], {
        queryParams: {
          pedido: pedidoId,
          referencia: pago.reference,
          monto: pago.amountInCents,
          firma: pago.integritySignature,
        },
      });
      return;
    }

    try {
      sessionStorage.setItem(CLAVE_PEDIDO_EN_PAGO, String(pedidoId));
    } catch {
      // Sin almacenamiento la página de resultado solo podrá mostrar un mensaje general.
    }
    window.location.assign(urlCheckoutWompi(pago));
  }
}
