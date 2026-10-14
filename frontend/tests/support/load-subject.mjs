import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Each dependency must be supplied by the caller. Tests cannot accidentally
// instantiate the real Supabase client or write to the configured project.
export function loadSubject(relativePath, dependencies = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const subject = new Module(filename);
  subject.require = (specifier) => {
    if (!Object.hasOwn(dependencies, specifier)) {
      throw new Error(`Unmocked dependency in isolated test: ${specifier}`);
    }
    return dependencies[specifier];
  };
  subject._compile(compiled, filename);
  return subject.exports;
}
