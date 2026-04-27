# Étape 02 — Contrôleurs & Routage

> **Durée estimée : 15 min** &nbsp;·&nbsp; **Branche start** : `start/02-controllers-routing` &nbsp;·&nbsp; **Branche solution** : `solution/02-controllers-routing`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Construire un **module** de feature contenant un contrôleur, un service et les DTO que le contrôleur lie.
2. Utiliser les décorateurs de méthode HTTP de NestJS (`@Get`, `@Post`, `@Patch`, `@Delete`) et les décorateurs de paramètres (`@Body`, `@Param`).
3. Câbler un repository en mémoire dans un service pour que l'API ait des données à retourner — en utilisant le `SeedService` de l'atelier plutôt qu'en re-roulant la `Map` vous-même.

## Principe

Un **contrôleur** NestJS est « juste une classe » décorée par `@Controller('vehicles')`. L'argument du chemin fixe le préfixe de route ; chaque méthode décorée par `@Get`, `@Post` etc. ajoute une route relative à ce préfixe. Les paramètres de méthode sont liés à la requête via d'autres décorateurs — `@Param('id') id: string` lit le segment de chemin, `@Body() dto: CreateVehicleDto` lit le corps JSON parsé.

La couche de données pour cette étape est volontairement **ennuyeuse** : une `Map<string, Vehicle>` en mémoire dans `VehiclesService`. Le roster de seed est enregistré auprès du `SeedService` global (introduit comme infrastructure fondamentale) afin que les données survivent aux rechargements en mode dev et soient partagées avec les modules des étapes suivantes. La persistance — survivre à un redémarrage du serveur — arrive dans l'étape stretch S2.

Quelques choses que cette étape **n'introduit pas encore** (c'est délibéré) :

- **Validation** : `CreateVehicleDto` n'est qu'une classe avec des déclarations de champs, pas encore de décorateurs `class-validator`. `POST /vehicles` acceptera volontiers n'importe quelle forme avec les bons noms de champs. Corrigé à l'étape 04.
- **Constructeurs (manufacturers)** : les véhicules ne référencent pas encore de constructeur. La clé étrangère `manufacturerId` est ajoutée à l'étape 04 quand les constructeurs eux-mêmes sont introduits.
- **Auth** : toutes les routes sont ouvertes. L'étape 06 retrofittera l'autorisation.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `@Controller('vehicles')` | `[ApiController] [Route("vehicles")]` | Le routage NestJS est purement décorateur ; .NET a à la fois le routage par attribut et conventionnel. |
| `@Get()` / `@Post()` / `@Body()` / `@Param()` | `[HttpGet] [HttpPost] [FromBody] [FromRoute]` | Correspondance directe un pour un. |

`VehiclesController` joue le même rôle qu'un `[ApiController] VehiclesController : ControllerBase`. Le pattern .NET le plus proche est :

```csharp
[ApiController]
[Route("vehicles")]
public class VehiclesController : ControllerBase {
    private readonly VehiclesService _vehicles;
    public VehiclesController(VehiclesService vehicles) { _vehicles = vehicles; }

    [HttpGet] public IActionResult GetAll() => Ok(_vehicles.FindAll());
    [HttpGet("{id}")] public IActionResult GetOne(string id) => Ok(_vehicles.FindOne(id));
    [HttpPost] public IActionResult Create([FromBody] CreateVehicleDto dto) => Created(...);
    // …
}
```

Même injection par constructeur, même routage par méthode, même liaison de paramètres. La seule traduction est que `[FromBody]` devient `@Body()` et que vous mettez le préfixe de route dans le décorateur de classe au lieu de `[Route(...)]`.

La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/02-controllers-routing`. Le livrable de l'étape 01 (`/health`, `/vroom`) est déjà en place. Votre travail : ajouter le CRUD `/vehicles`.

1. Créez un nouveau module de feature dans `src/vehicles/` avec :
   - `entities/vehicle.entity.ts` — une classe simple avec `id, make, model, year, vin, mileageKm, createdAt, updatedAt` (utilisez les initialiseurs `!` puisque ces champs sont peuplés à la construction, pas à la déclaration).
   - `dto/create-vehicle.dto.ts` — `make, model, year, vin, mileageKm` (pas de validation pour l'instant).
   - `dto/update-vehicle.dto.ts` — mêmes champs, tous optionnels.
2. Écrivez `vehicles.service.ts` (`@Injectable()`) :
   - Détenez un `private readonly store = new Map<string, Vehicle>()`.
   - Dans `onModuleInit()` : enregistrez le roster de seed des véhicules auprès de `SeedService` (le fichier de seed vit à `src/seed/vehicles.seed.ts`), puis copiez chaque entrée dans votre `store`.
   - Implémentez `findAll()`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`. `findOne` et `remove` lèvent `NotFoundException` pour les ID inconnus (NestJS le transforme automatiquement en 404).
   - Pour `create`, générez le prochain ID comme `'V' + nextNum.padStart(3, '0')` — gardez un compteur `nextNum` qui démarre au-delà du plus grand ID de seed.
3. Écrivez `vehicles.controller.ts` (`@Controller('vehicles')`) :
   - Injectez `VehiclesService`.
   - Cinq routes : `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
   - Sur `DELETE`, fixez le statut de réponse à `204 No Content` via `@HttpCode(HttpStatus.NO_CONTENT)`.
4. Écrivez `vehicles.module.ts` déclarant le contrôleur et le service.
5. Câblez `VehiclesModule` dans le tableau `imports` d'`AppModule`.

## Essayez

```bash
npm run start:dev
```

```bash
# 12 véhicules seedés
curl -s http://localhost:3000/vehicles | jq 'length'
# → 12

# Un véhicule spécifique
curl -s http://localhost:3000/vehicles/V008 | jq
# → { "id": "V008", "make": "Aston Martin", "model": "DB5", "year": 1964, ... }

# 404 pour un ID inconnu
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V999
# → 404

# Créer un nouveau véhicule (pas encore de validation — essayez un body malformé pour voir)
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000}' \
| jq

# Le mettre à jour (utilisez l'ID retourné ci-dessus)
curl -s -X PATCH http://localhost:3000/vehicles/V013 \
  -H 'content-type: application/json' \
  -d '{"mileageKm":43500}' \
| jq

# Le supprimer
curl -s -X DELETE -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V013
# → 204
```

## Point de contrôle

```bash
npm run test:e2e -- 02-vehicles
```

Trois tests qui passent :

```
PASS test/02-vehicles.e2e-spec.ts
  Step 02 — Controllers & Routing (e2e)
    ✓ GET /vehicles returns the seeded roster (≥ 12 entries)
    ✓ POST /vehicles creates a vehicle and round-trips via GET /:id
    ✓ GET /vehicles/:id returns 404 for an unknown id
```

Passez à l'étape 03 avec `git checkout start/03-providers-dependency-injection` (une fois que cette branche existe — pour la livraison MVP, l'atelier s'arrête actuellement ici, avec les véhicules uniquement).

## Pour aller plus loin

- Inspectez le roster de seed dans `src/seed/vehicles.seed.ts`. Il y a trois clins d'œil délibérés — pouvez-vous les repérer ? (Indice : 1964, 1981, 1976.)
- Essayez de créer un véhicule avec `mileageKm: -1` ou `year: 1700`. L'API l'accepte. C'est parce que la validation n'est pas encore câblée — l'étape 04 corrige ça.
- Essayez la `Reliant Robin` (`V010`) — son kilométrage est suspicieusement bas pour un véhicule de 1976. Peut-être que le précédent propriétaire ne la conduisait que le dimanche.

## Pièges courants

- **`Cannot find module './vehicles/vehicles.module'`** au démarrage de l'app : vous avez oublié d'ajouter `VehiclesModule` à `AppModule.imports`. NestJS ne découvre pas les modules automatiquement.
- **`Nest can't resolve dependencies of the VehiclesService`** au boot : `SeedService` est injecté depuis `SeedModule`. `SeedModule` est `@Global` donc vous n'avez pas besoin de l'ajouter à `VehiclesModule.imports` — mais il doit toujours être dans `AppModule.imports` (il l'est déjà depuis l'étape 01).
- **`POST /vehicles` retourne 200 au lieu de 201** : NestJS retourne 201 par défaut pour les méthodes décorées par `@Post` automatiquement — mais si vous avez oublié le décorateur et utilisé `@Get` par erreur, vous obtiendrez 200. Revérifiez.
- **`DELETE /vehicles/:id` retourne 200 au lieu de 204** : ajoutez `@HttpCode(HttpStatus.NO_CONTENT)` à la méthode du contrôleur. Le défaut est 200.
- **Le véhicule créé a `id: undefined`** : vous avez oublié le compteur `nextNum`, ou vous utilisez `Map.size + 1` (qui collisionne après des suppressions). Suivez `nextNum` séparément et incrémentez-le dans `create`.
