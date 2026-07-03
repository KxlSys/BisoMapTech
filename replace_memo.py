import re

with open('src/pages/matching-page.tsx', 'r') as f:
    content = f.read()

# Replace TalentCard
content = re.sub(
    r'function TalentCard\(\{ match, isLoggedIn \}: \{ match: MatchResult; isLoggedIn: boolean \}\) \{',
    r'const TalentCard = React.memo(function TalentCard({ match, isLoggedIn }: { match: MatchResult; isLoggedIn: boolean }) {',
    content
)
content = re.sub(
    r'    </div>\n  \);\n\}\n\n// ─── Tab: Projets',
    r'    </div>\n  );\n});\n\n// ─── Tab: Projets',
    content
)

# Replace ProjectCard
content = re.sub(
    r'function ProjectCard\(\{\n  project,\n  score,\n  reasons,\n  isLoggedIn,\n  isInterested,\n  onInterest,\n\}: \{\n  project: Project;\n  score\?: number;\n  reasons\?: string\[\];\n  isLoggedIn: boolean;\n  isInterested: boolean;\n  onInterest: \(\) => void;\n\}\) \{',
    r'const ProjectCard = React.memo(function ProjectCard({\n  project,\n  score,\n  reasons,\n  isLoggedIn,\n  isInterested,\n  onInterest,\n}: {\n  project: Project;\n  score?: number;\n  reasons?: string[];\n  isLoggedIn: boolean;\n  isInterested: boolean;\n  onInterest: () => void;\n}) {',
    content
)

content = re.sub(
    r'    </div>\n  \);\n\}\n\n// ─── Tab: Connexions',
    r'    </div>\n  );\n});\n\n// ─── Tab: Connexions',
    content
)

# Replace ConnectionRow
content = re.sub(
    r'function ConnectionRow\(\{\n  partner,\n  conn,\n  mode,\n\}: \{\n  partner: \{ id: string; username: string; full_name: string; avatar_url: string \};\n  userId: string;\n  conn: ConnectionWithProfiles;\n  mode: "incoming" \| "connected";\n\}\) \{',
    r'const ConnectionRow = React.memo(function ConnectionRow({\n  partner,\n  conn,\n  mode,\n}: {\n  partner: { id: string; username: string; full_name: string; avatar_url: string };\n  userId: string;\n  conn: ConnectionWithProfiles;\n  mode: "incoming" | "connected";\n}) {',
    content
)

content = re.sub(
    r'    </div>\n  \);\n\}\n$',
    r'    </div>\n  );\n});\n',
    content
)


with open('src/pages/matching-page.tsx', 'w') as f:
    f.write(content)
