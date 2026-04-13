FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY bin ./bin
COPY scripts ./scripts
RUN bun install --frozen-lockfile
RUN bun run build

# Strip dev dependencies from node_modules so they do not bloat the
# runtime stage. Runtime only needs chalk, commander, globby, gray-matter,
# js-yaml, jsonc-parser, markdown-it, markdownlint, minimatch, and fast-xml-parser.
RUN bun install --production --frozen-lockfile

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
