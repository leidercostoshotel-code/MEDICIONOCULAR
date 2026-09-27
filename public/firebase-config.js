/* Configuración de Firebase.
   Pegue aquí los datos de su proyecto (Consola Firebase → Configuración del proyecto → Tus apps → Web).
   Mientras apiKey empiece con "PEGAR", la app funciona solo con guardado local en el navegador. */
window.FIREBASE_CONFIG = {
  apiKey: "PEGAR_API_KEY",
  authDomain: "PEGAR_PROYECTO.firebaseapp.com",
  projectId: "PEGAR_PROYECTO",
  storageBucket: "PEGAR_PROYECTO.appspot.com",
  messagingSenderId: "PEGAR_SENDER_ID",
  appId: "PEGAR_APP_ID"
};
/* requiereLogin: true = pide correo y contraseña (Authentication → Email/Password). */
window.APP_CONFIG = { requiereLogin: true };
