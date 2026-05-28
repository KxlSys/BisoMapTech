const fs = require('fs');

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.ISSUE_NUMBER;
  const commentBody = process.env.COMMENT_BODY;
  const commentUser = process.env.COMMENT_USER;
  
  if (!geminiKey) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  
  console.log(`Processing comment by @${commentUser} on issue #${issueNumber} in ${repo}...`);
  
  const issueData = await fetchGitHub(`/repos/${repo}/issues/${issueNumber}`);
  const isPR = !!issueData.pull_request;
  
  let context = `Titre : ${issueData.title}\nDescription :\n${issueData.body}\n`;
  
  if (isPR) {
    console.log("This is a Pull Request. Fetching diff as context...");
    try {
      const diffData = await fetchGitHub(`/repos/${repo}/pulls/${issueNumber}`, {
        headers: { Accept: 'application/vnd.github.v3.diff' }
      }, 'text');
      context += `\nCe ticket est une Pull Request. Voici le diff de la PR :\n\`\`\`diff\n${diffData.substring(0, 50000)}\n\`\`\`\n`;
    } catch (e) {
      console.warn("Failed to fetch PR diff for context:", e.message);
    }
  }
  
  const cleanComment = commentBody.replace(/@(gemini|antigravity)/gi, '').trim();
  console.log(`Prompt text: "${cleanComment}"`);
  
  const prompt = `Tu es Antigravity, un assistant IA expert en développement Web pour le projet BisoMapTech (React, TypeScript, Supabase, TailwindCSS).
  L'utilisateur @${commentUser} t'a interpellé sur le ticket #${issueNumber} avec le message suivant :
  "${cleanComment}"
  
  Voici le contexte du ticket :
  ${context}
  
  Réponds-lui en français de manière claire, concise et professionnelle. Si l'utilisateur te demande d'analyser un problème, propose une explication et une suggestion de correction de code sous forme de blocs de code markdown.
  `;
  
  console.log("Calling Gemini API...");
  const geminiResponse = await callGemini(geminiKey, prompt);
  
  console.log("Posting response...");
  const replyBody = `@${commentUser} \n\n${geminiResponse}`;
  await fetchGitHub(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: replyBody })
  });
  
  console.log("Reply posted successfully!");
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
    'User-Agent': 'Gemini-Comment-Bot',
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
