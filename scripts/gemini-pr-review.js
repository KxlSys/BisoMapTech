import fs from 'node:fs';

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
  
  Fournis une revue détaillée en français couvrant :
  1. **Failles de sécurité** (injections, XSS, exposition de données sensibles, secrets exposés, etc.)
  2. **Bugs potentiels** (erreurs logiques, cas limites non gérés, régressions possibles, etc.)
  3. **Qualité du code** (lisibilité, maintenabilité, respect du typage strict TypeScript, bonnes pratiques)
  
  Pour chaque point identifié, indique clairement la sévérité :
  🔴 Critique / 🟠 Haute / 🟡 Moyenne / 🟢 Faible
  
  Propose des suggestions concrètes de code de correction sous forme de blocs de code markdown (auto-correction).
  Si aucun problème n'est détecté, indique-le clairement avec un résumé positif.
  
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
