import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MySalesService, PaginatedResponse } from '../../services/my-sales.service';
import { Sale } from '../../models/sale.model';
import { SaleStatus } from '../../../sales/models/sale.model';

@Component({
  selector: 'app-my-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-sales-list.component.html'
})
export class MySalesListComponent implements OnInit {
  private service = inject(MySalesService);

  saleStatus = SaleStatus; // ← para usar en template

  data: Sale[] = [];
  total = 0;
  page = 1;
  limit = 5;
  totalPages = 0;

  startDate = '';
  endDate = '';
  selectedStatus = '';
  search = '';

  ngOnInit() {
    this.load();
  }

  load() {
    const start = this.startDate ? new Date(this.startDate) : undefined;
    const end = this.endDate ? new Date(this.endDate) : undefined;

    this.service.list(this.page, this.limit, start, end, this.search, this.selectedStatus)
      .subscribe({
        next: (res: PaginatedResponse<Sale>) => {
          this.data = res.data;
          console.log("🚀 ~ MySalesListComponent ~ load ~ data:", this.data)
          this.total = res.total;
          this.totalPages = res.totalPages;
        }
      });
  }

  resetPage() {
    this.page = 1;
    this.load();
  }

  prev() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  next() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}