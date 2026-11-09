// Kursus Git: dominan latihan di terminal sandbox (commit, branch, pull request).
export default {
  slug: 'git',
  title: 'Git & GitHub Essentials',
  category: 'technology',
  type: 'Practice',
  level: 'Beginner',
  rating: 4.8,
  author: 'Andi Saputra',
  description: 'Commits, branches and pull requests, practiced in a sandbox repository.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'What are Git and GitHub?',
      type: 'Video',
      minutes: 8,
      videoId: 'y-an0v208A0',
      videoStart: 0,
      contentMd: `- Git tracks changes on your own computer; GitHub hosts repositories online so you can back them up and work with others.
- Note the commands from the video: \`git init\`, \`git add\`, \`git commit\`, \`git branch\`, \`git merge\`, \`git push\` and \`git pull\`. You will type most of them in the practices.`,
    },
    {
      title: 'Commits: stage, save, repeat',
      type: 'Article',
      minutes: 8,
      contentMd: `A commit is a snapshot of your project at one moment, with a message explaining what changed and why. Git keeps the full chain of commits, so you can look back, compare versions or undo mistakes.

## Three places your files live

1. **Working directory**: the files you edit.
2. **Staging area**: the changes you have selected for the next commit.
3. **Repository**: the saved history of commits, stored in the hidden \`.git\` folder.

\`git add\` moves changes from the working directory to the staging area; \`git commit\` saves everything staged as a new commit.

## The everyday loop

\`\`\`bash
git status                      # what changed?
git add index.html style.css    # stage specific files
git commit -m "Add hero section to home page"
git log --oneline               # see the history
\`\`\`

\`git status\` is your best friend: run it before and after every command until the workflow feels natural. Use \`git diff\` to see the exact lines you changed, and \`git diff --staged\` for the lines you are about to commit.

## Writing good commit messages

A good message completes the sentence "If applied, this commit will…":

- \`Add login form validation\`
- \`Fix crash when the course list is empty\`
- \`Update README with setup steps\`

Avoid messages like \`update\`, \`fix\` or \`asdf\`. In three months nobody, including you, will know what they mean.

## Small, focused commits

Commit one logical change at a time. A commit that fixes a bug, renames ten files and adds a feature is hard to review and impossible to undo cleanly. If you edited two unrelated things, stage and commit them separately.

## Ignore what does not belong

Create a \`.gitignore\` file for things Git should never track: dependencies, build output and, above all, secrets.

\`\`\`text
node_modules/
dist/
.env
\`\`\`

Once a password or API key is committed and pushed, assume it is leaked and change it, even if you delete the file later.

> **Tip:** forgot a file in your last commit? Stage it and run \`git commit --amend --no-edit\`, but only if you have not pushed that commit yet.`,
    },
    {
      title: 'Practice: Your first commits',
      type: 'Practice',
      minutes: 20,
      contentMd: 'Your sandbox folder `my-notes` contains a single `README.md`. Write the commands, one per line, that put it under version control and make your first commit.',
      practice: {
        fileName: 'terminal.sh',
        language: 'bash',
        starterCode: `# Sandbox repo: my-notes (contains README.md)
# Write one command per line.

# 1. Turn this folder into a Git repository

# 2. See which files Git has noticed

# 3. Stage README.md and commit it with a clear message

# 4. Show the history, one line per commit
`,
        tasks: [
          'Initialise the repository with git init',
          'Check what Git sees with git status',
          'Stage README.md and commit it with a clear message',
          'Show the history with git log --oneline',
        ],
        hint: 'Run git status after every step to see what changed. A good message says what the commit does, for example "Add README with course notes".',
        checks: [
          { label: 'Initialises a repository', pattern: '^\\s*git\\s+init\\b', flags: 'm' },
          { label: 'Checks the status', pattern: '^\\s*git\\s+status\\b', flags: 'm' },
          { label: 'Stages README.md', pattern: '^\\s*git\\s+add\\s+(README\\.md|\\.|-A)', flags: 'm' },
          { label: 'Commits with a message', pattern: '^\\s*git\\s+commit\\s+-a?m\\s+["\\x27][^"\\x27\\n]{5,}["\\x27]', flags: 'm' },
          { label: 'Shows the history', pattern: '^\\s*git\\s+log\\b', flags: 'm' },
        ],
      },
    },
    {
      title: 'Branches & merging',
      type: 'Video',
      minutes: 34,
      videoId: 'e2IbNHi4uCI',
      videoStart: 0,
      contentMd: `- A branch is a movable pointer to a commit, and HEAD marks the branch you are on.
- Focus on creating, switching, publishing, merging and deleting branches. The rebasing chapter (26:52) is optional for now.
- \`git switch\` and \`git checkout\` both change branches; this course uses \`git switch\`.`,
    },
    {
      title: 'Quiz: Git basics',
      type: 'Quiz',
      questions: [
        {
          text: 'Which command stages changes for the next commit?',
          options: ['git commit', 'git add', 'git push', 'git status'],
          correctIndex: 1,
          explanation: 'git add moves changes into the staging area. git commit then saves what is staged.',
          mono: true,
        },
        {
          text: 'What does git commit -m "Fix typo" do?',
          options: ['Uploads your changes to GitHub', 'Creates a new branch called Fix typo', 'Saves a snapshot of the staged changes in your local repository', 'Deletes unstaged files'],
          correctIndex: 2,
          explanation: 'A commit is local. Nothing reaches GitHub until you run git push.',
          mono: false,
        },
        {
          text: 'Which command creates a new branch and switches to it?',
          options: ['git branch -d feature', 'git merge feature', 'git push feature', 'git switch -c feature'],
          correctIndex: 3,
          explanation: 'switch -c creates and checks out the branch in one step (the older form is git checkout -b). branch -d deletes a branch.',
          mono: true,
        },
        {
          text: 'What is a pull request?',
          options: ['A request to merge one branch into another, with a place for review and discussion', 'A command that downloads the latest code', 'A setting in .gitconfig', 'Another name for a merge conflict'],
          correctIndex: 0,
          explanation: 'Pull requests are a GitHub feature. Teammates review the changes and merge the branch when it is ready.',
          mono: false,
        },
        {
          text: 'What does git pull do?',
          options: ['Uploads your local commits', 'Copies a repository for the first time', 'Fetches remote changes and merges them into your current branch', 'Stages every changed file'],
          correctIndex: 2,
          explanation: 'git pull is git fetch followed by a merge (or rebase). Use git clone for the first copy and git push to upload.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Branch, push and open a pull request',
      type: 'Practice',
      minutes: 30,
      contentMd: 'You have cloned the team repository and need to add `about.md` without touching `main` directly. Write the commands for the full pull request workflow.',
      practice: {
        fileName: 'terminal.sh',
        language: 'bash',
        starterCode: `# Repository: team-site (already cloned from GitHub)
# Start from an up-to-date main branch
git switch main
git pull

# 1. Create and switch to the branch feature/about-page

# 2. Stage about.md and commit it

# 3. Push the branch to GitHub and set the upstream

# 4. Open a pull request into main
`,
        tasks: [
          'Create and switch to the branch feature/about-page',
          'Stage about.md and commit it with a clear message',
          'Push the branch to origin and set the upstream with -u',
          'Open a pull request into main with gh pr create',
        ],
        hint: 'git switch -c creates a branch and moves you onto it in one step. After the first push with -u, a plain git push is enough for later commits.',
        checks: [
          { label: 'Creates the feature branch', pattern: 'git\\s+(switch\\s+-c|checkout\\s+-b)\\s+feature/about-page', flags: '' },
          { label: 'Commits about.md with a message', pattern: 'git\\s+add\\s+[^\\n]*about\\.md[\\s\\S]*git\\s+commit\\s+-a?m\\s+["\\x27][^"\\x27\\n]{5,}["\\x27]', flags: '' },
          { label: 'Pushes the branch with upstream', pattern: 'git\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+feature/about-page', flags: '' },
          { label: 'Opens a pull request into main', pattern: 'gh\\s+pr\\s+create[^\\n]*--base[ =]main', flags: '' },
        ],
      },
    },
  ],
};
