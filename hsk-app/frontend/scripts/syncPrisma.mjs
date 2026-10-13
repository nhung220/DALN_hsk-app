import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fsExtra from "fs-extra";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const destinationModules = path.join(frontendDir, "node_modules");

// Prisma may resolve its generated client relative to backend locally, but
// Vercel can hoist it to the monorepo node_modules directory.
const moduleRoots = [
  path.resolve(frontendDir, "../backend/node_modules"),
  path.resolve(frontendDir, "../node_modules"),
  destinationModules,
];

function findGenerated(relativePath) {
  return moduleRoots
    .map(root => path.join(root, relativePath))
    .find(candidate => fs.existsSync(candidate));
}

function sync(relativePath) {
  const source = findGenerated(relativePath);
  if (!source) {
    throw new Error(`Không tìm thấy Prisma output: ${relativePath}`);
  }

  const destination = path.join(destinationModules, relativePath);
  if (path.resolve(source) !== path.resolve(destination)) {
    fsExtra.copySync(source, destination, {
      overwrite: true,
      // On Windows a running Node process can lock the native engine. Prisma
      // 5.22 uses the same engine in both packages, so keep an existing copy.
      filter: (src, dest) => !(
        path.basename(src).startsWith("query_engine-") && fs.existsSync(dest)
      ),
    });
  }
  console.log(`Prisma sync: ${source} -> ${destination}`);
}

sync(".prisma");
sync(path.join("@prisma", "client"));
