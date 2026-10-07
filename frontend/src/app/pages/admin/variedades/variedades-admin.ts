import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Variedad, VariedadGuardar } from '../../../core/models/variedad';
import { Avisos } from '../../../core/services/avisos';
import { Cafes } from '../../../core/services/cafes';
import { Variedades } from '../../../core/services/variedades';
import { mensajeDeError } from '../../../core/utils/errores';
import { contarCafes } from '../../../core/utils/texto';
import { AtraparFoco } from '../../../shared/atrapar-foco/atrapar-foco';
import { EstadoError } from '../../../shared/estado-error/estado-error';

/**
 * Variedades (/admin/variedades): crear, editar y eliminar. La API no deja eliminar una
 * variedad con cafés asociados (409); ese mensaje se muestra tal cual.
 */
@Component({
  selector: 'app-variedades-admin',
  imports: [ReactiveFormsModule, AtraparFoco, EstadoError],
  templateUrl: './variedades-admin.html',
  styleUrls: ['../lista-admin.css', '../formulario-admin.css'],
})
export class VariedadesAdmin {
  private readonly variedadesApi = inject(Variedades);
  private readonly cafesApi = inject(Cafes);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);

  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });
  /** Los cafés solo se usan para mostrar cuántos tiene cada variedad. */
  private readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });

  protected readonly filas = computed(() => {
    const cafes = this.cafes.hasValue() ? this.cafes.value() : [];
    return (this.variedades.hasValue() ? this.variedades.value() : []).map((v) => ({
      ...v,
      conteo: contarCafes(cafes.filter((c) => c.variedadId === v.id).length),
    }));
  });

  // ===== Panel lateral =====
  private readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');
  protected readonly editando = signal<Variedad | null>(null);
  protected readonly enviado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorPanel = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
  });

  protected abrir(variedad: Variedad | null): void {
    this.editando.set(variedad);
    this.enviado.set(false);
    this.errorPanel.set(null);
    this.formulario.reset({ nombre: variedad?.nombre ?? '', descripcion: variedad?.descripcion ?? '' });
    this.panel().nativeElement.showModal();
  }

  protected cerrarPanel(): void {
    this.panel().nativeElement.close();
  }

  protected mostrarErrorNombre(): boolean {
    const control = this.formulario.controls.nombre;
    return control.invalid && (control.touched || this.enviado());
  }

  protected async guardar(): Promise<void> {
    this.enviado.set(true);
    this.errorPanel.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.panel().nativeElement.querySelector<HTMLElement>('#variedad-nombre')?.focus();
      return;
    }

    const { nombre, descripcion } = this.formulario.getRawValue();
    const datos: VariedadGuardar = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
    const actual = this.editando();
    this.guardando.set(true);
    try {
      if (actual) {
        await firstValueFrom(this.variedadesApi.actualizar(actual.id, datos));
      } else {
        await firstValueFrom(this.variedadesApi.crear(datos));
      }
      this.cerrarPanel();
      this.avisos.exito(actual ? `Variedad «${datos.nombre}» actualizada.` : `Variedad «${datos.nombre}» creada.`);
      this.variedades.reload();
    } catch (error) {
      this.errorPanel.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  // ===== Eliminar con confirmación =====
  private readonly confirmacion = viewChild.required<ElementRef<HTMLDialogElement>>('confirmacion');
  protected readonly aEliminar = signal<Variedad | null>(null);
  protected readonly eliminando = signal(false);

  protected pedirEliminacion(variedad: Variedad): void {
    this.aEliminar.set(variedad);
    this.confirmacion().nativeElement.showModal();
  }

  protected cancelarEliminacion(): void {
    this.confirmacion().nativeElement.close();
  }

  protected async confirmarEliminacion(): Promise<void> {
    const variedad = this.aEliminar();
    if (!variedad) {
      return;
    }
    this.eliminando.set(true);
    try {
      await firstValueFrom(this.variedadesApi.eliminar(variedad.id));
      this.avisos.exito(`Variedad «${variedad.nombre}» eliminada.`);
    } catch (error) {
      this.avisos.error(mensajeDeError(error));
    } finally {
      this.eliminando.set(false);
      this.confirmacion().nativeElement.close();
      this.variedades.reload();
    }
  }
}
