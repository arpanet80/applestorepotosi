require('dotenv').config(); // ← AÑADE ESTA LÍNEA
const admin = require('firebase-admin');

console.log('🔍 Verificando variables de entorno...');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Presente' : '❌ Faltante');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Presente' : '❌ Faltante');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Presente' : '❌ Faltante');

// Verificar que las variables requeridas estén presentes
const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  console.log('💡 Asegúrate de que el archivo .env esté en la raíz del proyecto backend');
  process.exit(1);
}

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

console.log('🔄 Inicializando Firebase Admin...');

try {
  // Verificar si ya hay una app inicializada
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } else {
    console.log('ℹ️ Firebase Admin ya estaba inicializado');
  }

  // Probar la conexión listando usuarios
  console.log('🔍 Probando conexión con Firebase...');
  admin.auth().listUsers(1)
    .then((result) => {
      console.log('✅ Conexión exitosa con Firebase Authentication');
      console.log(`📊 Usuarios en el sistema: ${result.users.length}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error conectando con Firebase:', error.message);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  process.exit(1);
}