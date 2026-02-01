import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-technician-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technician-product-detail.component.html'
})
export class TechnicianProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProductService);

  product: Product | null = null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return this.goBack();
    this.service.findOne(id).subscribe({
      next: p => { this.product = p; this.loading = false; },
      error: () => this.goBack()
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard', 'technician-products']);
  }
}