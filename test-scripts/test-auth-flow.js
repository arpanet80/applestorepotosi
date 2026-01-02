require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔧 Iniciando test de flujo de autenticación...');

// Configuración de Firebase Admin
const serviceAccount = {
  type: process.env.FIREBASE_TYPE || 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

// Verificar variables requeridas
const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente');

try {
  // Inicializar Firebase Admin
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado');
  }

  async function testAuth() {
    try {
      console.log('\n🔍 Obteniendo usuarios de Firebase...');
      
      // Obtener todos los usuarios
      const usersResult = await admin.auth().listUsers(10);
      console.log(`✅ Usuarios encontrados: ${usersResult.users.length}`);
      
      if (usersResult.users.length === 0) {
        console.log('❌ No hay usuarios en Firebase');
        return;
      }

      // Probar con el primer usuario
      const testUser = usersResult.users[0];
      console.log('\n👤 Usuario de prueba:');
      console.log(`   UID: ${testUser.uid}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Creado: ${testUser.metadata.creationTime}`);

      // Crear un token personalizado (para simulación)
      console.log('\n🔑 Generando custom token...');
      const customToken = await admin.auth().createCustomToken(testUser.uid);
      console.log('✅ Custom token generado (para uso en cliente):', customToken.substring(0, 50) + '...');

      // Para testing directo, usar verifyIdToken con el token actual del usuario
      // Nota: En producción, obtendrías este token del cliente
      console.log('\n⚠️  Nota: Para probar con Postman, necesitas un ID token real');
      console.log('   Puedes obtenerlo desde el frontend o usando la Firebase REST API');
      
      console.log('\n📋 Para probar en Postman:');
      console.log('   1. Obtén un ID token real desde tu app frontend');
      console.log('   2. O usa esta Firebase REST API:');
      console.log('      POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]');
      console.log('   3. En el body: {"email":"' + testUser.email + '","password":"tu_password","returnSecureToken":true}');
      
    } catch (error) {
      console.error('❌ Error en testAuth:', error.message);
    }
  }

  testAuth();

} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message);
  process.exit(1);
}