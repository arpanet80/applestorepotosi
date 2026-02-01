export interface StatCard {
  icon: string;              // clase de icono (bi, ki, fa...)
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  value: number | string;
  label: string;
}