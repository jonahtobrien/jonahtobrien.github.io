// build.js: turns the files in this repository into a finished website in _site/
const fs = require("fs");

// Turn "2026-10-05" into "October 5, 2026"
function formatDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

// Split a post into its settings (above the --- line) and its body (below it)
function readPost(text) {
  const [header, ...rest] = text.split(/\r?\n---\r?\n/);
  const post = { body: rest.join("\n---\n") };
  for (const line of header.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    post[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return post;
}

// Swap every {{name}} in a template for the matching value
function fill(template, values) {
  return template.replace(/{{(\w+)}}/g, (match, name) => values[name] ?? "");
}

// 1. Start with an empty _site folder
fs.rmSync("_site", { recursive: true, force: true });
fs.mkdirSync("_site/posts", { recursive: true });

// 2. Copy the stylesheet across
fs.copyFileSync("style.css", "_site/style.css");

// 3. Build each post: read it, fill in the post template, save it
const postTemplate = fs.readFileSync("post.template.html", "utf8");
const posts = [];
for (const file of fs.readdirSync("posts")) {
  if (!file.endsWith(".html")) continue;
  const post = readPost(fs.readFileSync("posts/" + file, "utf8"));
  post.file = file;
  post.niceDate = formatDate(post.date);
  fs.writeFileSync("_site/posts/" + file, fill(postTemplate, post));
  posts.push(post);
}

// 4. Sort newest first
posts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

// 5. Turn each post into a list item
const list = posts
  .map(p => `<li><a href="/posts/${p.file}">${p.title}</a> <small>${p.niceDate}</small></li>`)
  .join("\n      ");

// 6. Fill in the homepage template and save it
const indexTemplate = fs.readFileSync("index.template.html", "utf8");
fs.writeFileSync("_site/index.html", fill(indexTemplate, { posts: list }));

console.log(`Built ${posts.length} post(s).`);
