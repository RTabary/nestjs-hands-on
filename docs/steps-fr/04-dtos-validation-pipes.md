# Étape 04 — DTO & Validation Pipes

> **Durée estimée : 18 min** &nbsp;·&nbsp; **Branche start** : `start/04-dtos-validation-pipes` &nbsp;·&nbsp; **Branche solution** : `solution/04-dtos-validation-pipes`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Annoter une classe DTO avec des décorateurs `class-validator` et faire en sorte que NestJS rejette automatiquement les corps malformés avec **400 Bad Request**.
2. Enregistrer `ValidationPipe` globalement pour que les mêmes règles s'appliquent à **chaque** `@Body()` à travers l'API — sans câblage par contrôleur.
3. Dériver un DTO de mise à jour « tous champs optionnels » depuis un DTO de création via `PartialType` de `@nestjs/mapped-types`, gardant les règles de validation à un seul endroit.
4. Vérifier une référence de clé étrangère (ici : `Vehicle.manufacturerId → Manufacturer.id`) au niveau de la couche service.

## Principe

Un **DTO** (« data transfer object ») est le contrat typé pour ce que l'API accepte en entrée. En NestJS la convention est une classe par forme, décorée par des règles `class-validator` ; `class-transformer` matérialise le JSON entrant en instances de cette classe pour que les décorateurs se déclenchent. La `ValidationPipe` est le ciment qui exécute les deux librairies sur chaque paramètre lié à `@Body()`.

Trois flags du `ValidationPipe` global sont importants :

- **`whitelist: true`** retire les champs inconnus de l'entrée. Défense contre les attaques de pollution de payload.
- **`transform: true`** convertit le JSON brut en vraies instances de DTO. Nécessaire pour que les décorateurs s'exécutent ; coerce aussi par exemple `"42"` en `42` si un champ est typé `number`.
- **`forbidNonWhitelisted: true`** transforme « champ inconnu » en erreur 400 plutôt que de le laisser tomber silencieusement. Utile en développement.

Une subtilité : les pipes NestJS enregistrés via `app.useGlobalPipes()` dans `main.ts` ne se déclenchent que quand l'app est bootstrappée via `NestFactory.create(...).listen()`. Les tests qui démarrent l'app via `Test.createTestingModule(...).createNestApplication()` court-circuitent `main.ts` entièrement et louperaient silencieusement la pipe. La solution dans cette base de code : enregistrer `ValidationPipe` comme **provider au niveau du module** sous le token `APP_PIPE`. Même effet à l'exécution, mais c'est partie du graphe DI compilé d'AppModule, donc les tests le récupèrent automatiquement.

Cette étape introduit aussi l'entité **Manufacturer** et ajoute une clé étrangère `manufacturerId` à `Vehicle`. La validation ne vérifie que le *format* de `manufacturerId` ; l'existence (« est-ce que le constructeur MFR003 existe vraiment ? ») est vérifiée dans `VehiclesService.create()` parce que c'est une règle métier, pas une règle syntaxique.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `ValidationPipe` + DTO `class-validator` | Auto-validation `[ApiController]` + `IValidator<T>` (FluentValidation) | Les pipes NestJS **transforment** aussi (via `class-transformer`) ; la liaison de modèle .NET est séparée de la validation. |
| `PartialType(CreateXxxDto)` de `@nestjs/mapped-types` | Modèles partiels conscients de `[ApiController]` (ex. `JsonPatchDocument<T>` à la place, ou DTO « Update » écrits à la main) | La dérivation « toutes propriétés optionnelles » est une construction d'une ligne en NestJS ; .NET typiquement duplique la classe ou s'appuie sur JSON Patch / Merge Patch. |

Si vous écrivez des APIs ASP.NET Core `[ApiController]` avec FluentValidation, la correspondance conceptuelle est une-pour-une : `[Required]` ≈ `@IsNotEmpty()`, `[StringLength(50)]` ≈ `@MaxLength(50)`, `[RegularExpression(...)]` ≈ `@Matches(...)`. Les différences sont surtout cosmétiques — décorateurs TypeScript vs attributs C# — et le comportement à l'exécution (la liaison réussit ou échoue avant que votre méthode d'action ne s'exécute) est identique.

## Comment faire

Vous êtes sur `start/04-dtos-validation-pipes`. Le CRUD vehicles + spare-parts des étapes 02-03 est en place.

1. Créez un nouveau module de feature dans `src/manufacturers/` :
   - `entities/manufacturer.entity.ts` avec les champs `id, name, country, foundedYear, createdAt, updatedAt`.
   - `dto/create-manufacturer.dto.ts` décoré par `@IsString()`, `@IsNotEmpty()`, `@Length(1, 60)` sur `name` ; `@Length(2, 2)` + `@Matches(/^[A-Z]{2}$/)` sur `country` ; `@IsInt()` + `@Min(1850)` + `@Max(2027)` sur `foundedYear`.
   - `dto/update-manufacturer.dto.ts` étendant `PartialType(CreateManufacturerDto)`.
   - `manufacturers.service.ts` — même forme que les autres services. Ajoutez une méthode `exists(id: string): boolean` que VehiclesService appellera.
   - `manufacturers.controller.ts` — cinq routes CRUD préfixées `'manufacturers'`.
   - `manufacturers.module.ts` — déclare le contrôleur, exporte le service.
2. Mettez à jour `src/vehicles/dto/create-vehicle.dto.ts` avec des décorateurs `class-validator` sur chaque champ. La regex VIN est `/^[A-HJ-NPR-Z0-9]{17}$/` (jeu de caractères VIN réel — I, O, Q interdits). Ajoutez un champ `manufacturerId` avec `@Matches(/^MFR\d{3}$/)`.
3. Remplacez `src/vehicles/dto/update-vehicle.dto.ts` par `class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}`.
4. Mettez à jour `src/vehicles/entities/vehicle.entity.ts` pour ajouter le champ `manufacturerId`.
5. Mettez à jour `src/vehicles/vehicles.service.ts` :
   - Injectez `ManufacturersService` via le constructeur.
   - Dans `create()` et `update()`, appelez `manufacturers.exists(dto.manufacturerId)` et levez `BadRequestException` si faux (un helper privé `assertManufacturerExists` garde ça propre).
6. Mettez à jour `src/vehicles/vehicles.module.ts` :
   - Ajoutez `ManufacturersModule` aux `imports`.
7. Enregistrez `ValidationPipe` comme provider au niveau du module dans `src/app.module.ts` :
   ```ts
   import { APP_PIPE } from '@nestjs/core';
   // …
   providers: [
     AppService,
     {
       provide: APP_PIPE,
       useValue: new ValidationPipe({
         whitelist: true,
         transform: true,
         forbidNonWhitelisted: true,
       }),
     },
   ],
   ```
   Vous pouvez laisser `main.ts` minimal — pas besoin de ligne `app.useGlobalPipes(...)`.
8. Ajoutez `ManufacturersModule` à `AppModule.imports`.
9. Le seed vit à `src/seed/manufacturers.seed.ts` (9 entrées couvrant chaque marque du seed des véhicules). Le seed des véhicules a été mis à jour avec `manufacturerId` pour chaque entrée.

## Essayez

```bash
npm run start:dev
```

```bash
# 9 constructeurs seedés
curl -s http://localhost:3000/manufacturers | jq 'length'
# → 9

# La validation rejette un VIN malformé — notez le corps d'erreur structuré
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"TOO_SHORT","mileageKm":42000,"manufacturerId":"MFR003"}' \
| jq
# → { "message": [ "vin must be a 17-character ISO 3779 VIN (no I/O/Q letters)" ], ... }

# La validation rejette un pays non-ISO
curl -s -X POST http://localhost:3000/manufacturers \
  -H 'content-type: application/json' \
  -d '{"name":"Bogus","country":"France","foundedYear":1980}' \
| jq

# Champ supplémentaire interdit
curl -s -X POST http://localhost:3000/manufacturers \
  -H 'content-type: application/json' \
  -d '{"name":"Workshop Motors","country":"WS","foundedYear":2026,"colour":"red"}' \
| jq
# → { "message": [ "property colour should not exist" ], ... }

# Vérification de FK au niveau service (le constructeur n'existe pas) — retourne 400
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -d '{"make":"Mini","model":"Cooper","year":2020,"vin":"WMWXM5C50K2T12345","mileageKm":42000,"manufacturerId":"MFR999"}' \
| jq
```

## Point de contrôle

```bash
npm run test:e2e -- 04-validation
```

Cinq tests qui passent couvrant : roster de seed des constructeurs, rejet de VIN invalide, POST valide aller-retour, regex de code pays (rejet et acceptation).

## Pour aller plus loin

- Ajoutez un décorateur de validation custom : `@IsAfter('foundedYear')` pour un champ `Manufacturer` « lastReorganisedYear ». La doc `class-validator` couvre l'API `registerDecorator` en ~30 lignes.
- Essayez l'équivalent du `RuleSet` de FluentValidation — appliquer différentes règles de validation par méthode HTTP. Indice : `class-validator` a un paramètre `groups` sur chaque décorateur.
- Cherchez `PickType` et `OmitType` de `@nestjs/mapped-types`. Ils se composent avec `PartialType` pour n'importe quel DTO « sous-ensemble de champs ».

## Pièges courants

- **La validation ne se déclenche jamais (POST accepte n'importe quoi)** : vous avez enregistré `ValidationPipe` uniquement dans `main.ts`. Les tests qui bootstrappent via `Test.createTestingModule` court-circuitent `main.ts` — utilisez le token `APP_PIPE` dans `AppModule.providers` à la place, comme montré ci-dessus.
- **`Cannot find module '@nestjs/mapped-types'`** : installez avec `npm i @nestjs/mapped-types`. C'est un petit package maintenu par l'équipe NestJS, pas inclus dans `@nestjs/core`.
- **`property X should not exist`** sur une requête que vous pensiez valide : vous avez oublié d'ajouter le champ au DTO. `forbidNonWhitelisted: true` erre sur toute propriété non déclarée.
- **La validation se déclenche mais les champs sont encore des strings côté contrôleur** (ex. `year` est `"2020"` au lieu de `2020`) : vous avez oublié `transform: true` sur la pipe. Sans ça, `class-transformer` ne coerce pas.
- **La regex de `manufacturerId` passe mais le constructeur n'existe pas vraiment** : la regex ne vérifie que le format. La vérification « existe-t-il ? » est une affaire de couche service (`VehiclesService.assertManufacturerExists`). N'essayez pas de pousser l'existence dans un décorateur `class-validator` — ça coupleraient votre couche DTO à la couche service.
- **`Test.createTestingModule` erre avec `Nest can't resolve dependencies of the VehiclesService`** : vous avez ajouté `ManufacturersService` au constructeur mais oublié d'importer `ManufacturersModule` dans `VehiclesModule.imports`.
