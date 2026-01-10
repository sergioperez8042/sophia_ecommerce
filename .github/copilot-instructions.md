# Odoo HR Hub - AI Coding Agent Instructions

## Quick Context
**Odoo HR Hub** = Flutter mobile app for employee attendance tracking (GPS-based check-in/out) integrated with Odoo ERP. Uses **feature-first architecture**, **Riverpod** state management, **go_router** for navigation, **Freezed** for models, and `itc_design_system` (local package) for UI.

**Deployment**: 3 flavors (dev/stage/prod) via `main_dev.dart` / `main_prod.dart` entrypoints. Uses Odoo REST API for all backend operations.

---

## Architecture & Project Structure

### Feature-First Layers (Clean Architecture)
```
lib/
├── app/                    # Router (go_router), theme config, l10n setup
├── core/                   # Shared: OdooClient, GPSService, error handling, providers
│   ├── odoo/              # OdooClient (Dio wrapper) - ONLY HTTP layer for Odoo API
│   ├── gps/               # GPSService (location + geofencing)
│   ├── errors/            # AppException hierarchy (all use messageKey for i18n)
│   ├── providers/         # Riverpod providers (odooClientProvider, isAuthenticatedProvider)
│   └── services/          # Utilities (AuthErrorHandler, OnboardingService, CompanyNameService)
└── features/              # Each feature has: data/ → domain/ → presentation/
    ├── auth/              # Login (Odoo credentials + device registration)
    ├── attendance/        # Check-in/out (GPS-validated)
    ├── dashboard/         # Home screen
    ├── history/           # Attendance history
    └── onboarding/        # First-time setup
```

### Key Pattern: Data → Repository → Notifier → UI
```dart
// 1. Datasource: Raw API calls
OdooAuthDataSource.login() → OdooClient.post()

// 2. Repository: Business logic + error handling
AuthRepository.login() → datasource + exception mapping

// 3. Notifier: State management (Riverpod)
AuthNotifier.login() → updates AsyncValue<UserEntity> state

// 4. UI: Watch provider, respond to state
ref.watch(isUserAuthenticatedProvider)
```

---

## Critical Patterns (ALWAYS Follow)

### 1. Odoo API Integration — OdooClient (REQUIRED)
**ALL HTTP requests must go through `lib/core/odoo/odoo_client.dart`** (Dio wrapper). Never create raw Dio instances.

```dart
// ✅ CORRECT: Use injected OdooClient in datasources
class OdooAuthDataSource {
  final OdooClient _client;
  Future<LoginResponse> login({required String username, required String password}) async {
    final response = await _client.post('/api/mobile/auth', data: {...});
    return LoginResponse.fromJson(response.data['result']);
  }
}

// ❌ WRONG: Never do this
final dio = Dio(); // ← No
final response = await dio.post('/api/mobile/auth'); // ← No
```

**OdooClient features**: Token management (`setToken()`), Dio interceptors for auth headers, error logging, auto-logout on `device_not_authorized`.

### 2. Design System — Use `itc_design_system` Package (REQUIRED)
**NEVER create custom styled widgets**. Always use components from `packages/itc_design_system`.

```dart
// ❌ WRONG: Custom Text styling
Text('Login', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue))

// ✅ CORRECT: Use design system
ITCHeadlineLarge('Login')
ITCPrimaryButton(text: 'Sign In', onPressed: () {})
ITCBodyMedium('Email:')
ITCTextField(label: 'Email')
```

Available: Typography (`ITCDisplayLarge`, `ITCHeadlineLarge`, `ITCBodyMedium`), Buttons (`ITCPrimaryButton`, `ITCButton`), Inputs (`ITCTextField`, `ITCPasswordField`), Tokens (`ITCColors`, `ITCSpacing`).

### 3. Localization — Use AppLocalizations (REQUIRED)
**NO hardcoded strings**. Always use `AppLocalizations.of(context)` for text.

```dart
// ❌ WRONG
Text('Login successful!')

// ✅ CORRECT
final l10n = AppLocalizations.of(context)!;
Text(l10n.loginSuccess)
```

**To add new strings**: Edit `assets/translations/app_es.arb` + `app_en.arb`, then run `flutter gen-l10n`.

### 4. Error Handling — AppException Hierarchy (REQUIRED)
All exceptions inherit from `AppException` and use `messageKey` (not strings). Catch at repository level, map to UI-friendly exceptions.

```dart
// AppException types: AuthException, ServerException, NetworkException, ValidationException
catch (e) {
  if (e is DioException) {
    throw ServerException('errorServerGeneric'); // messageKey
  }
  throw UnexpectedException('errorGeneric');
}
```

### 5. State Management — Riverpod + Freezed (REQUIRED)
- Use `@freezed` for models + JSON serialization
- Use `Notifier<State>` for complex logic, `Provider` for simple values
- Always use `AsyncValue<T>` for async operations (loading/data/error states)

```dart
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.success(UserEntity user) = _Success;
  const factory AuthState.error(String messageKey) = _Error;
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState.initial();
  
  Future<void> login(String username, String password) async {
    state = const AuthState.loading();
    try {
      final user = await ref.read(authRepositoryProvider.future).login(username, password);
      state = AuthState.success(user);
    } on AppException catch (e) {
      state = AuthState.error(e.messageKey);
    }
  }
}
```

### 6. Navigation — go_router with Redirect Logic
Auth state automatically redirects: unauthenticated → `/login`, never saw onboarding → `/onboarding`, authenticated → `/`.

```dart
// lib/app/router.dart: All routes use CustomTransitionPage with FadeTransition or SlideTransition
GoRoute(
  path: '/login',
  pageBuilder: (context, state) => CustomTransitionPage(
    child: LoginScreen(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) =>
      SlideTransition(position: animation.drive(...), child: child),
  ),
)
```

### 7. GPS & Geofencing
```dart
// lib/core/gps/gps_service.dart
final position = await gpsService.getCurrentLocation();
final isWithinRadius = gpsService.isWithinGeofence(lat, lng, officeLatLng, radiusMeters: 100);
```

---

## Development Workflows

### Run App (3 Flavors)
```bash
flutter run --flavor dev -t lib/main_dev.dart      # Development
flutter run --flavor stage -t lib/main_stage.dart  # Staging
flutter run --flavor prod -t lib/main_prod.dart    # Production
```

### Generate Code (Freezed, JSON, i18n)
```bash
dart run build_runner build --delete-conflicting-outputs
flutter gen-l10n
```

### iOS Build/Deploy
```bash
# Manual build
flutter build ipa --release --flavor prod -t lib/main_prod.dart --export-options-plist=ios/ExportOptions-prod.plist

# Or PowerShell script
pwsh build_ios_ipa.ps1 -flavor prod
```

### Tests & Linting
```bash
flutter test                          # All tests
flutter test test/features/auth/      # Specific feature
flutter analyze                       # Lint check
```

### Environment Variables
Copy `.env.example` to `.env.dev` / `.env.prod`, set `ODOO_URL` and Firebase keys. Loaded via `flutter_dotenv`.

---

## Key Files for Reference
| Purpose | Path |
|---------|------|
| **Router & navigation** | `lib/app/router.dart` |
| **Odoo HTTP wrapper** | `lib/core/odoo/odoo_client.dart` |
| **Exception types** | `lib/core/errors/app_exception.dart` |
| **Core providers** | `lib/core/providers/odoo_provider.dart`, `auth_provider.dart` |
| **GPS service** | `lib/core/gps/gps_service.dart` |
| **Design system** | `packages/itc_design_system/lib/src/` |
| **Translations** | `assets/translations/app_*.arb` |
| **Auth feature example** | `lib/features/auth/` (data → domain → presentation) |

---

## ⚠️ Timezone Handling (CRITICAL)
**All timestamps from Odoo are UTC.** Never mix local and UTC times!

```dart
// ❌ WRONG: Mixing local and UTC
final duration = DateTime.now().difference(checkInTimeFromOdoo); // Diff = wrong!

// ✅ CORRECT: Both UTC
final odooTime = DateTime.parse(apiResponse).toUtc(); // Parse as UTC
final duration = DateTime.now().toUtc().difference(odooTime); // Both UTC
```

**Apply everywhere**:
- When parsing Odoo datetime: `.toUtc()`
- When comparing times: `DateTime.now().toUtc()`
- When sending dates to API: Use UTC (don't convert to local)

**History filters must also use UTC** (see `history_provider.dart` DateFilter methods).

---

## Common Pitfalls
- ❌ Hardcoded colors (use `Theme.of(context)`)
- ❌ Raw Dio instances (use `OdooClient` via Riverpod)
- ❌ Custom widgets (use `itc_design_system`)
- ❌ Hardcoded strings (use `AppLocalizations`)
- ❌ Direct exception messages (use `messageKey` for i18n)
- ❌ Mixing timezones (parse Odoo times as `.toUtc()`, compare with `DateTime.now().toUtc()`)
- **Odoo API Reference**: `docs/ODOO_API_REFERENCE.md` - Endpoint specs for attendance module

## Common Pitfalls
1. Creating custom Text/Button widgets instead of using `itc_design_system`
2. Hardcoding colors without `Theme.of(context)` (breaks dark mode)
3. Hardcoding strings instead of using `l10n` (breaks i18n)
4. Using raw Dio instead of `OdooClient` for API calls
