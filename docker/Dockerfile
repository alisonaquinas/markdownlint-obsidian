FROM oven/bun:1-alpine AS build
WORKDIR /app
# Copy workspace root manifests and lock file
COPY package.json bun.lock bunfig.toml tsconfig.json ./
# Copy all workspace package manifests so bun can resolve workspace:* links.
# action/ is declared in the root workspaces array and must be present.
COPY packages/core/package.json packages/core/tsconfig.json packages/core/tsconfig.build.json ./packages/core/
COPY packages/cli/package.json packages/cli/tsconfig.json packages/cli/tsconfig.build.json ./packages/cli/
COPY action/package.json ./action/
RUN bun install --frozen-lockfile
# Copy source after install so layer caching is preserved
COPY packages/core/src ./packages/core/src
COPY packages/core/scripts ./packages/core/scripts
COPY packages/cli/src ./packages/cli/src
COPY packages/cli/bin ./packages/cli/bin
COPY packages/cli/scripts ./packages/cli/scripts
# Build library then CLI (CLI depends on core dist/)
RUN bun run --filter markdownlint-obsidian build
RUN bun run --filter markdownlint-obsidian-cli build

# Strip dev dependencies so they do not bloat the runtime stage.
RUN bun install --production --frozen-lockfile

FROM node:20-alpine AS runtime
WORKDIR /app
# The node:20-alpine base already ships a non-root `node` user (uid 1000).
# Workspace deps are hoisted to root node_modules; per-package dirs contain
# only the workspace symlinks, so we copy the root node_modules as-is.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Core package: package.json (exports map) + compiled dist/
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist
# CLI package: package.json (exports map) + compiled dist/
COPY --from=build /app/packages/cli/package.json ./packages/cli/package.json
COPY --from=build /app/packages/cli/dist ./packages/cli/dist
WORKDIR /workdir
RUN ln -s /app/packages/cli/dist/bin.mjs /usr/local/bin/markdownlint-obsidian \
    && chmod +x /app/packages/cli/dist/bin.mjs
USER node
ENTRYPOINT ["markdownlint-obsidian"]
CMD ["--help"]
