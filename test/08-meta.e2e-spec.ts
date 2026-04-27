import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Step 08 doesn't add new HTTP behaviour — it teaches the test
 * framework that has been silently powering every prior checkpoint.
 * The deliverable IS the test code itself: a *.spec.ts unit test
 * exemplar for SparePartsService, plus a full-flow e2e test.
 *
 * This meta-test is the FR-017 red target for start/08-testing: it
 * asserts those exemplar files exist. They don't on solution/07
 * (this branch); they do on solution/08 (where step 08's content
 * lands). Hence: red on A7, green on A8.
 */
describe('Step 08 — Testing (meta checkpoint)', () => {
  const repoRoot = join(__dirname, '..');

  it('introduces src/spare-parts/spare-parts.service.spec.ts (unit test exemplar)', () => {
    const path = join(repoRoot, 'src/spare-parts/spare-parts.service.spec.ts');
    expect(existsSync(path)).toBe(true);
  });

  it('introduces test/08-full-flow.e2e-spec.ts (e2e exemplar)', () => {
    const path = join(repoRoot, 'test/08-full-flow.e2e-spec.ts');
    expect(existsSync(path)).toBe(true);
  });
});
