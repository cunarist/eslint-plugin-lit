---
description: Rule docs follow ESLint core layout (Rule Details, incorrect/correct, When Not To Use It); README links, never repeats
---

Every rule gets a `docs/rules/<rule>.md` in the layout ESLint core and
typescript-eslint use, below the header that `npm run docs` generates
([[generated-docs]]):

````markdown
<!-- generated header: title, 📝 description, 💼 configs -->
<!-- end auto-generated rule header -->

## Rule Details

Optional one or two sentences spelling out what the description abbreviates.

Prose. Not a restatement of the rule — the concrete failure it prevents, then
why the alternative removes that failure structurally.

Bullets covering the edges: what it deliberately does not fire on, what variants
it does catch, what it cannot see. These double as the test list.

Examples of **incorrect** code for this rule:

One ```ts block. Minimal code.

Examples of **correct** code for this rule:

One ```ts block. Minimal code.

## Options

Only if the rule has options.

## When Not To Use It

Short and honest, derived from the edges above. No invented claims.
````

`README.md` links to each of these and never repeats them; per preset it carries
one paragraph of philosophy and one representative BAD/GOOD; the rule table is
the single generated list under `## Rules`. No contributor-facing content — library users only.

`vp fmt` reformats Markdown, tables included. Keep ` ```ts ` examples valid at
top level; wrap a bare `readonly` or `private` modifier in a `class … { }` body.
