import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'objectUrl', standalone: true })
export class ObjectUrlPipe implements PipeTransform {
  transform(file: File): string {
    return URL.createObjectURL(file);
  }
}