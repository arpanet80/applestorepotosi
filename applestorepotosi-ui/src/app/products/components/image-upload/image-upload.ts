import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.css']
})
export class ImageUploadComponent {
  private toastr = inject(ToastrService);
  // private productService = inject(ProductService);
  
  @Input() productId!: string;
  @Input() multiple = false;
  @Output() uploaded = new EventEmitter<File[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  files: File[] = [];
  previews: string[] = [];
  uploading = false;
  private readonly MAX_SIZE_BYTES = 4 * 1024 * 1024; // 5 MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length) this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    const validFiles: File[] = [];

    for (const file of files) {
      // Tipo
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.toastr.warning(`Tipo no permitido: ${file.type}`, 'Imagen ignorada');
        continue;
      }

      // Tamaño
      if (file.size > this.MAX_SIZE_BYTES) {
        this.toastr.error(
          `Imagen demasiado pesada: ${(file.size / 1024 / 1024).toFixed(2)} MB (máx 5 MB)`,
          'Imagen rechazada'
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      this.reset();
      return;
    }

    this.files = validFiles;
    this.previews = validFiles.map(f => URL.createObjectURL(f));
    this.uploaded.emit(validFiles);
    this.reset();
  }

  /*private handleFiles(files: File[]) {
    this.files = files;
    this.previews = files.map(f => URL.createObjectURL(f));
    this.uploaded.emit(files); // 👈 directamente
    this.reset();
  }*/

  cancel(): void {
    this.reset();
  }

  private reset(): void {
    // Liberar URLs temporales
    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.files = [];
    this.previews = [];
    this.fileInput.nativeElement.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files?.length) this.handleFiles(Array.from(files));
  }

  // onDrop(event: DragEvent): void {
  //   event.preventDefault();
  //   const files = event.dataTransfer?.files;
  //   if (files?.length) this.handleFiles(Array.from(files));
  // }

  // onDragOver(event: DragEvent): void {
  //   event.preventDefault();
  // }
  
}