import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const token = localStorage.getItem('firebaseToken');
  
  if (token) {
    console.log('🔐 Interceptor: Añadiendo token a la request');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  console.log('🔐 Interceptor: No hay token disponible');
  return next(req);
};