## Repository overview

- This is a small Node.js (CommonJS) repository. See `package.json` for project metadata and declared dependency `openai@^6.8.1`.
- Top-level directories: `GeorgePortal/` and `New folder/` (both currently empty). There is no application entry file (the `package.json` `main` is `index.js` but that file is not present).

## Goals for an AI coding agent

- Be conservative: only create new top-level entry points (e.g., `index.js`) when requested or when a clear task requires it.
- Preserve repository style: CommonJS modules (`require`/`module.exports`) and simple npm scripts.

## Key files and patterns to reference

- `package.json` — defines project type (`commonjs`) and dependency on `openai`. Use this to infer runtime and package manager (npm).
- `.github/workflows/publish-workspace.yml` — contains a `workflow_dispatch` job that commits workspace entries. Avoid changing CI unless task explicitly involves workflows.

## Developer workflows (what to run locally)

- Reproduce the environment: run `npm install` to get dependencies (OpenAI client). There are no test or start scripts defined.
- If you add runnable code, update `package.json` `scripts` with `start` and `test` entries and document how to run them in this file.

## Project-specific conventions and constraints

- CommonJS modules: follow `require()` and `module.exports` when adding code unless converting the repo to ESM is an explicit task.
- Minimal repo: prefer small, self-contained changes. When adding new features, also add a matching `scripts` entry and a short README snippet.

## Integration points & external dependencies

- OpenAI: any code that integrates with `openai` should use the version declared in `package.json`. Look for environment-driven API keys (no keys are present in the repo). Do not add secrets to source — recommend use of environment variables and document them in README.
- GitHub Actions: `publish-workspace.yml` demonstrates how author/entry inputs are used; follow the same commit pattern when automating workspace updates.

## Concrete examples for common tasks

- Add a small runner: create `index.js` exporting a function and a `scripts.start` entry in `package.json`. Example reference points: `package.json` `main` should match the created file.
- Add documentation: update the top-level `README.md` (not present) or add a short README in the directory you modify describing how to run and environment variables.

## What I won't do without confirmation

- Modify GitHub Actions workflows (except minor docs or comments).
- Add or commit secrets or API keys to the repo.

## Where to look for follow-ups

- If you need to understand runtime behavior, add a tiny `index.js` and a `scripts.start` then run `node index.js` locally. Document the command in `package.json` and this file.

---
If any of the above assumptions are incorrect (for example, there is a missing app entry you expect me to implement), tell me which feature or file to prioritize and I will update this guidance and implement the change.
