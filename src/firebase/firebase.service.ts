import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const firebaseConfig = {
      type: 'service_account',
      project_id: this.configService.get('FIREBASE_PROJECT_ID'),
      private_key_id: this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
      private_key: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
      client_id: this.configService.get('FIREBASE_CLIENT_ID'),
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: this.configService.get('FIREBASE_CLIENT_CERT_URL'),
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      });
    }
  }

  getAuth() {
    return admin.auth();
  }

  getFirestore() {
    return admin.firestore();
  }
}