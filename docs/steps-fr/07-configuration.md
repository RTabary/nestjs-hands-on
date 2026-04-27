# Étape 07 — Configuration

> **Durée estimée : 12 min** &nbsp;·&nbsp; **Branche start** : `start/07-configuration`  &nbsp;·&nbsp; **Branche solution** : `solution/07-configuration`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Enregistrer `ConfigModule.forRoot` de `@nestjs/config` et lire les variables d'environnement de manière typée via un service wrapper.
2. Valider la config au démarrage avec un schéma Joi — variables requises manquantes ? L'app refuse de démarrer, avec un message clair.
3. Basculer une valeur qui était précédemment une constante codée en dur (la clé API de l'étape 06) vers un paramètre de configuration sans changer aucun appelant.
4. Ajouter une règle métier pilotée par config (la limite de queue de maintenance) et regarder le filter global de l'étape 05 transformer son exception en enveloppe unifiée automatiquement.

## Principe

L'histoire de configuration NestJS a deux couches :

- **`@nestjs/config`** livre `ConfigModule` (charge les fichiers `.env` dans `process.env`) et `ConfigService` (l'accesseur stringly-typed du framework). C'est l'équivalent d'`IConfiguration` en ASP.NET Core.
- **`AppConfigService` (cet atelier)** est un fin wrapper qui expose une méthode typée par paramètre. Les appelants ne saupoudrent pas `config.get<string>('apiKey')` à travers la base de code ; ils appellent `appConfig.getApiKey()`. C'est l'équivalent d'`IOptions<TConfig>` en ASP.NET Core.

Le pattern que cette étape encode :

1. Définir une forme typée (`AppConfig`) et une factory (`appConfig()`) qui la produit depuis `process.env`.
2. Enregistrer `ConfigModule.forRoot({ load: [appConfig], validationSchema: Joi.object({...}) })`. Joi valide les champs requis au boot.
3. Fournir `AppConfigService` dans un petit module global pour que n'importe quel service puisse l'injecter.
4. Remplacer la constante codée en dur dans `ApiKeyGuard` par `this.appConfig.getApiKey()`. Aucun autre changement de fichier.
5. Ajouter une nouvelle règle métier (`MaintenanceQueueFullException` quand le compte d'ordres en queue dépasse la limite) — prouve que la config se propage proprement à la couche service.

La validation au démarrage est la moitié sous-estimée. Oublier de fixer `WORKSHOP_API_KEY=...` dans `.env` ne donne pas un mystère « 401 bizarre sur chaque requête » — l'app refuse de démarrer, avec une erreur Joi nommant le champ manquant. L'échec rapide sur la config est la défense la moins chère contre la classe de bugs « ça marche sur ma machine ».

Une subtilité : `Test.createTestingModule` boote l'app sans `main.ts`. `ConfigModule` s'exécute à la construction du module (validation Joi incluse), donc on a besoin d'un `.env.test` que l'app de test puisse trouver. Le `envFilePath` est donc fixé dynamiquement : `.env.test` quand `NODE_ENV=test` (Jest le fixe automatiquement), `.env` sinon.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `ConfigService` de `@nestjs/config` | `IConfiguration` + `IOptions<T>` | Parallèle direct ; les deux supportent les sections fortement typées. |

Si vous avez utilisé le pattern .NET :

```csharp
public class AppConfig {
    public int Port { get; set; }
    public string ApiKey { get; set; }
    public int MaintenanceQueueLimit { get; set; }
}

builder.Services.Configure<AppConfig>(builder.Configuration.GetSection("App"));
// puis injecter IOptions<AppConfig> dans vos services
```

…alors la version NestJS est reconnaissable :

```ts
export interface AppConfig { port: number; apiKey: string; maintenanceQueueLimit: number; }
export const appConfig = (): AppConfig => ({ port: ..., apiKey: ..., ... });

ConfigModule.forRoot({ load: [appConfig], validationSchema: Joi.object({...}) });
// puis injecter AppConfigService
```

Le `validationSchema` NestJS (Joi) remplace les DataAnnotations .NET sur la classe d'options ; sinon le modèle est un-pour-un. `IOptions<T>.Value` ≈ le `ConfigService.get('foo')` de NestJS. La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/07-configuration`. La clé API codée en dur de l'étape 06 (constante `'pit-pass'` dans `api-key.guard.ts`) est en place.

1. Installez : `npm install @nestjs/config joi`. Les deux sont des deps runtime.
2. Écrivez **`src/config/configuration.ts`** exportant :
   - `interface AppConfig { port: number; apiKey: string; maintenanceQueueLimit: number; }`
   - `export const appConfig = (): AppConfig => ({ port, apiKey, maintenanceQueueLimit })` lisant depuis `process.env` avec des défauts raisonnables (la clé API n'a pas de défaut — Joi la requiert).
3. Écrivez **`src/config/app-config.service.ts`** avec une classe `@Injectable()` injectant `ConfigService<AppConfig, true>`. Trois méthodes : `getPort()`, `getApiKey()`, `getMaintenanceQueueLimit()`. Chacune appelle `this.config.get(<key>, { infer: true })`.
4. Écrivez **`src/config/configuration.module.ts`** marqué `@Global` et `@Module({...})` :
   - `imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', load: [appConfig], validationSchema: Joi.object({ PORT: Joi.number().default(3000), WORKSHOP_API_KEY: Joi.string().required(), MAINTENANCE_QUEUE_LIMIT: Joi.number().default(10) }) })]`
   - `providers: [AppConfigService]`, `exports: [AppConfigService]`.
5. Écrivez **`src/common/exceptions/maintenance-queue-full.exception.ts`** — étend `ConflictException`, message `Maintenance queue is full (limit N)`.
6. Modifiez **`src/auth/api-key.guard.ts`** : retirez la constante `WORKSHOP_API_KEY` ; injectez `AppConfigService` ; dans `canActivate`, comparez contre `this.appConfig.getApiKey()`.
7. Modifiez **`src/maintenance-orders/maintenance-orders.service.ts`** : injectez `AppConfigService` ; dans `create()`, comptez les ordres `'queued'` ; levez `MaintenanceQueueFullException` si `count >= limit`.
8. Ajoutez `ConfigurationModule` à `AppModule.imports` (en premier dans la liste — d'autres modules en dépendent).
9. Écrivez `.env.example` (template, commité) et `.env.test` (fixture de test, commité) avec les trois valeurs. Les attendees copient `.env.example` vers `.env` pour le dev local.

## Essayez

```bash
npm run start:dev
```

```bash
# Avec .env en place : même comportement qu'avant, sourcé depuis .env maintenant
curl -s http://localhost:3000/health
# → { "status": "ok", "uptimeSec": 3 }

# Le boot échoue clairement quand WORKSHOP_API_KEY est manquant
mv .env .env.bak
npm run start:dev
# → Error: Config validation error: "WORKSHOP_API_KEY" is required
mv .env.bak .env

# Atteindre la limite de queue. Le seed a 1 ordre en queue ; la limite par défaut
# est 10 — donc le 10ème ordre nouvellement créé retourne 409.
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/maintenance-orders \
    -H 'content-type: application/json' \
    -H 'x-api-key: pit-pass' \
    -d '{"vehicleId":"V001","mechanicId":"MEC001","partIds":[],"scheduledFor":"2026-12-31T09:00:00Z"}'
done
# → 201 ... 201 ... 201 ... 409 (la queue est pleine)
```

## Point de contrôle

```bash
npm run test:e2e -- 07-
```

Un test qui passe : il poste des ordres de maintenance jusqu'à ce qu'au moins un revienne en 409 avec un message « queue ». Sur A6 (sans la limite), chaque POST réussissait — c'est pourquoi ce test était rouge à l'étape précédente.

## Pour aller plus loin

- Ajoutez un quatrième paramètre : `LOG_LEVEL` (un parmi `'debug' | 'info' | 'warn' | 'error'`) et faites en sorte que `AppConfigService.getLogLevel()` impose le type union via `Joi.string().valid('debug', 'info', 'warn', 'error').default('info')`.
- Essayez `registerAs('maintenance', () => ({ queueLimit: ... }))` de `@nestjs/config`. Ça namespace une tranche de config — l'équivalent d'`IOptions<MaintenanceOptions>` en .NET.
- Pratiquez le comportement « échec au boot » : retirez temporairement `WORKSHOP_API_KEY` de `.env.test` et relancez la suite. Notez que chaque test échoue à l'init du module — la précision du nommage d'erreur Joi suffit à corriger en une lecture.

## Pièges courants

- **`Cannot read properties of undefined (reading 'getApiKey')`** dans le guard : vous avez injecté `ConfigService` au lieu d'`AppConfigService`, ou vous avez oublié d'importer `ConfigurationModule` dans `AppModule`. Le service wrapper ne fait pas partie de `@nestjs/config` — c'est une classe que vous avez enregistrée.
- **Les tests échouent avec « WORKSHOP_API_KEY is required »** : vous avez oublié de créer `.env.test` (ou l'avez nommé `.env.testing`, etc.). L'`envFilePath` dans `ConfigurationModule` cherche `.env.test` exactement quand `NODE_ENV === 'test'`.
- **La limite de queue se déclenche sur le mauvais compte** : elle ne devrait compter que les ordres `'queued'`, pas tous les ordres. Les ordres complétés et annulés ne devraient pas prendre de place.
- **La validation Joi s'exécute une fois au boot — mais `.env` a été édité** : c'est le comportement correct. `cache: true` lit le fichier une fois. Redémarrez l'app pour prendre les changements.
- **`config.get('apiKey', { infer: true })` retourne `undefined`** : la factory `load: [appConfig]` est ce qui rend la clé typée `apiKey` disponible. Sans elle, vous devriez appeler `config.get('WORKSHOP_API_KEY')` (le nom brut de la variable d'env).
