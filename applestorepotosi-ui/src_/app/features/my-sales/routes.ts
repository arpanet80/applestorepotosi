import { Route } from '@angular/router';
import { MySalesListComponent } from './components/my-sales-list/my-sales-list.component';
import { MySalesDetailComponent } from './components/my-sales-detail/my-sales-detail.component';

export const MY_SALES_ROUTES: Route[] = [
  { path: '', component: MySalesListComponent },
  { path: ':id', component: MySalesDetailComponent },
];