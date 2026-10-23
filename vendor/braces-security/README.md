# Local security backport

This private, vendored package is based on the MIT-licensed `braces@3.0.3` npm release. It is not an upstream release. Original file checksums are recorded in `upstream-sha256.json`; the original license and attribution are retained.

GHSA-vfj7-8cjw-p6xm (CVE-2026-93687) has no published upstream fix as of 23 October 2026. This backport bounds parser nesting and validates AST depth, size, and cycles iteratively before the recursive compile, expand, and stringify walkers execute. It rejects excessive input with a controlled SyntaxError; ordinary brace syntax and expansion limits retain upstream behavior. Callers must still handle invalid input and must not expose arbitrary regular expressions as a network API.

The scoped local name distinguishes the modified code from the vulnerable upstream release. Package-manager overrides route all `braces` consumers to this checked-in implementation. This is a source fix, not an audit suppression or a claim that upstream 3.0.3 is patched.

Run `npm run test:security` from the repository root. Replace this backport with a verified upstream release when one becomes available.

References: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm and https://github.com/micromatch/braces/issues/70.
