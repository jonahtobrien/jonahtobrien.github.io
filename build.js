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

// Markdown, part 1: formatting inside a line (**bold**, *italic*, [links](url))
function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

// Markdown, part 2: blocks separated by blank lines (paragraphs, headings, lists)
function markdown(text) {
  const blocks = text.trim().split(/\r?\n\s*\r?\n/);
  return blocks.map(block => {
    const lines = block.split(/\r?\n/);

    // Heading: # becomes h2, ## becomes h3 (the post title is already the h1)
    const heading = block.match(/^(#{1,3}) (.+)$/);
    if (heading && lines.length === 1) {
      const level = heading[1].length + 1;
      return `<h${level}>${inline(heading[2])}</h${level}>`;
    }

    // Bulleted list: every line starts with "- "
    if (lines.every(line => line.startsWith("- "))) {
      const items = lines.map(line => `  <li>${inline(line.slice(2))}</li>`);
      return "<ul>\n" + items.join("\n") + "\n</ul>";
    }

    // Numbered list: every line starts with a number and a period
    if (lines.every(line => /^\d+\. /.test(line))) {
      const items = lines.map(line => `  <li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
      return "<ol>\n" + items.join("\n") + "\n</ol>";
    }

    // Raw HTML passes straight through
    if (block.trim().startsWith("<")) return block;

    // Anything else is a paragraph
    return `<p>${inline(lines.join(" "))}</p>`;
  }).join("\n");
}

// 1. Start with an empty _site folder
fs.rmSync("_site", { recursive: true, force: true });
fs.mkdirSync("_site/posts", { recursive: true });

// 2. Copy the stylesheet across
fs.copyFileSync("style.css", "_site/style.css");

// 3. Build each post: read it, convert Markdown if needed, fill in the template, save it
const postTemplate = fs.readFileSync("post.template.html", "utf8");
const posts = [];
for (const file of fs.readdirSync("posts")) {
  const isMarkdown = file.endsWith(".md");
  if (!isMarkdown && !file.endsWith(".html")) continue;
  const post = readPost(fs.readFileSync("posts/" + file, "utf8"));
  if (isMarkdown) post.body = markdown(post.body);
  post.file = file.replace(/\.md$/, ".html");
  post.niceDate = formatDate(post.date);
  fs.writeFileSync("_site/posts/" + post.file, fill(postTemplate, post));
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
