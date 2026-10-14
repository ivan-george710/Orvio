import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function loadModule(relativePath) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = new Module(filename);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled, filename);
  return mod.exports;
}
