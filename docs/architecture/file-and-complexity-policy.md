---
title: File and Complexity Policy
---

# File and Complexity Policy

## Policy

Keep files and functions small enough to review safely. Prefer one public class
or major exported concept per file. Keep cyclomatic complexity low and split
mixed responsibilities before they become architecture debt.

## File Ownership

| File kind | Rule |
| :--- | :--- |
| Public class or service | Prefer one class per file, named after the concept |
| Rule implementation | One rule per file |
| Parser extractor | One OFM construct per file |
| Formatter | One output format per file |
| Barrel export | Re-exports only, no hidden behavior |
| Tests | Mirror source ownership where practical |

Small private helpers may colocate with their consumer when they are not useful
outside that file.

## Complexity Limits

| Scope | Limit | Action if exceeded |
| :--- | :--- | :--- |
| Function or method | Target cyclomatic complexity 7 or lower | Extract named helpers, guard clauses, or value objects |
| File | Soft limit around 200 lines | Review for mixed responsibilities |
| Rule file | One rule plus small local helpers | Split shared logic into focused helper modules |

## Techniques

- Use guard clauses to remove nested branches.
- Move validation into value objects or config validators.
- Replace repeated branch families with lookup tables when clearer.
- Extract shared rule helpers only after duplication is real.

## Prohibited Shortcuts

- Do not suppress complexity warnings without a local explanation.
- Do not hide complexity in dense expressions.
- Do not split files purely to satisfy a line count if coherence gets worse.
