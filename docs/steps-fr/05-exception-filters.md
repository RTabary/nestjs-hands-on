# Étape 05 — Exception Filters

> **Durée estimée : 12 min** &nbsp;·&nbsp; **Branche start** : `start/05-exception-filters` &nbsp;·&nbsp; **Branche solution** : `solution/05-exception-filters`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Lever une `HttpException` NestJS (et ses sous-classes) et compter sur le framework pour exposer le bon code de statut au client.
2. Écrire une exception métier custom (`MissingFluxCapacitorException`) qui étend `ConflictException` et porte la bonne sémantique par son nom.
3. Enregistrer un **exception filter global** (`@Catch()` + `ExceptionFilter`) qui enveloppe chaque erreur non capturée dans une enveloppe unifiée.
4. Encoder une petite machine à états dans la couche service qui lève sur les transitions illégales, et observer le filter global formater l'erreur de manière cohérente.

## Principe

NestJS vous donne deux outils complémentaires pour gérer les erreurs :

- **Lever** : les services et contrôleurs lèvent `HttpException` (ou n'importe quelle sous-classe comme `NotFoundException`, `BadRequestException`, `ConflictException`). La couche d'exceptions par défaut de NestJS transforme l'objet levé en réponse HTTP correspondante.
- **Capturer** : un `ExceptionFilter` enregistré avec `@Catch()` (sans argument = capture tout) vous laisse customiser cette réponse — généralement pour imposer une forme de corps uniforme à travers l'API.

Cette étape ajoute trois entités supplémentaires (`Garage`, `Mechanic`, `MaintenanceOrder`) et utilise les **transitions de MaintenanceOrder** comme surface d'enseignement pour les deux moitiés. La machine à états `queued → in_progress → completed` est imposée dans `MaintenanceOrdersService.transition()`. Les mouvements illégaux lèvent `BadRequestException`. Deux règles métier spécifiques au domaine ont chacune leur propre classe d'exception :

- **`MissingFluxCapacitorException`** (HTTP 409) — se déclenche quand un ordre de maintenance sur la DeLorean (V009) est transitionné vers « completed » mais que les `partIds` de l'ordre ne contiennent pas le condensateur de flux (`P-FLUX-CAP-MK2`). C'est le clin d'œil semé à l'étape 03 dans `src/seed/spare-parts.seed.ts`, désormais charge utile.
- **`OutOfStockException`** (HTTP 409) — se déclenche quand compléter un ordre pousserait le stock d'une pièce référencée en dessous de zéro.

Les deux étendent `ConflictException`, qui étend `HttpException` — donc NestJS sait déjà retourner 409 pour elles. Les sous-classes custom existent pour la **clarté au site de levée** (« on lève une règle métier, pas juste un `new HttpException(409, ...)` ») et pour un **comportement filtrable** si vous le souhaitiez (ex. logger toutes les `OutOfStockException` séparément).

Le travail du filter global est la **forme uniforme** :

```json
{ "statusCode": 409, "error": "Conflict", "message": "...", "timestamp": "...", "path": "..." }
```

Chaque erreur — les 400 de validation de l'étape 04, les NotFoundException de `findOne`, les nouvelles exceptions métier, et même les jets de `Error` inattendus (qui deviennent 500) — reçoit cette enveloppe. Les clients ont une seule forme à parser.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `HttpException` + `ExceptionFilter` | `IExceptionFilter` + `ProblemDetails` | Conceptuellement identique ; .NET livre un standard `ProblemDetails` plus riche d'origine. |

Si vous avez utilisé le mapping `ProblemDetails` automatique de `[ApiController]` ou écrit un `IExceptionFilter` custom, le modèle mental se transpose directement :

```csharp
// .NET
public class AllExceptionsFilter : IExceptionFilter {
    public void OnException(ExceptionContext context) {
        context.Result = new ObjectResult(new {
            statusCode = ...,
            error = ...,
            message = ...,
            timestamp = DateTime.UtcNow,
            path = context.HttpContext.Request.Path
        }) { StatusCode = ... };
    }
}
```

En NestJS la même idée est pilotée par décorateur (`@Catch()` sur la classe) et le contexte vient de `ArgumentsHost.switchToHttp()`. Le pattern « enveloppe unifiée » est si commun que l'écosystème .NET lui a donné un nom (`ProblemDetails`) ; NestJS vous laisse choisir la forme.

La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/05-exception-filters`. Le contenu des étapes 01-04 est en place.

1. Créez trois nouveaux modules de feature — `src/garages/`, `src/mechanics/`, `src/maintenance-orders/` — calqués sur la structure des étapes précédentes. Chacun a une entité, une paire de DTO CRUD, un service, un contrôleur et un module.
2. Écrivez **`src/common/exceptions/missing-flux-capacitor.exception.ts`** étendant `ConflictException`. Le constructeur prend le `vehicleId` ; le message est « Vehicle V009 cannot have a maintenance order completed without P-FLUX-CAP-MK2 ».
3. Écrivez **`src/common/exceptions/out-of-stock.exception.ts`** étendant `ConflictException`. Message : « SparePart P00X is out of stock ».
4. Écrivez **`src/common/filters/all-exceptions.filter.ts`** décoré par `@Catch()` (sans argument). Implémentez `catch(exception, host)` pour :
   - défaut `status = 500`, `error = 'Internal Server Error'`, `message = 'Internal server error'` ;
   - si `exception instanceof HttpException`, extraire le statut, puis lire `getResponse()` et en tirer `error` + `message` (gère les réponses string ET object) ;
   - retourner `response.status(status).json({ statusCode, error, message, timestamp, path })`.
5. Dans `MaintenanceOrdersService.transition()` :
   - Parcourez la map de la machine à états : `{ queued: ['in_progress', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: [], cancelled: [] }`. Les mouvements illégaux lèvent `BadRequestException`.
   - Avant de transitionner vers `completed`, exécutez la vérification du condensateur de flux (V009 + P020 manquant → lève `MissingFluxCapacitorException`).
   - Puis exécutez à blanc une vérification de stock (toute pièce avec `stock <= 0` → lève `OutOfStockException`), puis committez la décrémentation.
6. Ajoutez `decrementStock(id)` à `SparePartsService` (implémentation d'une ligne : trouver, décrémenter, mettre à jour le timestamp).
7. Le endpoint contrôleur de transition est `POST /maintenance-orders/:id/transition`. Décorez avec `@HttpCode(HttpStatus.OK)` — sémantiquement une mutation d'état, pas une création, donc 200 est plus précis que le défaut 201 de NestJS pour `@Post`.
8. Câblez les trois nouveaux modules dans `AppModule.imports`.
9. Enregistrez le filter via `APP_FILTER` dans `AppModule.providers` :
   ```ts
   { provide: APP_FILTER, useClass: AllExceptionsFilter }
   ```
   Même raisonnement de niveau module qu'à l'étape 04 avec `APP_PIPE` — les tests le récupèrent automatiquement.

## Essayez

```bash
npm run start:dev
```

```bash
# 404 dans l'enveloppe unifiée
curl -s http://localhost:3000/vehicles/V999 | jq
# → { "statusCode": 404, "error": "Not Found", "message": "Vehicle V999 not found", "timestamp": "...", "path": "/vehicles/V999" }

# Déclencher l'exception du condensateur de flux
ORDER=$(curl -s -X POST http://localhost:3000/maintenance-orders \
  -H 'content-type: application/json' \
  -d '{"vehicleId":"V009","mechanicId":"MEC001","partIds":[],"scheduledFor":"2026-12-31T09:00:00Z"}' | jq -r .id)

curl -s -X POST http://localhost:3000/maintenance-orders/$ORDER/transition \
  -H 'content-type: application/json' \
  -d '{"status":"in_progress"}' | jq

curl -s -X POST http://localhost:3000/maintenance-orders/$ORDER/transition \
  -H 'content-type: application/json' \
  -d '{"status":"completed"}' | jq
# → 409 avec le message MissingFluxCapacitorException

# Une transition illégale (queued → completed sans passer par in_progress)
curl -s -X POST http://localhost:3000/maintenance-orders/MO001/transition \
  -H 'content-type: application/json' \
  -d '{"status":"completed"}' | jq
# → 400 "Illegal transition: queued → completed"
```

## Point de contrôle

```bash
npm run test:e2e -- 05-exceptions
```

Deux tests qui passent couvrant : enveloppe unifiée sur 404, et le flux d'exception du condensateur de flux sur la DeLorean.

## Pour aller plus loin

- Ajoutez un exception filter scopé à UN contrôleur : décorez le contrôleur avec `@UseFilters(YourFilter)` et regardez comment il override le global. Utile quand, par exemple, une intégration tierce a besoin d'une sémantique d'erreur différente.
- Cherchez les décorateurs `Expose`/`Exclude` de `class-transformer`. Le filter global expose actuellement le message d'erreur brut ; en production vous voudriez souvent rédacter les stack traces et les détails internes d'exception. Le pattern : un `ProductionExceptionFilter` séparé qui ne se déclenche que quand `process.env.NODE_ENV === 'production'`.
- `MissingFluxCapacitorException` étend `ConflictException` (409). Essayez de la changer pour étendre un autre statut — disons `BadRequestException` (400). Relancez le test. Notez que l'assertion sur `error: 'Conflict'` échoue — bon rappel que les noms de statut HTTP portent une charge sémantique.

## Pièges courants

- **`Cannot read properties of undefined (reading 'getStatus')`** dans votre filter : vous avez oublié le garde `instanceof HttpException`. Les objets `Error` plein n'ont pas de `.getStatus()`.
- **Les 400 de validation de l'étape 04 perdent leur message tableau** après l'enregistrement du filter : vous avez déstructuré `body` négligemment dans le filter et perdu `message: string[]`. Assurez-vous que votre filter retombe sur `obj.message ?? exception.message`.
- **`POST /maintenance-orders` réussit même pour V999** : vous avez oublié la vérification de FK dans `MaintenanceOrdersService.assertValidReferences`. Appeler `vehicles.findOne(id)` (qui lève `NotFoundException`) est la façon la plus simple de valider.
- **Le stock se décrémente partiellement avant la levée** : exécutez à blanc PUIS committez. Si vous décrémentez dans la même boucle que la vérification, une `OutOfStockException` levée à mi-chemin laisse l'API dans un état incohérent.
- **La transition retourne 201 au lieu de 200** : NestJS retourne 201 par défaut pour `@Post`. La transition est une mutation d'état, pas une création — utilisez `@HttpCode(HttpStatus.OK)`.
