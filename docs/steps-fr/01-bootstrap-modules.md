# Étape 01 — Bootstrap & Modules

> **Durée estimée : 8 min** &nbsp;·&nbsp; **Branche start** : `start/01-bootstrap-modules` &nbsp;·&nbsp; **Branche solution** : `solution/01-bootstrap-modules`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Identifier les **trois primitives** sur lesquelles repose toute application NestJS : `@Module`, `@Controller`, `@Injectable()`.
2. Lancer une application NestJS depuis un clone propre avec trois commandes : `npm install`, `npm run start:dev`, `curl`.
3. Ajouter une nouvelle route HTTP en éditant exactement deux fichiers (une méthode de contrôleur + une méthode de service).

## Principe

Une application NestJS est un graphe de **modules**. Chaque module déclare quels **contrôleurs** traitent les requêtes HTTP et quels **providers** (typiquement des services) portent la logique métier. Le framework câble le tout au démarrage via l'**injection de dépendances**, exactement comme `IServiceCollection` d'ASP.NET Core — sauf que l'enregistrement est implicite dans les métadonnées `@Module({ controllers, providers })` au lieu d'être détaillé dans `Program.cs`.

Le point d'entrée du bootstrap est [src/main.ts](../../src/main.ts) :

```ts
const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

`AppModule` est le **module racine**. Il importe actuellement un seul `SeedModule` (qui fournit le registre de seeds en mémoire dont l'atelier dépend) et déclare un contrôleur + un service. Chaque étape suivante ajoute des modules à ce graphe.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| `@Module({ imports, controllers, providers, exports })` | Enregistrements `IServiceCollection` + frontière d'assembly + un `ConfigureServices` par « module » | Les modules NestJS sont explicites au niveau de la classe ; .NET n'a pas de type « module » de première classe — la convention est par assembly. |
| Provider `@Injectable()` (portée par défaut) | `services.AddScoped<T>()` | Le défaut NestJS est **singleton**, pas scoped ; la portée par requête est explicite via `{ scope: Scope.REQUEST }`. |

Si vous vous êtes déjà demandé « où ASP.NET Core décide-t-il vraiment quels contrôleurs gèrent quelles routes ? » — dans NestJS cette décision vit entièrement dans le décorateur `@Controller('vehicles')` et le tableau `controllers: [VehiclesController]` de son module. Pas de cérémonie équivalente à `MapControllers()` dans le fichier de bootstrap.

La table de correspondance complète se trouve dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/01-bootstrap-modules`. Lancez `npm install` si ce n'est pas déjà fait, puis faites passer le test de checkpoint qui échoue.

1. Ouvrez [src/app.controller.ts](../../src/app.controller.ts). La classe existe mais n'a aucune route — seulement le décorateur `@Controller()`. Ajoutez **deux** méthodes de route, toutes deux décorées par `@Get(...)` :
   - `getHealth()` retournant `this.appService.getHealth()` sur `GET /health`.
   - `getVroom()` retournant `this.appService.getVroom()` sur `GET /vroom`.

   N'oubliez pas d'injecter `AppService` via le constructeur (`constructor(private readonly appService: AppService) {}`).

2. Ouvrez [src/app.service.ts](../../src/app.service.ts). Ajoutez les méthodes correspondantes :
   - `getHealth()` retourne `{ status: 'ok' as const, uptimeSec: <secondes entières depuis le démarrage> }`. Suivez le moment du démarrage avec un champ `private readonly bootedAt = Date.now()`.
   - `getVroom()` retourne `{ fact: <l'une parmi ~6 chaînes de faits sur les voitures, codées en dur, choisie aléatoirement> }`. Stockez les chaînes dans un `const VROOM_FACTS: ReadonlyArray<string> = [...]` au niveau du module.

C'est tout. Ne touchez pas à `src/main.ts`, `src/app.module.ts`, ni à quoi que ce soit dans `src/seed/` — ils sont déjà câblés correctement.

## Essayez

Dans un terminal, démarrez l'application :

```bash
npm run start:dev
```

Dans un autre :

```bash
curl -s http://localhost:3000/health | jq
# → { "status": "ok", "uptimeSec": 12 }

curl -s http://localhost:3000/vroom | jq
# → { "fact": "The first speeding ticket was issued in 1896 — to a driver going 8 mph." }
```

`/vroom` retourne un fait différent à chaque appel.

## Point de contrôle

Arrêtez le serveur de dev (`Ctrl+C`) et lancez :

```bash
npm run test:e2e -- 01-bootstrap
```

Vous devriez voir **deux tests qui passent** dans `test/01-bootstrap.e2e-spec.ts` :

```
PASS test/01-bootstrap.e2e-spec.ts
  Step 01 — Bootstrap & Modules (e2e)
    ✓ GET /health returns ok
    ✓ GET /vroom returns a fun fact
```

Vert = étape terminée. Passez à l'étape 02 avec `git checkout start/02-controllers-routing`.

Si le test échoue, le message d'erreur nomme le fichier et la ligne dans `src/` à ajuster. Vous n'avez pas besoin de lire le fichier de test pour l'instant — l'étape 08 le couvre. Si vous êtes curieux, [test/01-bootstrap.e2e-spec.ts](../../test/01-bootstrap.e2e-spec.ts) est court et ouvert à l'inspection.

## Pour aller plus loin

- Ajoutez une troisième route — `GET /version` — qui retourne `{ version: '0.1.0' }`. La chaîne de version peut être codée en dur pour l'instant ; l'étape 07 (Configuration) vous montrera comment la lire correctement depuis `package.json`.
- Ouvrez `src/app.module.ts` et remarquez `imports: [SeedModule]`. Lancez l'app : le log de démarrage inclut une ligne `Seed roster ready (empty)`. Le module seed est câblé mais aucune entité n'a encore enregistré de données — les véhicules arrivent à l'étape 02.

## Pièges courants

- **« `Cannot read properties of undefined (reading 'getHealth')` »** : vous avez oublié d'injecter `AppService` dans le constructeur d'`AppController`. NestJS utilise l'injection par constructeur — le raccourci `private readonly appService: AppService` crée le champ automatiquement.
- **« `404 Not Found` » sur `GET /health` alors que vous avez ajouté la méthode** : vérifiez le décorateur `@Get('health')` — sans l'argument `'health'`, la route serait `GET /` à la place.
- **Le démarrage réussit mais `/vroom` retourne toujours le même fait** : vous avez défini `VROOM_FACTS` *à l'intérieur* de la méthode `getVroom()` au lieu d'au niveau du module. Ce n'est pas un bug fonctionnel, juste du travail inutile — sortez-le pour que le tableau ne soit construit qu'une fois.
- **L'éditeur signale un possible `undefined`** : ce projet a `strict: true` (Principe IV de la constitution). Quand vous choisissez un fait au hasard, TypeScript pense que `array[index]` peut être `undefined` ; si votre linter se plaint, gardez-vous-en ou utilisez `array[index]!` puisque vous savez que `index` est dans la plage.
