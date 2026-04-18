# packages/core/src

Source tree for the `markdownlint-obsidian` library package.

## Layer map

| Directory | Responsibility |
| --- | --- |
| [`domain/`](domain/AGENTS.md) | Pure value objects, interfaces, and linting contracts |
| [`application/`](application/AGENTS.md) | Use-case orchestration for lint, fix, and vault bootstrap |
| [`infrastructure/`](infrastructure/AGENTS.md) | Parsers, filesystem adapters, rules, formatters, and config loading |
| [`engine/`](engine/AGENTS.md) | DI root that wires concrete adapters into the execution graph |
| [`public/`](../README.md) | Published API barrels consumed by package users |

## Edit routing

- Add or change rule contracts, parse VOs, or pure algorithms in `domain/`.
- Change lint/fix orchestration in `application/`.
- Change filesystem I/O, parser extraction, config loading, or formatter logic
  in `infrastructure/`.
- Wire new dependencies and entrypoints in `engine/`.

## See also

- [`../README.md`](../README.md)
- [`../../AGENTS.md`](../../AGENTS.md)
