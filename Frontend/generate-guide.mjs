import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const IMG_DIR = './guide-screenshots';

// Load all screenshots as base64
const screenshots = {};
for (const file of readdirSync(IMG_DIR).sort()) {
  if (file.endsWith('.png')) {
    const key = file.replace('.png', '');
    const data = readFileSync(join(IMG_DIR, file));
    screenshots[key] = `data:image/png;base64,${data.toString('base64')}`;
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GameCenter Admin Panel — User Guide</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1B1830;
    line-height: 1.6;
    background: #fff;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
  }
  .cover {
    text-align: center;
    padding: 80px 20px 60px;
    border-bottom: 3px solid #7c3aed;
    margin-bottom: 40px;
  }
  .cover h1 {
    font-size: 36px;
    font-weight: 800;
    color: #7c3aed;
    margin-bottom: 8px;
  }
  .cover .subtitle {
    font-size: 18px;
    color: #6B6784;
    margin-bottom: 24px;
  }
  .cover .version {
    font-size: 13px;
    color: #6B6784;
    background: #f5f3ff;
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #7c3aed;
    margin: 40px 0 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #ede9fe;
  }
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1B1830;
    margin: 24px 0 8px;
  }
  p { margin: 8px 0; font-size: 14px; }
  .step {
    background: #f5f3ff;
    border-left: 4px solid #7c3aed;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    font-size: 14px;
  }
  .step strong { color: #7c3aed; }
  .note {
    background: #ecfeff;
    border-left: 4px solid #06b6d4;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    font-size: 13px;
  }
  .note strong { color: #0e7490; }
  .warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    font-size: 13px;
  }
  .warning strong { color: #92400e; }
  .screenshot {
    margin: 16px 0;
    text-align: center;
  }
  .screenshot img {
    max-width: 100%;
    border: 1px solid #EAE7F5;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .screenshot .caption {
    font-size: 12px;
    color: #6B6784;
    margin-top: 6px;
    font-style: italic;
  }
  code {
    background: #f5f3ff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: #7c3aed;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
  }
  pre {
    background: #1B1830;
    color: #c4b5fd;
    padding: 16px;
    border-radius: 8px;
    font-size: 12px;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    overflow-x: auto;
    margin: 12px 0;
    line-height: 1.5;
  }
  pre .comment { color: #6B6784; }
  pre .keyword { color: #22d3ee; }
  pre .string { color: #86efac; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }
  th, td {
    padding: 8px 12px;
    border: 1px solid #EAE7F5;
    text-align: left;
  }
  th {
    background: #f5f3ff;
    font-weight: 600;
    color: #7c3aed;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  ul, ol { margin: 8px 0 8px 20px; font-size: 14px; }
  li { margin: 4px 0; }
  .toc {
    background: #f7f6fc;
    border: 1px solid #EAE7F5;
    border-radius: 12px;
    padding: 20px 24px;
    margin: 20px 0;
  }
  .toc h3 { margin-top: 0; color: #7c3aed; }
  .toc ol { margin-left: 16px; }
  .toc li { margin: 6px 0; }
  .toc a { color: #7c3aed; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  .toc li::marker { color: #7c3aed; font-weight: 700; }
  .page-break { page-break-before: always; }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 12px 0;
  }
  .field-box {
    border: 1px solid #EAE7F5;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
  }
  .field-box .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; }
  .field-box .value { font-size: 14px; color: #1B1830; }
  footer {
    margin-top: 60px;
    padding-top: 16px;
    border-top: 1px solid #EAE7F5;
    font-size: 12px;
    color: #6B6784;
    text-align: center;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <h1>🎮 GameCenter Admin Panel</h1>
  <p class="subtitle">Complete User Guide — From Setup to Game Integration</p>
  <p class="version">Version 1.0 · August 2026</p>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
  <h3>📑 Table of Contents</h3>
  <ol>
    <li><a href="#overview">Overview — The Dashboard</a></li>
    <li><a href="#projects">Creating Your First Project</a></li>
    <li><a href="#questions">Adding Questions</a></li>
    <li><a href="#bulk-import">Bulk Import (CSV / DOCX)</a></li>
    <li><a href="#connect">Connecting Your Game</a></li>
    <li><a href="#admins">Managing Admin Accounts</a></li>
    <li><a href="#settings">Settings & Profile</a></li>
    <li><a href="#api">API Reference</a></li>
    <li><a href="#troubleshooting">Troubleshooting</a></li>
  </ol>
</div>

<!-- SECTION 1: OVERVIEW -->
<h2 id="overview">1. Overview — The Dashboard</h2>

<p>When you log in, you land on the <strong>Overview</strong> dashboard. This is your command center — it shows at a glance how many projects, questions, and admin accounts exist.</p>

<div class="screenshot">
  <img src="${screenshots['01-overview'] || ''}" alt="Overview Dashboard" />
  <div class="caption">The Overview dashboard showing stats, latest questions, and live endpoints</div>
</div>

<h3>What you see</h3>
<table>
  <tr><th>Section</th><th>Purpose</th></tr>
  <tr><td><strong>Stats Cards</strong></td><td>Total projects, questions across all banks, and admin accounts</td></tr>
  <tr><td><strong>Latest Questions</strong></td><td>Most recently added questions from any project</td></tr>
  <tr><td><strong>Live Endpoints</strong></td><td>The API base URL and each project's session endpoint</td></tr>
</table>

<div class="note">
  <strong>💡 Tip:</strong> The "Live Endpoints" section shows the exact URL your game needs to call. You can copy it from here or from the project's "Connect a game" sheet.
</div>

<!-- SECTION 2: PROJECTS -->
<h2 id="projects" class="page-break">2. Creating Your First Project</h2>

<p>A <strong>project</strong> represents one game. Each project defines three customizable fields (labels), how many questions to serve per session, and which field is the main question prompt.</p>

<div class="screenshot">
  <img src="${screenshots['02-projects-list'] || ''}" alt="Projects List" />
  <div class="caption">The Projects page — click "Add project" to create a new one</div>
</div>

<h3>Step-by-step: Create a project</h3>

<div class="step">
  <strong>Step 1:</strong> Click the <strong>"+ Add project"</strong> button in the top-right corner.
</div>

<div class="screenshot">
  <img src="${screenshots['03-add-project-modal'] || ''}" alt="Add Project Modal" />
  <div class="caption">The Add Project form — fill in your game's details</div>
</div>

<div class="step">
  <strong>Step 2:</strong> Fill in the form fields:
</div>

<div class="two-col">
  <div class="field-box">
    <div class="label">Project Name</div>
    <div class="value">Name it after your game. The <strong>slug</strong> (used in the API URL) is auto-generated from this name.</div>
  </div>
  <div class="field-box">
    <div class="label">Field 1 / 2 / 3 Labels</div>
    <div class="value">Label the three fields your questions use. For a quiz game: "Question", "Correct Answer", "Wrong Answer".</div>
  </div>
  <div class="field-box">
    <div class="label">Questions Per Session</div>
    <div class="value">How many questions the endpoint returns on each call. Chosen at random from your bank.</div>
  </div>
  <div class="field-box">
    <div class="label">Main Question Field</div>
    <div class="value">Which field the game shows as the prompt. Sent as <code>mainQuestionField</code> in the API response.</div>
  </div>
</div>

<div class="step">
  <strong>Step 3:</strong> Click <strong>"Create project"</strong>. You'll see a success toast and the project appears in the list.
</div>

<div class="note">
  <strong>💡 Example:</strong> For a cricket quiz, you might set:
  <ul>
    <li>Project Name: <code>Cricket Quiz</code> → slug becomes <code>cricket-quiz</code></li>
    <li>Field 1: "Question" · Field 2: "Option A" · Field 3: "Option B"</li>
    <li>Questions per session: 15</li>
    <li>Main question field: Field 1 (Question)</li>
  </ul>
</div>

<!-- SECTION 3: QUESTIONS -->
<h2 id="questions" class="page-break">3. Adding Questions</h2>

<p>After creating a project, click the <strong>Questions</strong> icon (📋) in the project row to open its question bank.</p>

<div class="screenshot">
  <img src="${screenshots['04-questions-empty'] || ''}" alt="Empty Questions Bank" />
  <div class="caption">An empty question bank — click "Add the first question" to start</div>
</div>

<h3>Adding a single question</h3>

<div class="step">
  <strong>Step 1:</strong> Click <strong>"+ Add question"</strong> (or "Add the first question" if the bank is empty).
</div>

<div class="screenshot">
  <img src="${screenshots['05-add-question-modal'] || ''}" alt="Add Question Modal" />
  <div class="caption">The Add Question form — field labels match your project's configuration</div>
</div>

<div class="step">
  <strong>Step 2:</strong> Fill in each field. Only the first field (marked "REQUIRED") is mandatory.
</div>

<div class="step">
  <strong>Step 3:</strong> Click <strong>"Add question"</strong>. A success toast confirms it was saved.
</div>

<p>The question now appears in the table. You can <strong>edit</strong> (✏️) or <strong>delete</strong> (🗑️) it using the action buttons on the right.</p>

<!-- SECTION 4: BULK IMPORT -->
<h2 id="bulk-import" class="page-break">4. Bulk Import (CSV / DOCX)</h2>

<p>Instead of adding questions one by one, you can import them in bulk from a <strong>CSV</strong> or <strong>DOCX</strong> file.</p>

<h3>How to import</h3>

<div class="step">
  <strong>Step 1:</strong> Open the project's question bank and click <strong>"Import"</strong>.
</div>

<div class="step">
  <strong>Step 2:</strong> Select a <code>.csv</code> or <code>.docx</code> file from your computer.
</div>

<div class="step">
  <strong>Step 3 (CSV only):</strong> A preview appears showing the detected columns. Use the <strong>column mapping</strong> dropdowns to assign each CSV column to the correct field (Field 1, 2, or 3).
</div>

<div class="step">
  <strong>Step 4:</strong> Click <strong>"Import"</strong>. The server parses the file, inserts valid rows, and skips empty ones. You'll see a count of how many were imported.
</div>

<h3>CSV format</h3>
<table>
  <tr><th>Example CSV content</th><th>Result</th></tr>
  <tr><td><code>Who won 2023 WC?,India,Australia</code></td><td>One question with Question=Who won 2023 WC?, Option A=India, Option B=Australia</td></tr>
  <tr><td>If the first row contains headers like "Question,Option A,Option B", they are automatically detected and skipped.</td><td></td></tr>
</table>

<div class="warning">
  <strong>⚠️ Important:</strong> DOCX files cannot be previewed in the browser. The server parses them directly. TSV (tab-separated) and "Word - Definition" formats are supported.
</div>

<!-- SECTION 5: CONNECT GAME -->
<h2 id="connect" class="page-break">5. Connecting Your Game</h2>

<p>Every project gets a <strong>public session endpoint</strong> — a URL your game calls to receive a fresh, randomized set of questions. No API key or token is needed.</p>

<div class="screenshot">
  <img src="${screenshots['08-connect-game'] || ''}" alt="Connect Game Modal" />
  <div class="caption">The Connect Game sheet — slug, endpoint URL, test button, and ready-to-paste code</div>
</div>

<h3>What the Connect Game sheet shows</h3>

<table>
  <tr><th>Section</th><th>What it is</th></tr>
  <tr><td><strong>Slug</strong></td><td>The unique identifier for your project (e.g., <code>cricket-new</code>). This is the only value your game needs to know.</td></tr>
  <tr><td><strong>Session Endpoint</strong></td><td>The full URL your game fetches from. Click "Copy URL" to copy it.</td></tr>
  <tr><td><strong>Test Connection</strong></td><td>Click to verify the endpoint is reachable and see how many questions it returns.</td></tr>
  <tr><td><strong>Code Snippet</strong></td><td>Copy-paste ready JavaScript code that fetches and maps the questions for your game.</td></tr>
</table>

<h3>How to use the endpoint in your game</h3>

<p>Call this URL from your game's code:</p>

<pre><span class="comment">// Replace with your actual API URL and slug</span>
<span class="keyword">const</span> response = <span class="keyword">await</span> fetch(<span class="string">'http://localhost:5000/api/public/projects/cricket-new/session'</span>);
<span class="keyword">const</span> data = <span class="keyword">await</span> response.json();

<span class="comment">// data.questions = array of question objects</span>
<span class="comment">// data.fieldLabels = { field1: "Question", field2: "Option A", ... }</span>
<span class="comment">// data.mainQuestionField = "field1"</span></pre>

<h3>Response format</h3>

<pre>{
  <span class="string">"project"</span>: { <span class="string">"name"</span>: <span class="string">"Cricket new"</span>, <span class="string">"slug"</span>: <span class="string">"cricket-new"</span> },
  <span class="string">"fieldLabels"</span>: { <span class="string">"field1"</span>: <span class="string">"question"</span>, <span class="string">"field2"</span>: <span class="string">"option A"</span>, <span class="string">"field3"</span>: <span class="string">"option B"</span> },
  <span class="string">"mainQuestionField"</span>: <span class="string">"field1"</span>,
  <span class="string">"questions"</span>: [
    { <span class="string">"field1"</span>: <span class="string">"Who won the 2023 Cricket World Cup?"</span>, <span class="string">"field2"</span>: <span class="string">"India"</span>, <span class="string">"field3"</span>: <span class="string">"Australia"</span> }
  ]
}</pre>

<div class="warning">
  <strong>⚠️ Deployed games:</strong> If your game is hosted on Vercel/Netlify, the API must also be deployed (not just localhost). Add the game's origin to <code>ALLOWED_GAME_ORIGINS</code> in the backend <code>.env</code>, then restart the API.
</div>

<!-- SECTION 6: ADMINS -->
<h2 id="admins" class="page-break">6. Managing Admin Accounts</h2>

<p>Only <strong>super admins</strong> can access the Admins page. Sub admins manage projects and questions only.</p>

<div class="screenshot">
  <img src="${screenshots['09-admins'] || ''}" alt="Admins Page" />
  <div class="caption">The Admins page — manage team access to the panel</div>
</div>

<h3>Roles</h3>
<table>
  <tr><th>Role</th><th>Can do</th><th>Cannot do</th></tr>
  <tr><td><strong>Super Admin</strong></td><td>Full access — manage admins, projects, questions, settings</td><td>—</td></tr>
  <tr><td><strong>Sub Admin</strong></td><td>Manage projects and questions, update own profile</td><td>Add/remove other admins</td></tr>
</table>

<h3>Add a new admin</h3>

<div class="step">
  <strong>Step 1:</strong> Click <strong>"+ Add admin"</strong>.
</div>
<div class="step">
  <strong>Step 2:</strong> Enter their name, email, and a password (at least 6 characters).
</div>
<div class="step">
  <strong>Step 3:</strong> Choose their role (Sub admin or Super admin).
</div>
<div class="step">
  <strong>Step 4:</strong> Click <strong>"Create admin"</strong>. They can sign in immediately.
</div>

<div class="note">
  <strong>💡 Note:</strong> You cannot delete your own account. The delete button is disabled for the currently logged-in admin.
</div>

<!-- SECTION 7: SETTINGS -->
<h2 id="settings" class="page-break">7. Settings & Profile</h2>

<div class="screenshot">
  <img src="${screenshots['10-settings'] || ''}" alt="Settings Page" />
  <div class="caption">Settings — profile, password, and game integration info</div>
</div>

<h3>Profile</h3>
<p>Update your name and email. Click <strong>"Save profile"</strong> to apply changes.</p>

<h3>Password</h3>
<p>To change your password, enter your <strong>current password</strong> first, then the new password twice. Click <strong>"Change password"</strong>.</p>

<h3>Game Integration</h3>
<p>Shows the API base URL your games point at. Copy it with one click. For deployed games, add their origin to <code>ALLOWED_GAME_ORIGINS</code> in the backend <code>.env</code>.</p>

<h3>Sign Out</h3>
<p>Click <strong>"Sign out"</strong> to end your session and return to the login screen.</p>

<!-- SECTION 8: API -->
<h2 id="api" class="page-break">8. API Reference</h2>

<table>
  <tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Auth</th></tr>
  <tr><td>POST</td><td><code>/api/auth/login</code></td><td>Login, returns JWT + admin</td><td>Public</td></tr>
  <tr><td>GET</td><td><code>/api/auth/me</code></td><td>Current admin profile</td><td>JWT</td></tr>
  <tr><td>PUT</td><td><code>/api/auth/me</code></td><td>Update own profile</td><td>JWT</td></tr>
  <tr><td>GET</td><td><code>/api/admins</code></td><td>List all admins</td><td>Super Admin</td></tr>
  <tr><td>POST</td><td><code>/api/admins</code></td><td>Create admin</td><td>Super Admin</td></tr>
  <tr><td>PUT</td><td><code>/api/admins/:id</code></td><td>Update admin</td><td>Super Admin</td></tr>
  <tr><td>DELETE</td><td><code>/api/admins/:id</code></td><td>Delete admin</td><td>Super Admin</td></tr>
  <tr><td>GET</td><td><code>/api/projects</code></td><td>List projects (paginated)</td><td>JWT</td></tr>
  <tr><td>POST</td><td><code>/api/projects</code></td><td>Create project</td><td>JWT</td></tr>
  <tr><td>GET</td><td><code>/api/projects/:id</code></td><td>Get single project</td><td>JWT</td></tr>
  <tr><td>PUT</td><td><code>/api/projects/:id</code></td><td>Update project</td><td>JWT</td></tr>
  <tr><td>DELETE</td><td><code>/api/projects/:id</code></td><td>Delete project + questions</td><td>JWT</td></tr>
  <tr><td>GET</td><td><code>/api/projects/:id/questions</code></td><td>List questions (paginated)</td><td>JWT</td></tr>
  <tr><td>POST</td><td><code>/api/projects/:id/questions</code></td><td>Add single question</td><td>JWT</td></tr>
  <tr><td>POST</td><td><code>/api/projects/:id/questions/upload</code></td><td>Bulk CSV/DOCX upload</td><td>JWT</td></tr>
  <tr><td>PUT</td><td><code>/api/questions/:id</code></td><td>Update question</td><td>JWT</td></tr>
  <tr><td>DELETE</td><td><code>/api/questions/:id</code></td><td>Delete question</td><td>JWT</td></tr>
  <tr><td>GET</td><td><code>/api/public/projects/:slug/session</code></td><td>Public quiz session</td><td>None</td></tr>
</table>

<!-- SECTION 9: TROUBLESHOOTING -->
<h2 id="troubleshooting" class="page-break">9. Troubleshooting</h2>

<table>
  <tr><th>Problem</th><th>Solution</th></tr>
  <tr><td>"Can't reach the API" on login</td><td>Make sure the backend is running on port 5000. Run <code>cd Backend && npm run dev</code>.</td></tr>
  <tr><td>Game gets 401 from the session endpoint</td><td>Add your game's origin to <code>ALLOWED_GAME_ORIGINS</code> in the backend <code>.env</code> and restart.</td></tr>
  <tr><td>Game gets 404 from the session endpoint</td><td>Check the slug. Renaming a project changes its slug — update the game's URL too.</td></tr>
  <tr><td>Questions don't appear in the game</td><td>Make sure questions have been added to the project. The endpoint returns an empty array if the bank is empty.</td></tr>
  <tr><td>CSV import fails</td><td>Check the file encoding (UTF-8 recommended). Make sure field1 is not empty in any row.</td></tr>
  <tr><td>"Setup already completed" error</td><td>Admins already exist. Use the login form instead, or run <code>npm run seed</code> to create the default admin.</td></tr>
</table>

<footer>
  <p>GameCenter Admin Panel — User Guide v1.0</p>
  <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</footer>

</body>
</html>`;

// Write the HTML file
import { writeFileSync } from 'fs';
writeFileSync('guide-screenshots/GameCenter-User-Guide.html', html);
console.log('Guide generated: guide-screenshots/GameCenter-User-Guide.html');
console.log(`File size: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
