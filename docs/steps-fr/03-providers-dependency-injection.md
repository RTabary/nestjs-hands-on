# Étape 03 — Providers & Injection de dépendances

> **Durée estimée : 15 min** &nbsp;·&nbsp; **Branche start** : `start/03-providers-dependency-injection` &nbsp;·&nbsp; **Branche solution** : `solution/03-providers-dependency-injection`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Composer la logique métier à travers plusieurs modules en **injectant un service dans un autre**.
2. Résoudre une dépendance circulaire entre modules en enregistrant un provider dans le module « consommateur » plutôt que dans le module « propriétaire ».
3. Reconnaître quand un service mérite son propre module versus quand il devrait voyager avec le module qui l'utilise.

## Principe

Un **provider** NestJS est toute classe enregistrée dans le tableau `providers` d'un `@Module`. Par défaut chaque provider est un **singleton** scopé au module — il existe exactement une instance, créée paresseusement, partagée par tous les consommateurs. Les paramètres de constructeur typés comme des classes sont résolus par le conteneur DI à l'instanciation : c'est *exactement* le mécanisme qu'utilise `IServiceProvider` d'ASP.NET Core, juste exprimé via des décorateurs TypeScript au lieu d'appels explicites à `services.AddScoped<T>()`.

Cette étape introduit un tout nouveau module de feature — `SparePartsModule` avec son propre contrôleur, service et DTO — et un troisième service, `CompatibilityService`, qui **injecte les deux** `VehiclesService` et `SparePartsService`. Le CompatibilityService répond à une question dont aucune des deux features ne possède naturellement la responsabilité : « étant donné un véhicule, quelles pièces lui conviennent ? ». C'est le cas d'usage classique de la composition service-à-service.

Il y a une petite énigme architecturale à résoudre : où **vit** CompatibilityService ? S'il était dans `SparePartsModule`, alors SparePartsModule devrait importer VehiclesModule (pour injecter VehiclesService), ET VehiclesModule devrait importer SparePartsModule (pour exposer la nouvelle route de compatibilité). C'est un import circulaire de modules — NestJS déteste ça.

La solution : **enregistrer CompatibilityService dans `VehiclesModule`** (qui importe déjà SparePartsModule). La direction de la dépendance reste à sens unique (`vehicles → spare-parts`), pas de cycle. Le fichier de service lui-même peut vivre où ça a un sens architectural ; dans cette base de code on le met sous `src/spare-parts/` parce que la compatibilité concerne conceptuellement les pièces.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| Provider `@Injectable()` (portée par défaut) | `services.AddScoped<T>()` | Le défaut NestJS est **singleton**, pas scoped ; la portée par requête est explicite via `{ scope: Scope.REQUEST }`. |
| Injection par constructeur en NestJS | Injection par constructeur en .NET | Pattern identique ; seule différence : métadonnées de décorateurs vs source generators. |

Si vous écriviez une « recherche de compatibilité » en ASP.NET Core, ça ressemblerait à ceci :

```csharp
public class CompatibilityService {
    private readonly IVehiclesService _vehicles;
    private readonly ISparePartsService _spareParts;
    public CompatibilityService(IVehiclesService v, ISparePartsService s) {
        _vehicles = v; _spareParts = s;
    }
    public IEnumerable<SparePart> FindCompatible(string vehicleId) =>
        _spareParts.FindAll().Where(p => p.CompatibleVehicleIds.Contains(vehicleId));
}
```

Les seules traductions : `[Injectable]` devient `@Injectable()` ; vous n'avez pas besoin d'une interface `IXxxService` (NestJS résout par identité de classe) ; et la possession par module doit être explicite parce qu'il n'y a pas de « conteneur racine unique » comme l'est `WebApplicationBuilder.Services`.

La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/03-providers-dependency-injection`. Le CRUD des véhicules de l'étape 02 est en place.

1. Créez un nouveau module dans `src/spare-parts/` calqué sur la structure des véhicules :
   - `entities/spare-part.entity.ts` avec les champs `id, partNumber, name, category, priceEur, stock, compatibleVehicleIds, createdAt, updatedAt`. `category` est un type union de littéraux : `'engine' | 'brakes' | 'tires' | 'electrical' | 'body' | 'misc'`.
   - `dto/create-spare-part.dto.ts`, `dto/update-spare-part.dto.ts` — mêmes champs que l'entité moins ceux fixés par le serveur ; pas encore de validation.
   - `spare-parts.service.ts` — même forme que `VehiclesService` : `Map` en mémoire, `onModuleInit` enregistre et lit le seed, format d'ID `'P' + nextNum.padStart(3, '0')`.
   - `spare-parts.controller.ts` — cinq routes CRUD calquées sur les véhicules, préfixe `'spare-parts'`.
   - `spare-parts.module.ts` — déclare le contrôleur, enregistre + **exporte** `SparePartsService` pour que d'autres modules puissent l'injecter.
2. Créez `src/spare-parts/compatibility.service.ts`. Marquez-le `@Injectable()` et injectez **les deux** `VehiclesService` et `SparePartsService` via le constructeur. Ajoutez une méthode :
   ```ts
   findCompatible(vehicleId: string): SparePart[] {
     this.vehicles.findOne(vehicleId); // throws 404 if unknown
     return this.spareParts
       .findAll()
       .filter((p) => p.compatibleVehicleIds.includes(vehicleId));
   }
   ```
3. Mettez à jour `src/vehicles/vehicles.module.ts` :
   - `imports: [SparePartsModule]` (pour que SparePartsService soit résolvable).
   - `providers: [VehiclesService, CompatibilityService]` (CompatibilityService est enregistré ICI, même si son fichier vit sous `src/spare-parts/` — voir le Principe ci-dessus pour le pourquoi).
4. Mettez à jour `src/vehicles/vehicles.controller.ts` :
   - Ajoutez un second paramètre de constructeur : `private readonly compatibility: CompatibilityService`.
   - Ajoutez une route `@Get(':id/compatible-parts') findCompatibleParts(@Param('id') id: string)` qui retourne `this.compatibility.findCompatible(id)`.
5. Câblez `SparePartsModule` dans `AppModule.imports` (à côté du `VehiclesModule` existant).
6. Le seed vit dans `src/seed/spare-parts.seed.ts`. Jetez-y un œil — il y a 20 pièces couvrant les six catégories. **Repérez le clin d'œil** : `partNumber: 'FLUX-CAP-MK2'`, à €88 888,88, compatible uniquement avec le véhicule `V009`. L'étape 05 utilisera ça pour un moment d'enseignement sur les exception filters.

## Essayez

```bash
npm run start:dev
```

```bash
# Parcourir le catalogue
curl -s http://localhost:3000/spare-parts | jq 'length'
# → 20

# Trouver les pièces compatibles avec la Renault Clio (V001)
curl -s http://localhost:3000/vehicles/V001/compatible-parts | jq '. | length'
# → ~10

# Trouver les pièces compatibles avec la DeLorean (V009) — la blague est juste là
curl -s http://localhost:3000/vehicles/V009/compatible-parts | jq '.[].partNumber'
# → "BRK-FLD-008", "WPR-BLD-017", "FLUX-CAP-MK2"  (le fluide universel + essuie-glaces + le clin d'œil)

# Véhicule inconnu retourne 404 (la recherche passe par VehiclesService)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vehicles/V999/compatible-parts
# → 404
```

## Point de contrôle

```bash
npm run test:e2e -- 03-spare-parts
```

Trois tests qui passent :

```
PASS test/03-spare-parts.e2e-spec.ts
  ✓ GET /spare-parts returns the seeded roster (≥ 20 entries)
  ✓ GET /vehicles/V009/compatible-parts includes the flux capacitor
  ✓ GET /vehicles/V999/compatible-parts returns 404 (vehicle unknown)
```

Si le troisième test échoue avec un message 404 mentionnant `SparePart V999` au lieu de `Vehicle V999`, vous avez inversé l'ordre des recherches — `findCompatible` doit appeler `vehicles.findOne` en premier, **puis** filtrer la liste des pièces.

## Pour aller plus loin

- Ajoutez une quatrième route côté spare-parts : `GET /spare-parts/by-category/:category` qui retourne toutes les pièces d'une catégorie. Pratiquez `@Param('category')` avec le type union `SparePartCategory`.
- Essayez de remettre CompatibilityService **dans** `SparePartsModule` (avec `imports: [VehiclesModule]`). Regardez NestJS se plaindre de la dépendance circulaire. Puis revertez — c'est l'expérience vécue de la règle architecturale.
- Cherchez `forwardRef()` dans la doc NestJS. C'est l'échappatoire quand des dépendances circulaires sont vraiment nécessaires (rare en pratique). Savoir que ça existe suffit ; y recourir devrait être votre dernier recours.

## Pièges courants

- **`Nest can't resolve dependencies of the CompatibilityService`** au boot : vous avez enregistré CompatibilityService dans `SparePartsModule.providers` au lieu de `VehiclesModule.providers`. SparePartsModule n'importe pas VehiclesModule, donc VehiclesService n'y est pas visible.
- **`Nest can't resolve dependencies of the VehiclesController. Please make sure that the argument CompatibilityService at index [1] is available`** : vous avez oublié d'ajouter `CompatibilityService` à `VehiclesModule.providers`. Importer le fichier ne suffit pas — le provider doit être enregistré.
- **Erreurs `Cannot find module './compatibility.service'`** : le chemin du fichier est `src/spare-parts/compatibility.service.ts` mais les imports dans `vehicles.module.ts` et `vehicles.controller.ts` référencent `'../spare-parts/compatibility.service'` (un dossier au-dessus).
- **`/vehicles/:id/compatible-parts` retourne la mauvaise forme** : une typo classique est que `findCompatible(id)` retourne `Vehicle[]` au lieu de `SparePart[]`. Regardez sur quoi votre `filter` itère.
