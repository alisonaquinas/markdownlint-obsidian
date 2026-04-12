FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY bin ./bin
RUN npm ci
RUN npm run build

# The dev bin script uses tsx at runtime to execute TypeScript sources.
# For the hermetic runtime image we ship the TypeScript output from
# `dist/` under a pure-Node bin so the image does not need tsx or any
# devDependencies at run time.
RUN printf '#!/usr/bin/env node\nimport("../dist/src/cli/main.js").then(async (m) => { const code = await m.main(process.argv); process.exit(code); }).catch((err) => { console.error(err); process.exit(2); });\n' \
      > dist/bin.mjs && chmod +x dist/bin.mjs

# Strip dev dependencies from node_modules so they do not bloat the
# runtime stage. Runtime only needs chalk, commander, cosmiconfig,
# globby, gray-matter, js-yaml, jsonc-parser, markdown-it, markdownlint,
# minimatch, and fast-xml-parser.
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /workdir
# The node:20-alpine base already ships a non-root `node` user (uid 1000)
# that we reuse rather than minting a second account.
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
RUN ln -s /app/dist/bin.mjs /usr/local/bin/markdownlint-obsidian \
    && chmod +x /app/dist/bin.mjs
USER node
ENTRYPOINT ["markdownlint-obsidian"]
CMD ["--help"]
