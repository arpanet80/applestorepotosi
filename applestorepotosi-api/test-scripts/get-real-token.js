require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function getRealToken() {
  try {
    // Obtener usuarios
    const users = await admin.auth().listUsers(10);
    
    console.log('👥 Usuarios disponibles:');
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.uid})`);
    });
    
    console.log('\n⚠️  Para obtener un token REAL necesitas:');
    console.log('1. Usar el frontend Angular y mirar la consola del navegador');
    console.log('2. O usar la Firebase REST API:');
    console.log('');
    console.log('POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY_WEB]');
    console.log('Body: {');
    console.log('  "email": "admin@tiendaapple.com",');
    console.log('  "password": "password123",');
    console.log('  "returnSecureToken": true');
    console.log('}');
    console.log('');
    console.log('📌 Para obtener API_KEY_WEB:');
    console.log('   - Ve a Firebase Console → Configuración del proyecto → General');
    console.log('   - Busca "API key" en la configuración de tu web app');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getRealToken();