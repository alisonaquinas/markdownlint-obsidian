# Changelog

<!-- markdownlint-configure-file {
  "MD013": false,
  "MD024": {
    "siblings_only": true
  }
} -->

## [1.3.0](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.2.1...markdownlint-obsidianv1.3.0) (2026-06-09)


### Features

* **extension:** implement vscode roadmap ([f670016](https://github.com/alisonaquinas/markdownlint-obsidian/commit/f670016681a0513d931d7184e0e0af7282908164))
* support config format parity ([8fcc364](https://github.com/alisonaquinas/markdownlint-obsidian/commit/8fcc3643cad2db0f71cd6df33abfa5e75a3771e6))
* **wikilinks:** obsidian-fuzzy resolveMode for mixed-namespace vaults ([#27](https://github.com/alisonaquinas/markdownlint-obsidian/issues/27)) ([05b35cd](https://github.com/alisonaquinas/markdownlint-obsidian/commit/05b35cd1467b5b9056e4fed411b8026125096b58))
* **wikilinks:** obsidian-fuzzy resolveMode for mixed-namespace vaults ([#27](https://github.com/alisonaquinas/markdownlint-obsidian/issues/27)) ([89d45ad](https://github.com/alisonaquinas/markdownlint-obsidian/commit/89d45ad98c58ab40c7e16cb431e8c9f00b4c66b8))


### Bug Fixes

* disable MD028 by default — OFM callout multi-paragraph syntax requires blank blockquote lines ([cb5cd6b](https://github.com/alisonaquinas/markdownlint-obsidian/commit/cb5cd6b19899bba9377dcb99d2b196f05fd5ba23))
* disable MD028 by default (OFM callout multi-paragraph conflict) ([c6c1a09](https://github.com/alisonaquinas/markdownlint-obsidian/commit/c6c1a09c3c92e340cdc4ed82bf86f3408b6634ae))
* disable MD028 by default (OFM callout multi-paragraph conflict) ([c6c1a09](https://github.com/alisonaquinas/markdownlint-obsidian/commit/c6c1a09c3c92e340cdc4ed82bf86f3408b6634ae))
* **docs:** compact [@module](https://github.com/module) header to stay under max-lines limit ([497a279](https://github.com/alisonaquinas/markdownlint-obsidian/commit/497a27941381e69c8e3abb2b80fc989677d9ceb5))
* make markdown linting line-ending stable ([7bd5cbc](https://github.com/alisonaquinas/markdownlint-obsidian/commit/7bd5cbc61103770623e48e6122c36df3dd520333))
* resolve high severity codeql alerts ([000a54b](https://github.com/alisonaquinas/markdownlint-obsidian/commit/000a54bdd613e49b81fe8a98d79612e5323ef8a8))
* **standard:** handle markdownlint deleteCount=-1 sentinel without crashing ([#28](https://github.com/alisonaquinas/markdownlint-obsidian/issues/28)) ([bf843cb](https://github.com/alisonaquinas/markdownlint-obsidian/commit/bf843cb374f2356e6d9f01175763ae308f0092dd))
* **standard:** handle markdownlint deleteCount=-1 sentinel without crashing ([#28](https://github.com/alisonaquinas/markdownlint-obsidian/issues/28)) ([27f845e](https://github.com/alisonaquinas/markdownlint-obsidian/commit/27f845e4f75dfd4209ccd3e0e0f4d827966df15d))

## [1.2.1](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.2.0...markdownlint-obsidianv1.2.1) (2026-06-09)

### Dependencies

* bump js-yaml from 4.1.1 to 4.2.0
* bump markdown-it from 14.1.1 to 14.2.0

## [1.2.0](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.1.0...markdownlint-obsidianv1.2.0) (2026-06-09)


### Features

* **extension:** implement vscode roadmap ([f670016](https://github.com/alisonaquinas/markdownlint-obsidian/commit/f670016681a0513d931d7184e0e0af7282908164))
* support config format parity ([8fcc364](https://github.com/alisonaquinas/markdownlint-obsidian/commit/8fcc3643cad2db0f71cd6df33abfa5e75a3771e6))


### Bug Fixes

* make markdown linting line-ending stable ([7bd5cbc](https://github.com/alisonaquinas/markdownlint-obsidian/commit/7bd5cbc61103770623e48e6122c36df3dd520333))
* resolve high severity codeql alerts ([000a54b](https://github.com/alisonaquinas/markdownlint-obsidian/commit/000a54bdd613e49b81fe8a98d79612e5323ef8a8))

## [1.1.0](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.0.2...markdownlint-obsidianv1.1.0) (2026-05-04)

### Features

* add `wikilinks.resolveMode = "obsidian-fuzzy"` for mixed-namespace vaults ([89d45ad](https://github.com/alisonaquinas/markdownlint-obsidian/commit/89d45ad))

### Bug Fixes

* handle markdownlint `deleteCount = -1` sentinel without crashing ([27f845e](https://github.com/alisonaquinas/markdownlint-obsidian/commit/27f845e))

## [1.0.2](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.0.1...markdownlint-obsidianv1.0.2) (2026-04-18)

### Bug Fixes

* disable MD028 by default — OFM callout multi-paragraph syntax requires blank blockquote lines ([cb5cd6b](https://github.com/alisonaquinas/markdownlint-obsidian/commit/cb5cd6b19899bba9377dcb99d2b196f05fd5ba23))
* disable MD028 by default (OFM callout multi-paragraph conflict) ([c6c1a09](https://github.com/alisonaquinas/markdownlint-obsidian/commit/c6c1a09c3c92e340cdc4ed82bf86f3408b6634ae))
* disable MD028 by default (OFM callout multi-paragraph conflict) ([c6c1a09](https://github.com/alisonaquinas/markdownlint-obsidian/commit/c6c1a09c3c92e340cdc4ed82bf86f3408b6634ae))

## [1.0.1](https://github.com/alisonaquinas/markdownlint-obsidian/compare/markdownlint-obsidianv1.0.0...markdownlint-obsidianv1.0.1) (2026-04-14)

### Bug Fixes

* **docs:** compact [@module](https://github.com/module) header to stay under max-lines limit ([497a279](https://github.com/alisonaquinas/markdownlint-obsidian/commit/497a27941381e69c8e3abb2b80fc989677d9ceb5))
