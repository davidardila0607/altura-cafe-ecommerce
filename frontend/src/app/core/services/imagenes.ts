import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Respuesta de POST /api/images (`ImagenSubidaDto`). */
export interface ImagenSubida {
  imageUrl: string;
  publicId: string;
}

/** Imágenes de producto en Cloudinary, a través de la API (requiere la sesión del panel). */
@Service()
export class Imagenes {
  private readonly http = inject(HttpClient);

  /** POST /api/images: sube una imagen en Base64 ("data:image/...;base64,..."). */
  subir(imagenBase64: string): Observable<ImagenSubida> {
    return this.http.post<ImagenSubida>(`${environment.apiBaseUrl}/images`, { imagenBase64 });
  }

  /** DELETE /api/images?publicId=…: borra una imagen subida que al final no se usó. */
  borrar(publicId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/images`, { params: { publicId } });
  }
}
