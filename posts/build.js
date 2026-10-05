js
// build.js: turns the files in this repository into a finished website in _site/
const fs = require("fs");

// 1. Start with an empty _site folder
fs.rmSync("_site", { recursive: true, force: true });
fs.mkdirSync("_site/posts", { recursive: true });

// 2. Copy the stylesheet across
fs.copyFileSync("style.css", "_site/style.css");

// 3. Read every post, pull out its title and date, and copy it across
const posts = [];
for (const file of fs.readdirSync("posts")) {
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync("posts/" + file, "utf8");
  const title = html.match(/<h1>(.*?)<\/h1>/)?.[1] ?? file;
  const date = html.match(/<meta name="date" content="(.*?)">/)?.[1] ?? "";
  posts.push({ file, title, date });
  fs.copyFileSync("posts/" + file, "_site/posts/" + file);
}

// 4. Sort newest first
posts.sort((a, b) => b.date.localeCompare(a.date));

// 5. Turn each post into a list item
const list = posts
  .map(p => `<li><a href="/posts/${p.file}">${p.title}</a> <small>${p.date}</small></li>`)
  .join("\n      ");

// 6. Put the list into the homepage template and save it
const template = fs.readFileSync("index.template.html", "utf8");
fs.writeFileSync("_site/index.html", template.replace("<!-- POSTS -->", list));

console.log(`Built ${posts.length} post(s).`);
