# Étape 06 — Guards

> **Durée estimée : 15 min** &nbsp;·&nbsp; **Branche start** : `start/06-guards`  &nbsp;·&nbsp; **Branche solution** : `solution/06-guards`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Implémenter un guard `CanActivate` qui authentifie / autorise une requête avant qu'elle n'atteigne le contrôleur.
2. Utiliser `Reflector` + `SetMetadata` pour attacher un marqueur d'opt-out (`@Public()`) à des routes spécifiques — transformant un guard global en politique « activé par défaut avec exceptions ».
3. Enregistrer le guard globalement via le token `APP_GUARD` pour qu'il s'applique à **chaque** route de l'application sans câblage par contrôleur.
4. Raisonner sur l'ordre du cycle de vie d'une requête NestJS : **guard → pipe → handler → interceptor → filter** (et comment ça affecte l'erreur que vous verriez pour une requête malformée sans le bon header).

## Principe

Un **guard** NestJS est une classe implémentant `CanActivate` dont la méthode `canActivate(context)` retourne un booléen (ou une Promise/Observable de booléen). Retourner `false` (ou lever) bloque la requête avant qu'elle n'atteigne le contrôleur ; retourner `true` la laisse passer. C'est le premier goût de l'atelier des *préoccupations transversales* exprimées comme décorateurs plutôt que comme `if (!auth) return res.status(401)` éparpillés.

Le modèle dans cette étape est volontairement simple : une constante `WORKSHOP_API_KEY = 'pit-pass'` et un header `x-api-key`. Le guard lit le header et soit retourne `true` soit lève `UnauthorizedException` (qui devient 401 — et est formatée par le filter de l'étape 05).

Le twist intéressant est l'**opt-out**. On enregistre le guard *globalement* (chaque route est protégée par défaut) puis on utilise un décorateur `@Public()` pour marquer les exceptions :

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

À l'intérieur du guard, `Reflector.getAllAndOverride` lit les métadonnées soit du handler de route **soit** de la classe contrôleur. Donc vous pouvez marquer une seule route publique, ou un contrôleur entier. L'atelier utilise les deux : `@Public()` sur la classe `AppController` (couvre `/health` + `/vroom`) et sur chaque `@Get(...)` des contrôleurs de ressources (l'accès en lecture reste ouvert).

Pourquoi « activé par défaut avec exceptions » plutôt que « désactivé par défaut avec `@Auth()` » ? Parce que les modes de défaillance diffèrent. Avec « désactivé par défaut », vous pouvez livrer un nouveau endpoint et **oublier** de le protéger — fuite silencieuse. Avec « activé par défaut », vous pouvez livrer un nouveau endpoint et oublier de le marquer public — casse bruyante pendant les tests. Le second est le meilleur défaut.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `CanActivate` (Guards) | `AuthorizationHandler` + politique `[Authorize]` | Les guards NestJS s'exécutent avant les pipes ; l'autorisation .NET s'exécute à un autre stade du middleware. |

Si vous avez utilisé la paire `[Authorize]` / `[AllowAnonymous]` d'ASP.NET Core plus un `IAuthorizationHandler` custom, c'est la même idée avec les noms échangés :

| ASP.NET Core | NestJS |
|---|---|
| `[Authorize(Policy = "ApiKey")]` (activé par défaut par filter global) | Enregistrement `APP_GUARD` (activé par défaut) |
| `[AllowAnonymous]` | `@Public()` |
| `IAuthorizationHandler.HandleRequirementAsync` | `CanActivate.canActivate` |
| `context.HttpContext.Request.Headers["X-Api-Key"]` | `request.headers['x-api-key']` |

L'ordre du cycle de vie est différent par contre, et bon à savoir :

- **NestJS** : middleware → guards → pipes → handler → interceptors (post) → exception filter
- **.NET** : middleware → authentication → authorization → model binding (≈ pipes) → action filter → handler

L'impact pratique : en NestJS, une requête sans `x-api-key` ET avec un body malformé retourne 401 (le guard lève en premier ; la validation pipe ne s'exécute jamais). En .NET ça dépend de l'ordre des filters, mais typiquement aussi 401 d'abord.

La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/06-guards`. La machinerie d'exception filter de l'étape 05 est en place.

1. Écrivez **`src/auth/public.decorator.ts`** avec `IS_PUBLIC_KEY = 'isPublic'` et `Public()` exportant `SetMetadata(IS_PUBLIC_KEY, true)`.
2. Écrivez **`src/auth/api-key.guard.ts`** :
   - Classe `@Injectable()` implémentant `CanActivate`.
   - Injectez `Reflector` via le constructeur.
   - Dans `canActivate(context)` :
     - Utilisez `reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])`. Si `true`, retournez `true`.
     - Lisez `request.headers['x-api-key']`. S'il vaut `WORKSHOP_API_KEY` (la constante exportée depuis ce fichier — `'pit-pass'` pour l'instant ; relocalisée vers env à l'étape 07), retournez `true`.
     - Sinon levez `new UnauthorizedException('Missing or invalid x-api-key header')`.
3. Écrivez **`src/auth/auth.module.ts`** qui enregistre et exporte `ApiKeyGuard`.
4. Appliquez `@Public()` à :
   - La classe `AppController` (couvre `/health` et `/vroom`).
   - Chaque route `@Get(...)` sur `VehiclesController`, `SparePartsController`, `ManufacturersController`, `GaragesController`, `MechanicsController`, `MaintenanceOrdersController`. L'accès en lecture reste ouvert ; l'accès en écriture (POST/PATCH/DELETE) requiert le header.
5. Dans `AppModule.providers`, enregistrez le guard :
   ```ts
   import { APP_GUARD } from '@nestjs/core';
   // …
   { provide: APP_GUARD, useClass: ApiKeyGuard }
   ```
   Et ajoutez `AuthModule` aux `imports`.

`Reflector` est fourni par `@nestjs/core` — vous n'avez pas besoin de l'enregistrer.

## Essayez

```bash
npm run start:dev
```

```bash
# Les GET restent ouverts
curl -s http://localhost:3000/vehicles | jq 'length'
# → 12

curl -s http://localhost:3000/health | jq
# → { "status": "ok", "uptimeSec": 3 }

# POST sans le header obtient un 401 dans l'enveloppe unifiée
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq
# → { "statusCode": 401, "error": "Unauthorized", "message": "Missing or invalid x-api-key header", ... }

# POST avec la bonne clé réussit
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: pit-pass' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq

# Mauvaise clé → 401
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: nope' \
  -d '{}' | jq
# → 401 (et vous ne verrez jamais d'erreur de validation pour le body vide —
#   le guard s'exécute avant la pipe)
```

## Point de contrôle

```bash
npm run test:e2e -- 06-guards
```

Cinq tests qui passent couvrant : GET reste public, POST sans header → 401, POST avec bon header → 201, POST avec mauvais header → 401.

## Pour aller plus loin

- Construisez un `RolesGuard` qui lit les métadonnées `@Roles('admin')` et gate les écritures par rôle. Le pattern `Reflector` de cette étape est le même — seule la clé de métadonnées change.
- Passez d'une clé API statique au JWT : écrivez un `JwtGuard` qui valide `Authorization: Bearer <token>` en utilisant `@nestjs/jwt`. Le cycle de vie et le pattern de décorateur restent identiques ; seule la logique de validation du token change.
- Essayez les guards **scopés** (`@UseGuards(SomeOtherGuard)` sur un seul contrôleur, par-dessus le guard global). Notez que TOUS les guards applicables doivent retourner true pour que la requête passe — les guards s'empilent avec une sémantique ET.

## Pièges courants

- **`Cannot read properties of undefined (reading 'getAllAndOverride')`** au boot : vous avez oublié de `constructor(private readonly reflector: Reflector) {}` — `Reflector` n'est pas une propriété que vous fixez, c'est une dépendance injectée.
- **Chaque requête retourne 401 — même les GET** : vous avez oublié d'appliquer `@Public()` à un contrôleur ou ses routes GET. Vérification rapide : `grep -r '@Public' src/` devrait montrer une ligne par route publique plus le décorateur de classe `AppController`.
- **`@Public()` sur une classe contrôleur ne se propage pas à ses routes** : si, mais seulement via `getAllAndOverride([handler, class])` (dans cet ordre). Utiliser `reflector.get(IS_PUBLIC_KEY, context.getHandler())` seul NE verra PAS les métadonnées de niveau classe.
- **L'app de test court-circuite silencieusement le guard** : même piège que le validation pipe à l'étape 04. Solution : enregistrer via `APP_GUARD` dans `AppModule.providers`, PAS via `app.useGlobalGuards()` dans `main.ts`.
- **Le 400 de validation devient un 401 d'auth de manière inattendue** : ce n'est pas un bug — c'est l'ordre du cycle de vie NestJS. Les guards s'exécutent avant les pipes, donc une requête non autorisée n'atteint jamais le validateur. Si vous voulez vraiment que les erreurs de validation soient visibles aux appelants non authentifiés, il faudrait que la logique de validation vive dans un guard ou un middleware (rare en pratique ; le « 401 d'abord » est généralement le comportement souhaité).
