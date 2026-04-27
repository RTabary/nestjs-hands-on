# Étape 08 — Testing

> **Durée estimée : 20 min** &nbsp;·&nbsp; **Branche start** : `start/08-testing`  &nbsp;·&nbsp; **Branche solution** : `solution/08-testing`

## Objectifs d'apprentissage

À la fin de cette étape, vous saurez :

1. Lire et écrire un **test unitaire** NestJS avec `Test.createTestingModule`, en mockant uniquement les dépendances que l'unité testée consomme réellement.
2. Lire et écrire un **test end-to-end** avec `supertest` contre le `AppModule` complet, exerçant le comportement HTTP de la même façon qu'un client réel.
3. Décider quel type de test mérite un nouveau bout de code — règles de niveau service vs. flux transversaux — et placer le fichier sous la bonne convention (`*.spec.ts` à côté de la source vs. `*.e2e-spec.ts` sous `test/`).
4. Reconnaître le pattern `Test.createTestingModule` dans votre boulot quotidien : c'est l'outil unique qui a silencieusement alimenté le test de checkpoint de chaque étape précédente.

## Principe

NestJS distingue deux saveurs de tests par **convention** (nom de fichier) et **portée** :

- **Tests unitaires** (`<thing>.spec.ts` à côté du fichier source) construisent le plus petit module NestJS possible contenant la classe testée, remplaçant chaque dépendance par un mock. Ils s'exécutent en millisecondes et épinglent une préoccupation à la fois.
- **Tests end-to-end** (`<thing>.e2e-spec.ts` sous `test/`) bootent l'`AppModule` complet via `Test.createTestingModule({ imports: [AppModule] }).createNestApplication()` et l'exercent avec `supertest` sur HTTP. Plus lents (quelques centaines de ms par test) mais ils attrapent les bugs de câblage qu'aucun test unitaire ne peut voir — pipes, guards, filters, interceptors, composition de modules.

La classe la plus structurante est `Test` de `@nestjs/testing`. `Test.createTestingModule({ providers, controllers, imports })` retourne un builder qui se compile en `TestingModule`. À partir de là vous pouvez :

- `module.get(SomeService)` — même résolution DI qu'à l'exécution ; vous obtenez l'instance câblée.
- `module.createNestApplication()` — booter une vraie `INestApplication` pour tester HTTP. Les providers `APP_PIPE`, `APP_FILTER` et `APP_GUARD` d'`AppModule` s'enregistrent automatiquement (c'est exactement pourquoi les étapes 04, 05 et 06 ont utilisé l'enregistrement au niveau du module).

Pour les tests unitaires, override les dépendances coûteuses avec des mocks `useValue` ou `useFactory`. Pour les tests e2e, le but est de **ne pas** mocker — vous voulez le câblage réel.

Les deux exemples dans cette étape montrent les deux :

- **`src/spare-parts/spare-parts.service.spec.ts`** teste unitairement `SparePartsService` contre un stub fait main de `SeedService`. Cinq cas courts, runtime total ≈ 10 ms.
- **`test/08-full-flow.e2e-spec.ts`** pilote un parcours utilisateur complet : créer un véhicule, créer un ordre de maintenance, le transitionner jusqu'à completion, vérifier que le stock a décrémenté. Plus un cas négatif où la machine à états retourne l'enveloppe unifiée.

## Parallèle .NET

| Construction NestJS | Équivalent ASP.NET Core | Là où l'analogie se brise |
|---------------------|-------------------------|---------------------------|
| Jest + `Test.createTestingModule` de `@nestjs/testing` | xUnit / NUnit + `WebApplicationFactory<TStartup>` | Parallèle direct ; le « testing module » joue le même rôle que la test factory. |

Si vous avez utilisé le pattern `WebApplicationFactory<Program>` dans les tests d'intégration ASP.NET Core :

```csharp
public class OrderFlowTests : IClassFixture<WebApplicationFactory<Program>> {
    private readonly HttpClient _client;
    public OrderFlowTests(WebApplicationFactory<Program> factory) {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task FullFlow() {
        var resp = await _client.PostAsJsonAsync("/vehicles", new {...});
        resp.EnsureSuccessStatusCode();
        // ...
    }
}
```

…alors l'équivalent NestJS se lit presque pareil :

```ts
let app: INestApplication;
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
});

it('full flow', async () => {
  await request(app.getHttpServer()).post('/vehicles').send({...}).expect(201);
});
```

Même pattern de factory, même sémantique « graphe DI réel », bibliothèque de transport différente (`supertest` vs. `HttpClient`). La traduction principale : NestJS override via `.overrideProvider(...).useValue(...)` sur le builder du testing module ; .NET override via `factory.WithWebHostBuilder(b => b.ConfigureServices(s => ...))`.

La table de correspondance complète est dans [docs/dotnet-parallels.md](../dotnet-parallels.md).

## Comment faire

Vous êtes sur `start/08-testing`. La machinerie de configuration de l'étape 07 est en place. Le « test de checkpoint » de cette étape est lui-même : vous écrivez les fichiers de test.

1. Écrivez **`src/spare-parts/spare-parts.service.spec.ts`** — test unitaire :
   - Utilisez `Test.createTestingModule({ providers: [SparePartsService, { provide: SeedService, useValue: { has: () => true, get: () => SPARE_PARTS_SEED } }] })`.
   - Compilez, puis `module.get(SparePartsService)` et appelez `service.onModuleInit()` pour que le seed se charge.
   - Cinq tests couvrant : `findOne` retourne un seed connu ; `findOne` lève `NotFoundException` ; `findAll` ≥ 20 entrées ; `decrementStock` réduit de 1 ; `decrementStock` plancher à 0.
2. Écrivez **`test/08-full-flow.e2e-spec.ts`** — test e2e :
   - Bootez l'app complète avec `createTestApp()` depuis `test/utils/test-app.factory.ts`.
   - Test 1 (flux positif) : POST un véhicule frais ; capturez le stock actuel de P017 ; POST un ordre de maintenance avec ce véhicule et `partIds: ['P017']` ; transitionnez queued → in_progress (200) ; transitionnez → completed (200) ; GET `/spare-parts/P017` et assertez que `stock` a décrémenté de 1.
   - Test 2 (flux négatif) : POST un autre véhicule et ordre frais ; tentez la transition illégale `queued → completed` ; assertez 400 avec la forme d'enveloppe unifiée (`statusCode: 400, error: 'Bad Request', message: /Illegal transition/`).
3. Le `package.json` expose déjà les scripts `test`, `test:watch`, `test:cov` et `test:e2e` — pas de changement nécessaire ; consultez les définitions des scripts pour voir ce que chacun lance.

## Essayez

```bash
# Tous les tests unitaires (cinq, tous depuis spare-parts.service.spec.ts).
# Tourne en ~1 seconde.
npm test

# Tous les tests e2e (le checkpoint de chaque étape plus le nouvel exemple full-flow).
# Tourne en ~5 secondes.
npm run test:e2e

# Une seule suite par pattern :
npm run test:e2e -- 08-

# Mode watch pour TDD : relance les tests unitaires à chaque sauvegarde.
npm run test:watch
```

Ouvrez `src/spare-parts/spare-parts.service.spec.ts` et `test/08-full-flow.e2e-spec.ts` côte à côte. Notez comme le fichier de test unitaire fait le tiers de la longueur du test e2e, et comme son setup (`beforeEach` avec SeedService mocké) est ce qui lui donne sa vitesse.

## Point de contrôle

```bash
npm run test:e2e -- 08-
```

Trois tests qui passent :

```
PASS test/08-meta.e2e-spec.ts          # le check FR-017 red→green que les fichiers exemples existent
  ✓ introduces src/spare-parts/spare-parts.service.spec.ts
  ✓ introduces test/08-full-flow.e2e-spec.ts

PASS test/08-full-flow.e2e-spec.ts
  ✓ creates a vehicle, runs a maintenance order to completion, and decrements stock
  ✓ rejects an illegal transition (queued → completed) with 400 in the unified envelope
```

Plus la suite de tests unitaires via `npm test` :

```
PASS src/spare-parts/spare-parts.service.spec.ts
  ✓ findOne returns a seeded part by id
  ✓ findOne throws NotFoundException for an unknown id
  ✓ findAll returns at least the seed roster
  ✓ decrementStock reduces stock by 1
  ✓ decrementStock floors at 0 (never goes negative)
```

C'est la fin du **curriculum cœur**. À partir d'ici, sautez dans n'importe laquelle des cinq branches stretch (`start/S1-interceptors` à `start/S5-microservices`) — chacune part de `solution/08-testing` indépendamment.

## Pour aller plus loin

- **Rapport de coverage** : `npm run test:cov` produit un rapport HTML à `coverage/lcov-report/index.html`. Ouvrez-le. Notez les trous que vous n'avez pas couverts (ex. `MaintenanceOrdersService.assertQueueHasRoom`).
- **Override de providers en e2e** : `Test.createTestingModule({ imports: [AppModule] }).overrideProvider(AppConfigService).useValue({ getApiKey: () => 'test-only', ... })` — utile quand un test e2e a besoin d'une config différente sans toucher à `.env.test`.
- **Matchers custom** : écrivez un matcher Jest qui asserte la forme de l'enveloppe d'erreur unifiée en une ligne : `expect(res.body).toBeUnifiedError(404)`. Le pattern est dans la doc Jest sous « Expect.extend ».
- **Tests de snapshot** : `expect(res.body).toMatchSnapshot()` est génial pour la détection de régressions sur la forme des réponses. Utilisé judicieusement, ça peut remplacer des assertions `toMatchObject` verbeuses.

## Pièges courants

- **`Nest can't resolve dependencies of the SparePartsService`** dans le test unitaire : vous avez oublié de fournir `SeedService` (ou votre objet mock manque les méthodes que le service appelle réellement — `has` et `get`).
- **Le test unitaire passe mais le test e2e échoue sur la même opération** : ça veut presque toujours dire qu'une pipe/filter/guard global enregistré via `APP_*` est impliqué, et votre test unitaire le contourne. C'est par design — l'e2e est ce qui attrape l'intégration. N'essayez pas de « réparer » le test unitaire en ajoutant la chose globale ; laissez l'e2e en assumer la responsabilité.
- **`createNestApplication()` appelle déjà `app.init()`** : n'appelez pas `app.init()` une seconde fois dans votre test, vous obtiendrez une erreur « Nest application has already been initialized ».
- **Oublié `app.close()` dans `afterAll`** : les tests passent quand même, mais Jest pend à la fin (« Jest did not exit one second after the test run completed »). Pairez toujours `await createTestApp()` dans `beforeAll` avec `await app.close()` dans `afterAll`.
- **Les tests partagent leur état entre fichiers** : non, par défaut. Chaque `*.e2e-spec.ts` boote sa propre instance d'app avec son propre store en mémoire. Si vous voulez des fixtures partagées, utilisez `globalSetup` de Jest — mais réfléchissez bien avant ; l'état de test isolé vaut généralement son pesant d'or.
- **package-lock obsolète après ajout de deps** : si un coéquipier ajoute `@nestjs/swagger` (stretch S3) et push, `npm ci` peut échouer en plein test avec « lockfile does not match package.json ». Lancez `npm install` une fois après le pull.
