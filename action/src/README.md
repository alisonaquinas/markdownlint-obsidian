# action/src

Source tree for the GitHub Action wrapper.

## Files

| File | Responsibility |
| --- | --- |
| [`main.ts`](main.ts) | Reads action inputs, invokes the CLI wrapper, and sets GitHub Action outputs |

## Notes

- The action manifest lives at [`../action.yml`](../action.yml), so consumers
  reference this action as `alisonaquinas/markdownlint-obsidian/action@<tag>`.
- Any edit to `main.ts` must be followed by `npm run build` from
  [`../`](../README.md) so `dist/main.js` stays in sync.

## See also

- [`../README.md`](../README.md)
- [`AGENTS.md`](AGENTS.md)
