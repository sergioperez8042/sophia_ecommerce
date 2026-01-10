# 🔐 Configuración de GitHub Secrets

Para que el CI/CD funcione correctamente, debes configurar los siguientes secrets en GitHub.

## 📍 Cómo Agregar Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agrega cada secret de la lista

---

## 🔑 Secrets Requeridos

### 🧪 DEV (Sandbox) - Proyecto Firebase separado con datos de prueba

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `DEV_GOOGLE_MAPS_ANDROID_API_KEY` | Google Maps API para Android (Sandbox) | Google Cloud Console (Proyecto Dev) |
| `DEV_GOOGLE_MAPS_IOS_API_KEY` | Google Maps API para iOS (Sandbox) | Google Cloud Console (Proyecto Dev) |
| `DEV_GOOGLE_MAPS_WEB_API_KEY` | Google Maps API para Web (Sandbox) | Google Cloud Console (Proyecto Dev) |
| `DEV_FIREBASE_API_KEY` | Firebase Web API Key (Sandbox) | Firebase Console → Proyecto Dev → Settings |
| `DEV_FIREBASE_APP_ID_ANDROID` | App ID de Android (Sandbox) | Firebase Console → Proyecto Dev → App Settings |
| `DEV_FIREBASE_SERVICE_ACCOUNT` | Service Account JSON (Sandbox) | Firebase Console → Proyecto Dev → Service Accounts |

### 🚀 PROD (Live) - Proyecto Firebase de producción con datos reales

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `PROD_GOOGLE_MAPS_ANDROID_API_KEY` | Google Maps API para Android (Producción) | Google Cloud Console (Proyecto Prod) |
| `PROD_GOOGLE_MAPS_IOS_API_KEY` | Google Maps API para iOS (Producción) | Google Cloud Console (Proyecto Prod) |
| `PROD_GOOGLE_MAPS_WEB_API_KEY` | Google Maps API para Web (Producción) | Google Cloud Console (Proyecto Prod) |
| `PROD_FIREBASE_API_KEY` | Firebase Web API Key (Producción) | Firebase Console → Proyecto Prod → Settings |
| `PROD_FIREBASE_APP_ID_ANDROID` | App ID de Android (Producción) | Firebase Console → Proyecto Prod → App Settings |
| `PROD_FIREBASE_SERVICE_ACCOUNT` | Service Account JSON (Producción) | Firebase Console → Proyecto Prod → Service Accounts |

### 🌐 Firebase Hosting (Opcional para Web)

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | Firebase Console → Project Settings |

---

## ⚠️ Importante: Dos Proyectos Firebase Separados

Debes crear **DOS proyectos Firebase completamente separados**:

1. **Proyecto DEV (Sandbox)**:
   - Para desarrollo y pruebas
   - Base de datos con datos de prueba
   - Puede compartirse entre developers
   - App ID: `services.itc.miviaje.dev`

2. **Proyecto PROD (Live)**:
   - Para producción
   - Base de datos con datos reales
   - Acceso restringido
   - App ID: `services.itc.miviaje`

Esto asegura que:
- ✅ No contamines producción con datos de prueba
- ✅ Puedes probar sin miedo a afectar usuarios reales
- ✅ Mayor seguridad al tener keys separadas

---

## 🔥 Obtener Firebase Service Account

1. Ve a **Firebase Console** → Tu proyecto
2. **Project Settings** (⚙️) → **Service Accounts**
3. Click en **Generate new private key**
4. Se descargará un archivo JSON
5. **Copia TODO el contenido del JSON** y pégalo como secret `FIREBASE_SERVICE_ACCOUNT`

Ejemplo del JSON:
```json
{
  "type": "service_account",
  "project_id": "tu-proyecto",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  ...
}
```

---

## 📱 Configurar Firebase App Distribution

### Para DEV (Sandbox):

**1. Obtener App ID:**
1. Ve a **Firebase Console** → **Proyecto DEV**
2. Click en el ícono de **Android** 
3. En **General** verás el **App ID** (formato: `1:123456789:android:abc123def456`)
4. Copia ese ID y agrégalo como secret `DEV_FIREBASE_APP_ID_ANDROID`

**2. Crear Grupo de Testers:**
1. En el mismo proyecto, ve a **Release & Monitor** → **App Distribution**
2. Click en la pestaña **Testers & Groups**
3. Click en **Add Group**
4. Nombre del grupo: **`testers`** (exactamente así, es el nombre que usa el workflow)
5. Agrega emails de developers y QA

### Para PROD (Live):

**1. Obtener App ID:**
1. Ve a **Firebase Console** → **Proyecto PROD**
2. Click en el ícono de **Android** 
3. En **General** verás el **App ID** (formato: `1:987654321:android:xyz789ghi012`)
4. Copia ese ID y agrégalo como secret `PROD_FIREBASE_APP_ID_ANDROID`

**2. Crear Grupo de Testers:**
1. En el mismo proyecto, ve a **Release & Monitor** → **App Distribution**
2. Click en la pestaña **Testers & Groups**
3. Click en **Add Group**
4. Nombre del grupo: **`production-testers`** (exactamente así)
5. Agrega emails de stakeholders/beta testers finales

---

## ✅ Verificación

Una vez configurados todos los secrets, el workflow en la rama `develop` debería:

1. ✅ Crear automáticamente los archivos `.env`
2. ✅ Compilar la APK con flavor `dev`
3. ✅ Subir la APK a **Firebase App Distribution**
4. ✅ Notificar al grupo de testers

---

## 🧪 Testing del Workflow

Para probar que todo funciona:

```bash
git add .
git commit -m "test: CI/CD setup"
git push origin develop
```

Luego ve a:
- **GitHub** → **Actions** → Verifica que el workflow corra sin errores
- **Firebase Console** → **App Distribution** → Verifica que la APK esté disponible

---

## 🚨 Troubleshooting

### Error: "Secret not found"
- Verifica que el nombre del secret sea exactamente igual (case-sensitive)
- Asegúrate de crear los secrets en el repositorio correcto

### Error: "Firebase App Distribution failed"
- Verifica que el Service Account JSON esté completo
- Asegúrate de tener permisos de "Firebase App Distribution Admin"
- El App ID debe ser el correcto para el flavor (dev/prod)

### Error: "Group not found" o "Testers group does not exist"
- **Debes crear los grupos manualmente en Firebase Console**:
  - Para DEV: Crear grupo llamado `testers`
  - Para PROD: Crear grupo llamado `production-testers`
- Los nombres deben coincidir exactamente (case-sensitive)
- Ve a: Firebase Console → App Distribution → Testers & Groups → Add Group

### Error: "API Key not found in .env"
- Verifica que todos los 4 API secrets estén configurados
- Revisa que no haya espacios extras en los valores
