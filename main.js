(() => {
  "use strict";

  const config = typeof CONFIG !== "undefined" ? CONFIG : {};

  if (config.title) {
    document.title = config.title;
    document.getElementById("site-title").textContent = config.title;
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  const list = document.getElementById("projects");
  const projects = Array.isArray(config.projects) ? config.projects : [];

  for (const project of projects) {
    if (!project || !project.name) continue;

    const item = document.createElement("li");

    const name = document.createElement("p");
    name.className = "project-name";
    if (project.link) {
      const link = document.createElement("a");
      link.href = project.link;
      link.textContent = project.name;
      name.appendChild(link);
    } else {
      name.textContent = project.name;
    }
    item.appendChild(name);

    if (project.desc) {
      const desc = document.createElement("p");
      desc.className = "project-desc";
      desc.textContent = project.desc;
      item.appendChild(desc);
    }

    list.appendChild(item);
  }

  if (!list.children.length) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "No experiments yet.";
    list.replaceWith(note);
  }
})();
