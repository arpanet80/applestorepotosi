// my-sales-detail.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MySalesService } from '../../services/my-sales.service';
import { Sale } from '../../models/sale.model';

@Component({
  selector: 'app-my-sales-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-sales-detail.component.html'
})
export class MySalesDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(MySalesService);

  sale: Sale | null = null;
  notes = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.service.one(id).subscribe(s => this.sale = s);
  }

  cancel() {
    if (!this.sale) return;
    this.service.cancel(this.sale._id, this.notes).subscribe(() => {
      this.router.navigate(['/my-sales']);
    });
  }
}