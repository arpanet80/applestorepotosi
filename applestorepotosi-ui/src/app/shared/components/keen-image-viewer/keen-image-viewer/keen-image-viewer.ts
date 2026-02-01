import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-keen-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keen-image-viewer.html',
  styleUrls: ['./keen-image-viewer.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class KeenImageViewerComponent {
  @Input() images: string[] = [];

  selectedIndex = 0;
  zoomPosition = { x: 0, y: 0 };
  showZoom = false;

  /* ---------- Swiper ---------- */
  onSlideChange(e: CustomEvent): void {
    const swiper = (e.target as any).swiper;
    this.selectedIndex = swiper.realIndex;
  }

  /* ---------- Zoom ---------- */
  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.zoomPosition = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    };
  }

  /* ---------- Navegación ---------- */
  next(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.images.length;
  }
  prev(): void {
    this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length;
  }
  selectImage(index: number): void {
    this.selectedIndex = index;
  }
}