// src/app/brands/components/logo-upload/logo-upload.component.ts
import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-upload.component.html',
  styleUrls: ['./logo-upload.component.css']
})
export class LogoUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() cancelled = new EventEmitter<void>();

  preview: string | null = null;
  private selectedFile: File | null = null;
  private readonly MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      alert('Formato no permitido. Usa JPG, PNG o WebP.');
      this.reset();
      return;
    }

    // Validar tamaño
    if (file.size > this.MAX_SIZE_BYTES) {
      alert('Imagen demasiado pesada (máx 4 MB).');
      this.reset();
      return;
    }

    this.selectedFile = file;
    this.preview = URL.createObjectURL(file);
    this.fileSelected.emit(file);
  }

  cancel(): void {
    this.reset();
    this.cancelled.emit();
  }

  private reset(): void {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.preview = null;
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.onFileSelected({ target: { files: [file] } } as any);
  }
  
}