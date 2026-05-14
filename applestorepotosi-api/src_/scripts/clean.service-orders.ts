import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { ServiceOrder, ServiceOrderSchema } from '../service-orders/schemas/service-order.schema';

/////////////////////////////////////////////////////////////////////////////////////////
/////// ELIMINACIÓN TOTAL DE ÓRDENES DE SERVICIO (LIMPIEZA)
///////
/////// ⚠️⚠️⚠️ ADVERTENCIA: ESTA ACCIÓN ES IRREVERSIBLE ⚠️⚠️⚠️
///////
/////// Este script elimina TODAS las órdenes de servicio de la base de datos
/////// y reinicia el contador de números de orden.
///////
/////// EJECUTAR:
/////// npx ts-node -r tsconfig-paths/register src/scripts/clean.service-orders.ts
///////
/////// HACER BACKUP ANTES DE EJECUTAR
/////////////////////////////////////////////////////////////////////////////////////////

async function clean() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orderModel: Model<ServiceOrder> = app.get(getModelToken(ServiceOrder.name));

  console.log('🗑️  Iniciando limpieza de órdenes de servicio...\n');

  // 1. Contar órdenes antes de eliminar
  const countBefore = await orderModel.countDocuments();
  console.log(`📊 Órdenes existentes: ${countBefore}`);

  if (countBefore === 0) {
    console.log('✅ No hay órdenes para eliminar');
    await app.close();
    process.exit(0);
  }

  // 2. Mostrar resumen por estado
  const statuses = ['pendiente', 'en_proceso', 'completada', 'cancelada'];
  console.log('\n📋 Distribución por estado:');
  for (const status of statuses) {
    const count = await orderModel.countDocuments({ status });
    console.log(`   ${status}: ${count}`);
  }

  // 3. Confirmación (en producción, pedir confirmación)
  // Descomentar las siguientes líneas si quieres confirmación interactiva:
  // const readline = require('readline');
  // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // const answer = await new Promise(resolve => rl.question('¿Confirmar eliminación? (yes/no): ', resolve));
  // rl.close();
  // if (answer.toLowerCase() !== 'yes') { console.log('Cancelado'); await app.close(); process.exit(0); }

  // 4. Eliminar todas las órdenes
  console.log('\n🗑️  Eliminando órdenes...');
  const deleteResult = await orderModel.deleteMany({});
  console.log(`✅ Órdenes eliminadas: ${deleteResult.deletedCount}`);

  // 5. Reiniciar contador de números de orden
  console.log('\n🔄 Reiniciando contador de números de orden...');
  const conn = orderModel.db;
  const counterCollection = conn.collection('service_order_counters');
  const counterResult = await counterCollection.deleteMany({});
  console.log(`✅ Contadores reiniciados: ${counterResult.deletedCount} registros eliminados`);

  // 6. Verificación final
  const countAfter = await orderModel.countDocuments();
  console.log(`\n📊 Órdenes restantes: ${countAfter}`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ LIMPIEZA COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📝 Resumen:');
  console.log(`   • Órdenes eliminadas: ${deleteResult.deletedCount}`);
  console.log(`   • Contadores reiniciados: ${counterResult.deletedCount}`);
  console.log('   • La siguiente orden tendrá número: OS-YYYYMMDD-0001');

  await app.close();
  process.exit(0);
}

clean().catch((err) => {
  console.error('💥 Error durante la limpieza:', err);
  process.exit(1);
});