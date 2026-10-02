import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Cafe, CafeGuardar } from '../../../core/models/cafe';
import { Avisos } from '../../../core/services/avisos';
import { Cafes } from '../../../core/services/cafes';
import { ImagenSubida, Imagenes } from '../../../core/services/imagenes';
import { Presentaciones } from '../../../core/services/presentaciones';
import { Variedades } from '../../../core/services/variedades';
import { mensajeDeError } from '../../../core/utils/errores';
import { optimizarImagenCloudinary } from '../../../core/utils/imagenes';
import { normalizarTexto } from '../../../core/utils/texto';
import { entero } from '../../../core/utils/validadores';
import { AtraparFoco } from '../../../shared/atrapar-foco/atrapar-foco';
import { EstadoError } from '../../../shared/estado-error/estado-error';

/** Formatos y tamaño que acepta POST /api/images (se validan aquí antes de subir). */
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

type CampoCafe = 'nombre' | 'variedadId' | 'presentacionGramos' | 'origen' | 'stock' | 'precio';

/**
 * Inventario de cafés (/admin/inventario): lista con búsqueda, crear y editar en un panel
 * lateral (con imagen) y eliminar con confirmación. Los cambios se ven en la tienda al recargar.
 */
@Component({
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, CurrencyPipe, AtraparFoco, EstadoError],
  templateUrl: './inventario.html',
  styleUrls: ['../lista-admin.css', '../formulario-admin.css'],
})
export class Inventario {
  private readonly cafesApi = inject(Cafes);
  private readonly variedadesApi = inject(Variedades);
  private readonly presentacionesApi = inject(Presentaciones);
  private readonly imagenesApi = inject(Imagenes);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);

  protected readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });
  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });
  protected readonly presentaciones = rxResource({ stream: () => this.presentacionesApi.listar() });

  // ===== Lista y búsqueda =====
  protected readonly busqueda = signal('');
  protected readonly todos = computed(() => (this.cafes.hasValue() ? this.cafes.value() : []));
  protected readonly visibles = computed(() => {
    const texto = normalizarTexto(this.busqueda());
    return this.todos().filter(
      (c) => !texto || [c.nombre, c.origen, c.variedadNombre].some((campo) => normalizarTexto(campo).includes(texto)),
    );
  });

  protected miniatura(cafe: Cafe): string | null {
    return optimizarImagenCloudinary(cafe.imagenUrl, 'f_auto,q_auto,w_120');
  }

  // ===== Panel lateral: crear / editar =====
  private readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');
  /** Café que se edita; null cuando se crea uno nuevo. */
  protected readonly editando = signal<Cafe | null>(null);
  protected readonly enviado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorPanel = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    variedadId: [0, [Validators.min(1)]],
    presentacionGramos: [0, [Validators.min(1)]],
    origen: ['', [Validators.required, Validators.maxLength(100)]],
    stock: [0, [Validators.required, Validators.min(0), entero]],
    precio: [0, [Validators.required, Validators.min(1), entero]],
  });

  /** Archivo elegido y su vista previa (data URL en Base64, lista para POST /api/images). */
  protected readonly archivo = signal<File | null>(null);
  protected readonly vistaPrevia = signal<string | null>(null);
  protected readonly errorImagen = signal<string | null>(null);

  protected abrirNuevo(): void {
    this.prepararPanel(null);
    this.formulario.reset({ nombre: '', variedadId: 0, presentacionGramos: 0, origen: '', stock: 0, precio: 0 });
    this.panel().nativeElement.showModal();
  }

  protected abrirEdicion(cafe: Cafe): void {
    this.prepararPanel(cafe);
    this.formulario.reset({
      nombre: cafe.nombre,
      variedadId: cafe.variedadId,
      presentacionGramos: cafe.presentacionGramos,
      origen: cafe.origen,
      stock: cafe.stock,
      precio: cafe.precio,
    });
    this.vistaPrevia.set(optimizarImagenCloudinary(cafe.imagenUrl, 'f_auto,q_auto,w_240'));
    this.panel().nativeElement.showModal();
  }

  protected cerrarPanel(): void {
    this.panel().nativeElement.close();
  }

  protected mostrarError(campo: CampoCafe): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  /** Valida tipo y tamaño en el navegador y prepara la vista previa. */
  protected elegirImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;
    this.errorImagen.set(null);
    if (!archivo) {
      return;
    }
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG o WebP.');
      entrada.value = '';
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      this.errorImagen.set('La imagen no puede pesar más de 5 MB.');
      entrada.value = '';
      return;
    }
    // FileReader convierte el archivo en texto Base64 ("data:image/png;base64,...").
    const lector = new FileReader();
    lector.onload = () => {
      this.archivo.set(archivo);
      this.vistaPrevia.set(lector.result as string);
    };
    lector.readAsDataURL(archivo);
  }

  /**
   * Guardar: 1) si hay imagen nueva, se sube (POST /api/images) y se obtienen imageUrl y
   * publicId; 2) se crea o actualiza el café con esos datos. Si el paso 2 falla, la imagen
   * recién subida se borra para no dejarla huérfana en Cloudinary.
   */
  protected async guardar(): Promise<void> {
    this.enviado.set(true);
    this.errorPanel.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.panel().nativeElement.querySelector<HTMLElement>('.ng-invalid:not(form)')?.focus();
      return;
    }

    const actual = this.editando();
    let subida: ImagenSubida | null = null;
    this.guardando.set(true);
    try {
      let imagenUrl = actual?.imagenUrl ?? null;
      let imagenPublicId = actual?.imagenPublicId ?? null;
      const base64 = this.vistaPrevia();
      if (this.archivo() && base64) {
        subida = await firstValueFrom(this.imagenesApi.subir(base64));
        imagenUrl = subida.imageUrl;
        imagenPublicId = subida.publicId;
      }

      const valores = this.formulario.getRawValue();
      const datos: CafeGuardar = {
        nombre: valores.nombre.trim(),
        variedadId: Number(valores.variedadId),
        presentacionGramos: Number(valores.presentacionGramos),
        origen: valores.origen.trim(),
        stock: Number(valores.stock),
        precio: Number(valores.precio),
        imagenUrl,
        imagenPublicId,
      };

      if (actual) {
        await firstValueFrom(this.cafesApi.actualizar(actual.id, datos));
      } else {
        await firstValueFrom(this.cafesApi.crear(datos));
      }
      this.cerrarPanel();
      this.avisos.exito(actual ? `Café «${datos.nombre}» actualizado.` : `Café «${datos.nombre}» creado.`);
      this.cafes.reload();
    } catch (error) {
      if (subida) {
        this.imagenesApi.borrar(subida.publicId).subscribe({ error: () => undefined });
      }
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.cafes.reload(); // otro administrador lo eliminó: la lista se actualiza
      }
      this.errorPanel.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  private prepararPanel(cafe: Cafe | null): void {
    this.editando.set(cafe);
    this.enviado.set(false);
    this.errorPanel.set(null);
    this.errorImagen.set(null);
    this.archivo.set(null);
    this.vistaPrevia.set(null);
  }

  // ===== Eliminar con confirmación =====
  private readonly confirmacion = viewChild.required<ElementRef<HTMLDialogElement>>('confirmacion');
  protected readonly aEliminar = signal<Cafe | null>(null);
  protected readonly eliminando = signal(false);

  protected pedirEliminacion(cafe: Cafe): void {
    this.aEliminar.set(cafe);
    this.confirmacion().nativeElement.showModal();
  }

  protected cancelarEliminacion(): void {
    this.confirmacion().nativeElement.close();
  }

  protected async confirmarEliminacion(): Promise<void> {
    const cafe = this.aEliminar();
    if (!cafe) {
      return;
    }
    this.eliminando.set(true);
    try {
      await firstValueFrom(this.cafesApi.eliminar(cafe.id));
      this.avisos.exito(`Café «${cafe.nombre}» eliminado.`);
    } catch (error) {
      this.avisos.error(mensajeDeError(error));
    } finally {
      this.eliminando.set(false);
      this.confirmacion().nativeElement.close();
      this.cafes.reload();
    }
  }
}
