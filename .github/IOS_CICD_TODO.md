# 🍎 CI/CD para iOS (Pendiente)

## 📋 Estrategia para iOS

Cuando implementemos CI/CD para iOS, seguiremos la misma estrategia de **dos ambientes separados**:

### 🧪 Dev (Sandbox)
- **Bundle ID**: `services.itc.miviaje.dev`
- **Nombre**: "MI VIAJE Sandbox"
- **Distribución**: TestFlight (Internal Testing)
- **Firebase**: Proyecto DEV
- **Datos**: Prueba/Ficticios

### 🚀 Prod (Live)
- **Bundle ID**: `services.itc.miviaje`
- **Nombre**: "MI VIAJE"
- **Distribución**: TestFlight (External Testing) → App Store
- **Firebase**: Proyecto PROD
- **Datos**: Reales

---

## 🔧 Configuración Necesaria (Futura)

### 1. Apple Developer Account
- ✅ Membresía de Apple Developer ($99/año)
- ✅ Crear App IDs:
  - `services.itc.miviaje.dev`
  - `services.itc.miviaje`

### 2. Certificados y Provisioning Profiles
Se manejarán con **Fastlane Match**:
- Development certificates
- Distribution certificates
- Push notification certificates

### 3. GitHub Secrets Adicionales

**Para DEV**:
```
DEV_FIREBASE_APP_ID_IOS
DEV_APPLE_TEAM_ID
DEV_MATCH_PASSWORD
```

**Para PROD**:
```
PROD_FIREBASE_APP_ID_IOS
PROD_APPLE_TEAM_ID
PROD_MATCH_PASSWORD
PROD_APP_STORE_CONNECT_API_KEY
```

### 4. Fastlane Setup
Ya tienes configuración base en `ios/fastlane/`, necesitarás:
- Actualizar `Fastfile` para manejar flavors dev/prod
- Configurar Fastlane Match para certificados
- Configurar TestFlight para distribución automática

---

## 🚀 Workflow iOS (Propuesto)

### Push a `develop`:
1. 🔍 Analiza y testea
2. 🏗️ Compila IPA con flavor `dev`
3. 📤 Sube a **TestFlight (Internal)**
4. 📧 Notifica a developers/QA

### Push a `main`:
1. 🔍 Analiza y testea
2. 🏗️ Compila IPA con flavor `prod`
3. 📤 Sube a **TestFlight (External)**
4. 🍎 Listo para review de App Store

---

## 📚 Referencias Útiles

Ya tienes documentación preparada en:
- `docs/IOS_BUILD_SETUP.md`
- `docs/IOS_CICD_TESTFLIGHT.md`
- `docs/IOS_QUICK_START.md`
- `docs/IOS_GITHUB_SECRETS.md`

---

## ✅ Próximos Pasos (Cuando implementes iOS)

1. Crear los dos App IDs en Apple Developer
2. Configurar Fastlane Match
3. Actualizar `ios/Runner/Info.plist` con flavors
4. Crear Xcode Schemes para dev/prod
5. Configurar GitHub Secrets para iOS
6. Crear workflow `.github/workflows/ios-ci.yml`
7. Probar distribución a TestFlight

---

## 💡 Notas

- **Máquina Mac requerida**: GitHub Actions ofrece runners macOS
- **Tiempo de build**: iOS tarda más que Android (~10-15 min)
- **TestFlight review**: Puede tardar 24-48h para external testing
- **Mismo patrón**: Seguirá la misma estructura que Android CI/CD
