# Markdown Formatting Showcase

A lookup reference for GitHub-Flavored Markdown — every entry shows the
raw syntax and what it renders as, so you can copy what you need instead
of searching external docs. Not a lesson; skim to the section you need.

To see the same formatting working together in one realistic document, read the
[Markdown showcase document](markdown-showcase.md).

## Headings

Six levels, `#` through `######`. Only one `#` (H1) per document — it's
the title.

```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

## Emphasis

| Syntax | Renders as |
| --- | --- |
| `*italic*` or `_italic_` | *italic* |
| `**bold**` or `__bold__` | **bold** |
| `***bold italic***` | ***bold italic*** |
| `~~strikethrough~~` | ~~strikethrough~~ |

## Blockquotes

```markdown
> A single-line quote.
>
> A second paragraph in the same quote.
>> A nested quote.
```

> A single-line quote.
>
> A second paragraph in the same quote.
>> A nested quote.

## Lists

Unordered:

```markdown
- Item one
- Item two
  - Nested item
    - Deeper nested item
```

- Item one
- Item two
  - Nested item
    - Deeper nested item

Ordered:

```markdown
1. First
2. Second
   1. Nested first
   2. Nested second
```

1. First
2. Second
   1. Nested first
   2. Nested second

Task lists (GitHub-specific — renders as checkboxes, clickable on
GitHub.com):

```markdown
- [x] Completed task
- [ ] Incomplete task
```

- [x] Completed task
- [ ] Incomplete task

## Code

Inline: `` `code()` `` renders as `code()`.

Fenced, with a language tag for syntax highlighting (required by this
repo's lint config — MD040):

````markdown
```javascript
function hello() {
  return "world";
}
```
````

```javascript
function hello() {
  return "world";
}
```

## Tables

```markdown
| Left | Center | Right |
| :--- | :---: | ---: |
| a | b | c |
```

| Left | Center | Right |
| :--- | :---: | ---: |
| a | b | c |

## Links and images

```markdown
[Link text](https://example.com)
![Alt text for an image](https://example.com/image.png)
```

Bare URLs need angle brackets to satisfy this repo's lint config
(MD034 — no bare URLs): `<https://example.com>` renders as
<https://example.com>.

## Horizontal rule

```markdown
---
```

---

## Footnotes

```markdown
Text with a footnote reference.[^1]

[^1]: The footnote's content, defined anywhere in the document.
```

Text with a footnote reference.[^1]

[^1]: The footnote's content, defined anywhere in the document.

## Collapsible sections

GitHub-Flavored Markdown supports raw HTML for this — no pure-Markdown
equivalent exists. This repo's lint config flags inline HTML by default
(MD033), so a targeted disable comment is the correct way to use it
deliberately, same pattern `.github/PULL_REQUEST_TEMPLATE.md` already
uses for a different rule:

```markdown
<!-- markdownlint-disable MD033 -->
<details>
<summary>Click to expand</summary>

Hidden content goes here — including other Markdown, like a code block
or a list.

</details>
<!-- markdownlint-enable MD033 -->
```

<!-- markdownlint-disable MD033 -->
<details>
<summary>Click to expand</summary>

Hidden content goes here — including other Markdown, like a code block
or a list.

</details>
<!-- markdownlint-enable MD033 -->

## Emoji shortcodes

GitHub renders `:shortcode:` emoji syntax: `:tada:` → :tada:, `:warning:`
→ :warning:, `:white_check_mark:` → :white_check_mark:.

## Line breaks

A single newline in the source does **not** start a new line in the
rendered output — paragraphs need a blank line between them. To force a
line break without a new paragraph, end the line with two trailing
spaces, or use `<br>`.
