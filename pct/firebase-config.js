/* Configuración de Firebase (Consola Firebase → Configuración del proyecto → Tus apps → Web). */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB2_U6wjfY3mn4QwNOgzd4NM8547YJXD7I",
  authDomain: "medicion-ocular.firebaseapp.com",
  projectId: "medicion-ocular",
  storageBucket: "medicion-ocular.firebasestorage.app",
  messagingSenderId: "49978129209",
  appId: "1:49978129209:web:8d83a34a1ce3658ad446e8"
};
/* requiereLogin: true = pide correo y contraseña (Authentication → Email/Password). */
window.APP_CONFIG = { requiereLogin: true, colPacientes: "pct_pacientes", colAtenciones: "pct_atenciones", colConfig: "pct_config" };
