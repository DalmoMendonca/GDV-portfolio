import "./styles.css";
import { allProjects, courses } from "./data/projects.js";

const app = document.querySelector("#app");
const state = {
  course: "all",
  status: "implemented",
  query: "",
};

const implemented = allProjects.filter((project) => project.status === "implemented");
const gdv501 = courses.find((course) => course.code === "GDV501");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function liveUrl(project) {
  return project.netlifyUrl || project.gameUrl || "";
}

function statusLabel(project) {
  return project.status === "implemented" ? "Playable" : "Scaffolded";
}

function matchesFilters(project) {
  const query = state.query.trim().toLowerCase();
  const matchesCourse = state.course === "all" || project.courseCode === state.course;
  const matchesStatus = state.status === "all" || project.status === state.status;
  const text = [
    project.id,
    project.title,
    project.repoName,
    project.courseTitle,
    project.genericDescription,
    project.specificDescription,
  ].join(" ").toLowerCase();

  return matchesCourse && matchesStatus && (!query || text.includes(query));
}

function actionLinks(project) {
  const game = liveUrl(project)
    ? `<a class="button primary" href="${liveUrl(project)}" target="_blank" rel="noreferrer">Play Game</a>`
    : `<span class="button disabled" aria-disabled="true">Build Pending</span>`;
  const source = project.githubUrl
    ? `<a class="button" href="${project.githubUrl}" target="_blank" rel="noreferrer">View Source</a>`
    : `<span class="button disabled" aria-disabled="true">Source Pending</span>`;
  return `${game}${source}`;
}

function featuredCard(project, index) {
  return `
    <article class="featured-card">
      <div class="featured-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <p class="eyebrow">${project.id} / ${statusLabel(project)}</p>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.specificDescription)}</p>
      </div>
      <div class="card-actions">${actionLinks(project)}</div>
    </article>
  `;
}

function projectCard(project) {
  return `
    <article class="project-card" data-status="${project.status}">
      <div class="project-meta">
        <span>${project.id}</span>
        <span class="status ${project.status}">${statusLabel(project)}</span>
      </div>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="objective">${escapeHtml(project.genericDescription)}</p>
      <p>${escapeHtml(project.specificDescription)}</p>
      <dl>
        <div>
          <dt>Course</dt>
          <dd>${project.courseCode}</dd>
        </div>
        <div>
          <dt>Repository</dt>
          <dd>${escapeHtml(project.repoName)}</dd>
        </div>
      </dl>
      <div class="card-actions">${actionLinks(project)}</div>
    </article>
  `;
}

function courseOptions() {
  return courses
    .map((course) => `<option value="${course.code}">${course.displayCode} - ${escapeHtml(course.title)}</option>`)
    .join("");
}

function renderCatalog(projects) {
  if (!projects.length) {
    return `
      <div class="empty-state">
        <h3>No matching projects</h3>
        <p>Clear the search or broaden the status/course filters.</p>
      </div>
    `;
  }

  return `
    <div class="catalog-grid">
      ${projects.map(projectCard).join("")}
    </div>
  `;
}

function render() {
  const visible = allProjects.filter(matchesFilters);
  const featured = gdv501.projects.filter((project) => project.status === "implemented");
  const totalCourses = courses.length;
  const scaffolded = allProjects.length - implemented.length;

  app.innerHTML = `
    <header class="site-header" id="top">
      <a class="brand" href="#top" aria-label="GDV portfolio home">
        <span class="brand-mark">GDV</span>
        <span>Playable Master's Arcade</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#featured">Playable Now</a>
        <a href="#catalog">Catalog</a>
        <a href="#standards">Standards</a>
        <a href="./curriculum.md">Curriculum</a>
      </nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Master of Video Game Design and Development</p>
          <h1 id="hero-title">A public portfolio of 120 playable design studies.</h1>
          <p>
            This site is built for graders, recruiters, collaborators, and future students:
            playable builds first, source links second, and every project framed by the
            competency it proves.
          </p>
          <div class="hero-actions">
            <a class="button primary" href="#featured">Play GDV501</a>
            <a class="button" href="#catalog">Browse All Projects</a>
          </div>
        </div>

        <div class="hero-panel" aria-label="Portfolio summary">
          <div>
            <strong>${allProjects.length}</strong>
            <span>Total games</span>
          </div>
          <div>
            <strong>${implemented.length}</strong>
            <span>Playable now</span>
          </div>
          <div>
            <strong>${totalCourses}</strong>
            <span>Courses</span>
          </div>
          <div>
            <strong>${scaffolded}</strong>
            <span>Ready slots</span>
          </div>
        </div>
      </section>

      <section class="section-band" id="featured">
        <div class="section-heading">
          <p class="eyebrow">GDV501 First Principles Arcade</p>
          <h2>Ten complete exemplars for the first course.</h2>
          <p>
            These games model the baseline standard for future student work: finished loops,
            public deployment, clean source, deterministic test hooks, and concise design framing.
          </p>
        </div>
        <div class="featured-grid">
          ${featured.map(featuredCard).join("")}
        </div>
      </section>

      <section class="section-band pale" id="catalog">
        <div class="section-heading compact">
          <p class="eyebrow">Project Catalog</p>
          <h2>Find a competency, course, or playable build.</h2>
        </div>

        <form class="filters" aria-label="Catalog filters">
          <label>
            Search
            <input id="query" type="search" value="${escapeHtml(state.query)}" placeholder="mechanic, course, title, repository..." />
          </label>
          <label>
            Course
            <select id="course">
              <option value="all">All courses</option>
              ${courseOptions()}
            </select>
          </label>
          <label>
            Status
            <select id="status">
              <option value="implemented">Playable now</option>
              <option value="placeholder">Scaffolded</option>
              <option value="all">All projects</option>
            </select>
          </label>
          <output>${visible.length} projects shown</output>
        </form>

        ${renderCatalog(visible)}
      </section>

      <section class="standards" id="standards">
        <div>
          <p class="eyebrow">Portfolio Standard</p>
          <h2>Every project has to be inspectable, playable, and defensible.</h2>
        </div>
        <ul>
          <li>Playable public build with clear start, fail, success, and restart states.</li>
          <li>GitHub source repository with build instructions and project metadata.</li>
          <li>Generic curriculum objective plus project-specific execution brief.</li>
          <li>Accessibility basics, deterministic test hooks, and a scoped postmortem path.</li>
        </ul>
      </section>
    </main>
  `;

  document.querySelector("#course").value = state.course;
  document.querySelector("#status").value = state.status;
}

app.addEventListener("input", (event) => {
  if (event.target.id === "query") {
    state.query = event.target.value;
    render();
    document.querySelector("#query").focus();
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "course") {
    state.course = event.target.value;
    render();
  }

  if (event.target.id === "status") {
    state.status = event.target.value;
    render();
  }
});

render();
