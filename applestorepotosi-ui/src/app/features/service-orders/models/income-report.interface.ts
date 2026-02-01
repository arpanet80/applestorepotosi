import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* interfaz idéntica a la respuesta del backend */
export interface IncomeReport {
  orderCount: number;
  totalLabor: number;
  totalParts: number;
  totalInvoiced: number;
  grossMargin: number;
}
