import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const projectsRoot = path.join(root, "projects");
const outputRoot = path.join(root, "dist", "projects");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outputRoot, { recursive: true });

const implemented = [
  ["GDV501", "P01"],
  ["GDV501", "P02"],
  ["GDV501", "P03"],
  ["GDV501", "P04"],
  ["GDV501", "P05"],
  ["GDV501", "P06"],
  ["GDV501", "P07"],
  ["GDV501", "P08"],
  ["GDV501", "P09"],
  ["GDV501", "P10"],
];
for (const [course, project] of implemented) {
  const source = path.join(projectsRoot, course, project, "dist");
  const destination = path.join(outputRoot, course, project);
  if (await exists(source)) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
    console.log(`Copied ${course}/${project} build into portfolio dist.`);
  } else {
    console.log(`Skipped ${course}/${project}; no build found yet.`);
  }
}
