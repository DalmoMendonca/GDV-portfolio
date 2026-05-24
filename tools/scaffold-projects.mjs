import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const curriculumPath = path.join(root, "curriculum.md");
const projectsRoot = path.join(root, "projects");
const dataDir = path.join(root, "src", "data");
const monorepoName = "games-portfolio";
const monorepoUrl = "https://github.com/DalmoMendonca/games-portfolio/tree/master";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProjectNumber(value) {
  return value.toString().padStart(2, "0");
}

function extractBullet(block, label) {
  const match = block.match(new RegExp(`^- ${label}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function parseCurriculum(markdown) {
  const lines = markdown.split(/\r?\n/);
  const courses = [];
  let currentCourse = null;
  let currentProject = null;
  let projectBody = [];

  function finishProject() {
    if (!currentCourse || !currentProject) return;
    const block = projectBody.join("\n");
    currentCourse.projects.push({
      ...currentProject,
      learningObjectives: extractBullet(block, "Learning objectives"),
      executionDetails: extractBullet(block, "Execution details"),
      gradingRubric: extractBullet(block, "Grading rubric"),
    });
    currentProject = null;
    projectBody = [];
  }

  for (const line of lines) {
    const courseMatch = line.match(/^## Course \d+: (GDV \d{3}) - (.+)$/);
    if (courseMatch) {
      finishProject();
      currentCourse = {
        code: courseMatch[1].replace(/\s+/g, ""),
        displayCode: courseMatch[1],
        title: courseMatch[2].trim(),
        projects: [],
      };
      courses.push(currentCourse);
      continue;
    }

    const projectMatch = line.match(/^#### (GDV\d{3})-P(\d+): (.+)$/);
    if (projectMatch) {
      finishProject();
      currentProject = {
        courseCode: projectMatch[1],
        projectNumber: normalizeProjectNumber(projectMatch[2]),
        title: projectMatch[3].trim(),
      };
      continue;
    }

    if (currentProject) {
      projectBody.push(line);
    }
  }
  finishProject();
  return courses;
}

function projectReadme(course, project) {
  const id = `${course.code}-P${project.projectNumber}`;
  const sourcePath = `projects/${course.code}/P${project.projectNumber}`;
  const repoName = `${monorepoName}/${sourcePath}`;
  return `# ${id}: ${project.title}

Course: ${course.displayCode} - ${course.title}

Public repository target: ${repoName}

Netlify status: Placeholder. Deploy this game when implementation begins.

## Generic Description

${project.learningObjectives || "To be refined from the course curriculum."}

## Specific Execution

${project.executionDetails || "Implementation details will be filled in during production."}

## Grading Rubric

${project.gradingRubric || "See course rubric in curriculum.md."}

## Expected Deliverables

- Playable build
- Source repository
- 30 to 90 second capture video or GIF
- Designer's note
- One-page postmortem
- Accessibility checklist
- Build instructions
- Public portfolio metadata

## Links

- Local project path: ${sourcePath}
- Public game URL: TBD
- GitHub repository: ${monorepoUrl}/${sourcePath}
- Netlify deploy: TBD
`;
}

function projectJson(course, project) {
  const id = `${course.code}-P${project.projectNumber}`;
  const sourcePath = `projects/${course.code}/P${project.projectNumber}`;
  const repoName = `${monorepoName}/${sourcePath}`;
  return JSON.stringify(
    {
      id,
      courseCode: course.code,
      courseTitle: course.title,
      projectNumber: `P${project.projectNumber}`,
      title: project.title,
      repoName,
      status: id === "GDV501-P01" ? "implemented" : "placeholder",
      genericDescription: project.learningObjectives,
      specificDescription: project.executionDetails,
      gradingRubric: project.gradingRubric,
      localPath: `${sourcePath}/`,
      gameUrl: id === "GDV501-P01" ? `projects/${course.code}/P${project.projectNumber}/index.html` : "",
      githubUrl: `${monorepoUrl}/${sourcePath}`,
      netlifyUrl: "",
    },
    null,
    2,
  );
}

function portfolioData(courses) {
  const payload = courses.map((course) => ({
    code: course.code,
    displayCode: course.displayCode,
    title: course.title,
    projects: course.projects.map((project) => {
      const id = `${course.code}-P${project.projectNumber}`;
      const sourcePath = `projects/${course.code}/P${project.projectNumber}`;
      return {
        id,
        courseCode: course.code,
        courseTitle: course.title,
        projectNumber: `P${project.projectNumber}`,
        title: project.title,
        repoName: `${monorepoName}/${sourcePath}`,
        status: id === "GDV501-P01" ? "implemented" : "placeholder",
        genericDescription: project.learningObjectives,
        specificDescription: project.executionDetails,
        rubric: project.gradingRubric,
        localPath: `${sourcePath}/`,
        gameUrl: id === "GDV501-P01" ? `./projects/${course.code}/P${project.projectNumber}/index.html` : "",
        githubUrl: `${monorepoUrl}/${sourcePath}`,
        netlifyUrl: "",
      };
    }),
  }));

  return `export const courses = ${JSON.stringify(payload, null, 2)};\n\nexport const allProjects = courses.flatMap((course) => course.projects);\n`;
}

const curriculum = await readFile(curriculumPath, "utf8");
const courses = parseCurriculum(curriculum);

await mkdir(projectsRoot, { recursive: true });
await mkdir(dataDir, { recursive: true });

for (const course of courses) {
  const courseDir = path.join(projectsRoot, course.code);
  await mkdir(courseDir, { recursive: true });

  for (const project of course.projects) {
    const projectDir = path.join(courseDir, `P${project.projectNumber}`);
    await mkdir(projectDir, { recursive: true });
    await writeFile(path.join(projectDir, "README.md"), projectReadme(course, project), "utf8");
    await writeFile(path.join(projectDir, "project.json"), `${projectJson(course, project)}\n`, "utf8");
  }
}

await writeFile(path.join(dataDir, "projects.js"), portfolioData(courses), "utf8");

console.log(`Scaffolded ${courses.length} courses and ${courses.reduce((sum, course) => sum + course.projects.length, 0)} projects.`);
