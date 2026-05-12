# Clean Install Instructions

These commands install the local project cleanly and publish it to GitHub.

## Prerequisites
- Git installed
- GitHub account
- Optional: Homebrew and GitHub CLI (`gh`)

### Install GitHub CLI (optional, recommended)
```bash
brew install gh
```

### Authenticate GitHub CLI
```bash
gh auth login
```

## Option 1: Clean install from an existing local folder
```bash
cd "/Volumes/Grey_1TB/Industry PWA/trades-field-services-roster-pwa"
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/trades-field-services-roster-pwa.git
git push -u origin main
```

## Option 2: Initialize repo with GitHub CLI (if repo does not exist yet)
```bash
cd "/Volumes/Grey_1TB/Industry PWA/trades-field-services-roster-pwa"
gh repo create <your-username>/trades-field-services-roster-pwa --public --source=. --remote=origin --push
```

## If the remote repo already exists and you want to clone it
```bash
git clone https://github.com/<your-username>/trades-field-services-roster-pwa.git
cd trades-field-services-roster-pwa
# copy or create your files here
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Common Notes
- Use `git pull origin main` first if you are syncing with an existing remote.
- Use `--force` only if you intend to overwrite the remote branch.
- For GitHub Pages, set the source to `main` and the folder to `/ (root)` in the repository Settings.
