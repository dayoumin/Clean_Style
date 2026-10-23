// Points git at the repository hook folder so .githooks/pre-push runs (release rule 2).
// Runs from `pnpm install`; skipped quietly outside a git checkout.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  // Not a git checkout (or git unavailable): nothing to install.
}
