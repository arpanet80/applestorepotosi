require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testDockerConnection() {
  const uri = process.env.MONGODB_URI || 'mongodb://applestore_admin:Passw0rd@10.51.104.80:27017/applestorepotosi?authSource=applestorepotosi';
  
  console.log('🔗 Probando conexión a MongoDB Docker...');
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('✅ Conexión exitosa a MongoDB en Docker');
    
    // Listar colecciones
    const collections = await client.db().listCollections().toArray();
    console.log('📁 Colecciones:');
    collections.forEach(collection => console.log(`   - ${collection.name}`));
    
    // Probar escritura
    const testDoc = await client.db().collection('usuarios').insertOne({
      test: true,
      timestamp: new Date()
    });
    console.log('✅ Escritura testeada - Documento ID:', testDoc.insertedId);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 El usuario applestore_user no existe o la contraseña es incorrecta.');
      console.log('   Ejecuta estos comandos:');
      console.log(`
docker exec -it mongodb-applestorepotosi mongosh -u admin -p password123 --authenticationDatabase admin

use applestorepotosi
db.createUser({
  user: "applestore_user",
  pwd: "applestore123",
  roles: [
    { role: "readWrite", db: "applestorepotosi" },
    { role: "dbAdmin", db: "applestorepotosi" }
  ]
})
      `);
    }
  }
}

testDockerConnection();