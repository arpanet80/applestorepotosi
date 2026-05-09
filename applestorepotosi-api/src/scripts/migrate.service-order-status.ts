import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { ServiceOrder, ServiceOrderSchema } from '../service-orders/schemas/service-order.schema';
import { ServiceOrderStatus } from '../service-orders/enums/service-order-status.enum';

/////////////////////////////////////////////////////////////////////////////////////////
/////// MIGRACIÓN DE ESTADOS DE ÓRDENES DE SERVICIO (7 estados → 4 estados)
///////
/////// FLUJO SIMPLIFICADO:
///////   PENDIENTE → EN_PROCESO → COMPLETADA
///////        ↓           ↓
///////     CANCELADA ←─┘
///////
/////// MAPEO:
///////   INGRESADO, DIAGNOSTICADO  →  PENDIENTE
///////   APROBADO, REPARADO        →  EN_PROCESO
///////   ENTREGADO, FINALIZADO     →  COMPLETADA
///////   CANCELADO                 →  CANCELADA
///////
/////// EJECUTAR:
/////// npx ts-node -r tsconfig-paths/register src/scripts/migrate.service-order-status.ts
///////
/////// ⚠️ HACER BACKUP DE LA BASE DE DATOS ANTES DE EJECUTAR
/////////////////////////////////////////////////////////////////////////////////////////

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orderModel: Model<ServiceOrder> = app.get(getModelToken(ServiceOrder.name));

  console.log('🚀 Iniciando migración de estados de órdenes de servicio...\n');

  // Definir el mapeo de migración
  const migrationMap: Record<string, ServiceOrderStatus> = {
    ingresado: ServiceOrderStatus.PENDIENTE,
    diagnosticado: ServiceOrderStatus.PENDIENTE,
    aprobado: ServiceOrderStatus.EN_PROCESO,
    reparado: ServiceOrderStatus.EN_PROCESO,
    entregado: ServiceOrderStatus.COMPLETADA,
    finalizado: ServiceOrderStatus.COMPLETADA,
    cancelado: ServiceOrderStatus.CANCELADA,
  };

  let totalUpdated = 0;
  const errors: string[] = [];

  // Mostrar resumen antes de migrar
  console.log('📊 Conteo de órdenes por estado ACTUAL:');
  for (const oldStatus of Object.keys(migrationMap)) {
    const count = await orderModel.countDocuments({ status: oldStatus });
    const newStatus = migrationMap[oldStatus];
    console.log(`   "${oldStatus}" → "${newStatus}": ${count} órdenes`);
  }
  console.log('');

  // Ejecutar migración
  for (const [oldStatus, newStatus] of Object.entries(migrationMap)) {
    try {
      const result = await orderModel.updateMany(
        { status: oldStatus },
        { $set: { status: newStatus } }
      );

      const modified = result.modifiedCount || 0;
      totalUpdated += modified;

      if (modified > 0) {
        console.log(`✅ "${oldStatus}" → "${newStatus}": ${modified} órdenes actualizadas`);
      } else {
        console.log(`⚪ "${oldStatus}" → "${newStatus}": sin órdenes para migrar`);
      }
    } catch (err: any) {
      const msg = `❌ Error migrando "${oldStatus}" → "${newStatus}": ${err.message}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 RESUMEN DE MIGRACIÓN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total órdenes actualizadas: ${totalUpdated}`);
  console.log(`   Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n   Errores encontrados:');
    errors.forEach(e => console.log(`   ${e}`));
  }

  // Verificación final
  console.log('\n📊 Conteo de órdenes por estado DESPUÉS de migración:');
  const newStatuses = [
    ServiceOrderStatus.PENDIENTE,
    ServiceOrderStatus.EN_PROCESO,
    ServiceOrderStatus.COMPLETADA,
    ServiceOrderStatus.CANCELADA,
  ];

  for (const status of newStatuses) {
    const count = await orderModel.countDocuments({ status });
    console.log(`   "${status}": ${count} órdenes`);
  }

  // Verificar si quedaron estados huérfanos (no debería)
  const orphanCount = await orderModel.countDocuments({
    status: { $nin: newStatuses }
  });

  if (orphanCount > 0) {
    console.log(`\n⚠️  ATENCIÓN: ${orphanCount} órdenes tienen estados no reconocidos`);
  } else {
    console.log('\n✅ No hay órdenes con estados huérfanos');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ MIGRACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════');

  await app.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('💥 Error fatal durante la migración:', err);
  process.exit(1);
});