import "./styles.css";
import { allProjects, courses } from "./data/projects.js";

const app = document.querySelector("#app");
const implementedProjects = allProjects.filter((project) => project.status === "implemented");
const plannedProjects = allProjects.length - implementedProjects.length;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function projectCard(project) {
  const isLive = project.status === "implemented";
  const title = escapeHtml(project.title);
  const repoName = escapeHtml(project.repoName);
  const gameLink = isLive
    ? `<a class="button primary" href="${project.gameUrl}" target="_blank" rel="noreferrer">Play</a>`
    : `<span class="button disabled" aria-disabled="true">Coming Soon</span>`;
  const repoLink = project.githubUrl
    ? `<a class="button" href="${project.githubUrl}" target="_blank" rel="noreferrer">GitHub</a>`
    : `<span class="button disabled" aria-disabled="true">Repo Pending</span>`;

  return `
    <article class="project-card" data-status="${project.status}">
      <div class="project-kicker">
        <span>${project.id}</span>
        <span class="status ${isLive ? "live" : "planned"}">${isLive ? "Playable" : "Scaffolded"}</span>
      </div>
      <h3>${title}</h3>
      <p class="generic">${escapeHtml(project.genericDescription)}</p>
      <p>${escapeHtml(project.specificDescription)}</p>
      <div class="repo-name">${repoName}</div>
      <div class="card-actions">
        ${gameLink}
        ${repoLink}
      </div>
    </article>
  `;
}

function courseSection(course) {
  return `
    <section class="course-section" id="${course.code}">
      <div class="course-heading">
        <p>${course.displayCode}</p>
        <h2>${escapeHtml(course.title)}</h2>
      </div>
      <div class="project-grid">
        ${course.projects.map(projectCard).join("")}
      </div>
    </section>
  `;
}

function render() {
  app.innerHTML = `
    <header class="site-header">
      <nav class="nav">
        <a class="brand" href="#top" aria-label="GDV Portfolio home">GDV</a>
        <div class="nav-links">
          <a href="#catalog">Catalog</a>
          <a href="#standards">Standards</a>
          <a href="./curriculum.md">Curriculum</a>
        </div>
      </nav>
      <section class="intro" id="top">
        <div>
          <p class="eyebrow">Master of Game Design and Development</p>
          <h1>120 playable studies in systems, craft, production, and authorship.</h1>
          <p class="lede">
            A minimal public portfolio for a two-year graduate studio program. Each course contains ten playable game projects with a repository target, deployment slot, curriculum description, and production notes.
          </p>
        </div>
        <aside class="stats-panel" aria-label="Portfolio statistics">
          <div><strong>${allProjects.length}</strong><span>Total games</span></div>
          <div><strong>${courses.length}</strong><span>Courses</span></div>
          <div><strong>${implementedProjects.length}</strong><span>Playable now</span></div>
          <div><strong>${plannedProjects}</strong><span>Scaffolded</span></div>
        </aside>
      </section>
    </header>

    <section class="standards" id="standards">
      <div>
        <p class="eyebrow">Portfolio Standard</p>
        <h2>Every project is treated as a releasable artifact.</h2>
      </div>
      <ul>
        <li>Playable build, source repository, and public deployment target.</li>
        <li>Generic curriculum objective plus project-specific execution brief.</li>
        <li>Design note, postmortem, accessibility checklist, capture media, and build instructions.</li>
      </ul>
    </section>

    <section class="catalog-header" id="catalog">
      <div>
        <p class="eyebrow">Project Catalog</p>
        <h2>Course-by-course production archive</h2>
      </div>
      <div class="course-jump" aria-label="Course shortcuts">
        ${courses.map((course) => `<a href="#${course.code}">${course.code}</a>`).join("")}
      </div>
    </section>

    ${courses.map(courseSection).join("")}
  `;
}

render();
