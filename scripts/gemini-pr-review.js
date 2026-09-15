import fs from 'fs';

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  
  if (!geminiKey) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  
  console.log(`Fetching diff for PR #${prNumber} in ${repo}...`);
  const diffData = await fetchGitHub(`/repos/${repo}/pulls/${prNumber}`, {
    headers: { Accept: 'application/vnd.github.v3.diff' }
  }, 'text');
  
  if (!diffData || diffData.trim().length === 0) {
    console.log("No diff found or PR is empty.");
    return;
  }
  
  const maxDiffLength = 200000;
  let truncatedDiff = diffData;
  if (diffData.length > maxDiffLength) {
    truncatedDiff = diffData.substring(0, maxDiffLength) + "\n\n[Diff truncated due to size limit...]";
  }
  
  console.log("Calling Gemini API for review...");
  const prompt = `Analyse ce diff de Pull Request en tant qu'expert en sécurité et qualité de code pour le projet BisoMapTech (React, TypeScript, Supabase, TailwindCSS).

  RÈGLES IMPÉRATIVES — tu ne reçois QUE le diff, jamais les fichiers complets :
  - Ne cite que des chemins de fichiers qui apparaissent littéralement dans les
    en-têtes du diff. N'invente jamais un nom de fichier, de composant, de hook
    ou de variable qui n'y figure pas.
  - Ne propose aucune correction dans un fichier absent du diff.
  - Si l'analyse d'un point demande du contexte hors diff, dis-le explicitement
    ("non vérifiable depuis le diff") plutôt que de supposer le contenu.
  - Rattache chaque constat à un chemin de fichier et, si possible, à une ligne
    visible dans le diff.
  - Ne signale pas comme "ajouté par cette PR" ce que le diff ne montre pas en
    ligne ajoutée (préfixe +).

  Contraintes du projet, à respecter dans tes suggestions :
  - Les utilisateurs sont au Congo-Brazzaville, sur réseau lent et téléphones
    d'entrée de gamme. Ne suggère une nouvelle dépendance que si le gain
    justifie le poids ajouté au bundle, et dis-le explicitement.
  - Le rendu JSX de React échappe déjà le texte : ne réclame une désinfection
    HTML que pour du HTML réellement construit à la main.

  Fournis une revue en français couvrant :
  1. **Failles de sécurité** (injections, XSS, exposition de données sensibles, secrets exposés)
  2. **Bugs potentiels** (erreurs logiques, cas limites non gérés, régressions)
  3. **Qualité du code** (lisibilité, maintenabilité, typage strict TypeScript)

  Pour chaque point, indique la sévérité :
  🔴 Critique / 🟠 Haute / 🟡 Moyenne / 🟢 Faible

  Sois concis : au plus 8 constats, du plus grave au plus léger. Pas de section
  de félicitations, pas de récapitulatif de ce que fait la PR. Propose des
  corrections sous forme de blocs de code. Si tu ne trouves rien de sérieux,
  dis-le en deux lignes.

  Voici le diff de la Pull Request :
  \`\`\`diff
  ${truncatedDiff}
  \`\`\`
  `;

  const geminiResponse = await callGemini(geminiKey, prompt);
  
  console.log("Posting review comment to PR...");
  await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: geminiResponse })
  });
  
  console.log("Review posted successfully!");
}

async function callGemini(key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  console.error("Gemini API Error details:", JSON.stringify(data));
  throw new Error("Failed to get response from Gemini API");
}

async function fetchGitHub(path, options = {}, responseType = 'json') {
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Gemini-PR-Reviewer',
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub API error on ${path}: ${response.status} - ${errText}`);
  }
  return responseType === 'json' ? response.json() : response.text();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
