// src/audit-logs/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs.service';
import { AuditCollection, AuditAction, AUDIT_COLLECTIONS, AUDIT_ACTIONS } from '../schemas/audit-log.schema';

// Extender el tipo Request para incluir la propiedad user
interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AuditLogsService)
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<AuthenticatedRequest>();
    
    // Obtener los datos de la request de manera segura
    const method = request.method;
    const url = request.url;
    const body = (request as any).body;
    const params = (request as any).params;
    const query = (request as any).query;
    const user = (request as any).user; // CORRECCIÓN: Usar any para acceder a user
    const ip = (request as any).ip || (request as any).connection?.remoteAddress;
    const userAgent = (request as any).get?.('User-Agent') || (request as any).headers?.['user-agent'];

    // Solo auditar métodos que modifican datos
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const action = this.getActionFromMethod(method);
    const collection = this.getCollectionFromUrl(url);

    const before = this.sanitizeData(body);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          if (user && this.isValidCollection(collection) && this.isValidAction(action)) {
            const sanitizedResponse = this.sanitizeData(response);
            
            await this.auditLogsService.logAction(
              user.uid || user._id || user.id || user.sub, // Múltiples opciones para obtener el ID
              collection,
              action,
              params?.id,
              before,
              sanitizedResponse,
              `${method} ${url}`,
              ip,
              userAgent
            );
          }
        } catch (error) {
          // No romper el flujo si falla la auditoría
          console.error('Error en auditoría automática:', error);
        }
      })
    );
  }

  private getActionFromMethod(method: string): AuditAction {
    const methodActions: Record<string, AuditAction> = {
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    return methodActions[method] || 'read';
  }

  private getCollectionFromUrl(url: string): AuditCollection {
    const segments = url.split('/').filter(segment => segment);
    
    // Mapeo de rutas API a colecciones
    const routeMappings: Record<string, AuditCollection> = {
      // Autenticación y usuarios
      'auth': 'users',
      'users': 'users',
      'profile': 'users',
      
      // Productos e inventario
      'products': 'products',
      'categories': 'categories',
      'brands': 'brands',
      'suppliers': 'suppliers',
      'inventory': 'products',
      
      // Ventas y clientes
      'customers': 'customers',
      'sales': 'sales',
      'orders': 'sales',
      
      // Compras y proveedores
      'purchase-orders': 'purchase_orders',
      'purchases': 'purchase_orders',
      
      // Stock y movimientos
      'stock-movements': 'stock_movements',
      'stock': 'stock_movements',
      'inventory-movements': 'stock_movements',
      
      // Configuración
      'settings': 'settings',
      'config': 'settings'
    };

    // Buscar en todos los segmentos por una coincidencia
    for (const segment of segments) {
      if (routeMappings[segment]) {
        return routeMappings[segment];
      }
    }

    return 'users'; // Valor por defecto
  }

  private isValidCollection(collection: string): collection is AuditCollection {
    return AUDIT_COLLECTIONS.includes(collection as AuditCollection);
  }

  private isValidAction(action: string): action is AuditAction {
    return AUDIT_ACTIONS.includes(action as AuditAction);
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'creditCard', 
      'rfc', 'curp', 'bankAccount', 'pin', 'securityCode',
      'accessToken', 'refreshToken', 'authorization'
    ];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
      }
      
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.includes(key.toLowerCase())) {
            result[key] = '***REDACTED***';
          } else {
            result[key] = sanitize(value);
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitize(data);
  }
}