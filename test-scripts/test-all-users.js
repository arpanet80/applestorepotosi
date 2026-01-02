require('dotenv').config();
const admin = require('firebase-admin');

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

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

console.log('👥 Listando TODOS los usuarios de Firebase...');

admin.auth().listUsers(1000)
  .then((result) => {
    console.log(`✅ Usuarios encontrados: ${result.users.length}`);
    
    result.users.forEach((user, index) => {
      console.log(`\n--- Usuario ${index + 1} ---`);
      console.log(`UID: ${user.uid}`);
      console.log(`Email: ${user.email}`);
      console.log(`Email verificado: ${user.emailVerified}`);
      console.log(`Creado: ${user.metadata.creationTime}`);
      console.log(`Último login: ${user.metadata.lastSignInTime}`);
      console.log(`Proveedor: ${user.providerData[0]?.providerId || 'N/A'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
  });