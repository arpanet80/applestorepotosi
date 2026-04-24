import { NestFactory } from '@nestjs/core';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';

/////////////////////////////////////////////////////////////////////////////////////////
/////// Genera el usuario: Público General  /IMPORTANTE!!!()                           //
/////// EJECUTAR:                                                                      //
/////// npx ts-node -r tsconfig-paths/register src/scripts/seed.publico-general.ts     //
/////////////////////////////////////////////////////////////////////////////////////////
async function seed() {
//   const app = await NestFactory.createApplicationContext(
//     MongooseModule.forRoot(process.env.MONGO_URI),
//   );

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const customerModel: Model<Customer> = app.get(getModelToken(Customer.name));

  const publicoGeneral = await customerModel.findOne({ isPublicGeneral: true });
  if (!publicoGeneral) {
    await customerModel.create({
      fullName: 'Público General',
      email: 'publico.general@default.local',
      phone: '00000000',
      isPublicGeneral: true, // flag único
    });
    console.log('✅ Cliente “Público General” creado');
  } else {
    console.log('✔ Ya existe “Público General”');
  }
  await app.close();
}
seed();