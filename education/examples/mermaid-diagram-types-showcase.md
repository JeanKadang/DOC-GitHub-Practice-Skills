# Mermaid Diagram Types Showcase

A lookup reference — one minimal example of every Mermaid diagram type
documented as of this page's writing, so you can copy the shape you need
instead of searching external docs. Two tiers, in this order:

1. **Established types** — mature, in Mermaid for years, confirmed to
   render on GitHub.com.
2. **Newer/extended types** — added to Mermaid more recently. GitHub's own
   diagram-support announcement only explicitly lists flowcharts, UML,
   git graphs, user journey, and Gantt — it predates these, and doesn't
   confirm or rule them out. Treat these as "try it, verify on GitHub
   after you push" rather than guaranteed.

If you're viewing this in an editor instead of on GitHub.com, the Mermaid
preview extension from
[Extra: Setting Up Your Local Dev Environment](../0_prerequisites/setup-local-dev-environment.md)
renders most of these locally regardless of what GitHub itself supports —
useful for checking a newer-tier diagram before you commit it somewhere
that matters.

## Established types

## Flowchart

The most common type — already used throughout this program's other
pages. Nodes, edges, and decision branches.

```mermaid
flowchart LR
    A[Rectangle] --> B(Rounded)
    B --> C{Decision}
    C -- Yes --> D[[Subroutine]]
    C -- No --> E((Circle))
    D --> F[(Database)]
```

## Sequence diagram

Shows interactions between participants over time — requests, responses,
who talks to whom in what order.

```mermaid
sequenceDiagram
    participant U as User
    participant A as Agent
    participant G as GitHub
    U->>A: File an issue
    A->>G: gh issue create
    G-->>A: Issue #42 created
    A-->>U: Done, see #42
```

## Class diagram

Structure — objects, their attributes/methods, and relationships between
them. More common in software design docs than this program's usual
content, but worth knowing it exists.

```mermaid
classDiagram
    class Issue {
      +int number
      +string title
      +close()
    }
    class PullRequest {
      +int number
      +string refsIssue
      +merge()
    }
    PullRequest --> Issue : closes
```

## State diagram

Already used in `education/facilitator-guide.md` for the sandbox repo's
lifecycle — states and the transitions between them.

```mermaid
stateDiagram-v2
    [*] --> Open
    Open --> InReview: PR opened
    InReview --> Open: changes requested
    InReview --> Closed: merged
    Closed --> [*]
```

## Entity relationship diagram

Database-style schema — entities, their fields, and how they relate.

```mermaid
erDiagram
    ISSUE ||--o{ PULL_REQUEST : "closed by"
    ISSUE {
      int number
      string title
    }
    PULL_REQUEST {
      int number
      string body
    }
```

## Git graph

Already used in `education/1_beginners/session-1-getting-started.md` —
commits, branches, and merges, drawn the way `git log --graph` would show
them.

```mermaid
gitGraph
    commit id: "main: existing"
    branch feature
    checkout feature
    commit id: "Add change"
    checkout main
    merge feature id: "PR merged"
```

## Mindmap

Already used throughout `education/README.md` for topic overviews — a
central idea branching into related sub-topics.

```mermaid
mindmap
  root((Mermaid types))
    Flowchart
    Sequence
    Class
    State
    ER
```

## Pie chart

Proportions of a whole.

```mermaid
pie title Module completion
    "Done" : 7
    "In progress" : 1
    "Not started" : 2
```

## Gantt chart

Timeline/scheduling — tasks, durations, and dependencies.

```mermaid
gantt
    title Example rollout
    dateFormat YYYY-MM-DD
    section Phase 1
    Draft module      :a1, 2026-10-01, 3d
    Review            :after a1, 2d
    section Phase 2
    Publish           :2026-10-08, 1d
```

## User journey

Steps in a process from a user's perspective, each scored for
satisfaction — useful for UX-style walkthroughs.

```mermaid
journey
    title Filing an issue
    section Discover
      Notice a bug: 3: User
    section Act
      Open Issues tab: 4: User
      Fill the form: 3: User
    section Done
      Submit: 5: User
```

## Quadrant chart

Plots items across two axes into four quadrants — useful for
prioritization (e.g. this repo's own P0-P3 impact/urgency thinking).

```mermaid
quadrantChart
    title Priority triage
    x-axis Low Impact --> High Impact
    y-axis Low Urgency --> High Urgency
    quadrant-1 Do now
    quadrant-2 Plan
    quadrant-3 Ignore
    quadrant-4 Delegate
    Fix flaky CI: [0.8, 0.9]
    Update README: [0.3, 0.2]
```

## Timeline

A chronological sequence of events, simpler than a Gantt chart when
duration/overlap doesn't matter.

```mermaid
timeline
    title This repo's ADRs
    2026-08 : ADR 0001 (Refs/Closes)
    2026-09-27 : ADR 0002 : ADR 0003
    2026-09-28 : ADR 0004 : ADR 0005 : ADR 0006
    2026-09-30 : ADR 0007 : ADR 0008
```

## Requirement diagram

Formal requirements and what satisfies them — closer to systems
engineering than everyday software docs, but a real Mermaid type.

```mermaid
requirementDiagram
    requirement closureGate {
      id: 1
      text: every criterion needs evidence
      risk: high
      verifymethod: review
    }
    element PRTemplate {
      type: file
    }
    PRTemplate - satisfies -> closureGate
```

## C4 diagram (context level)

Software architecture at the "who talks to what system" level — the
level this program's own skills-vs-education split operates at, even
though this repo doesn't use C4 notation elsewhere.

```mermaid
C4Context
    Person(colleague, "Colleague", "Reads education/ content")
    System(claudeCode, "Claude Code", "Reads skills/*/SKILL.md")
    System_Ext(github, "GitHub", "Hosts issues, PRs, repo")
    Rel(colleague, claudeCode, "Asks for help")
    Rel(claudeCode, github, "Files issues, opens PRs")
```

## Sankey diagram

Flow quantities between stages — width of each band shows volume, useful
for showing where something (traffic, budget, issues) actually goes.

```mermaid
sankey-beta
    Opened,In Review,10
    In Review,Merged,7
    In Review,Closed without merge,3
```

## XY chart

Plotted data points/bars along two axes — closer to a conventional bar or
line chart than any of the above.

```mermaid
xychart-beta
    title "Issues closed per week"
    x-axis [W1, W2, W3, W4]
    y-axis "Count" 0 --> 20
    bar [4, 9, 6, 15]
```

## Newer/extended types

Everything below is a more recent Mermaid addition. Confirmed to parse
under current Mermaid syntax; **not** confirmed to render on GitHub.com
specifically — check the rendered page after pushing before relying on
one of these somewhere colleagues will actually read it.

### Architecture diagram

A cloud/infrastructure-style boxes and the
connections between them, GitHub's newest diagram type as of this
writing.

```mermaid
architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    server:R -- L:db
```

### Block diagram

General-purpose boxes-and-connections, less constrained than a flowchart
— closer to a whiteboard sketch than a strict flow.

```mermaid
block-beta
    columns 3
    Frontend Backend Database
    Frontend --> Backend
    Backend --> Database
```

### Kanban

A literal Kanban board — columns and cards, the shape `github-projects`
describes conceptually but as an actual diagram.

```mermaid
kanban
    Todo
      task1[Draft the doc]
    In Progress
      task2[Review PR]
    Done
      task3[Merge]
```

### Radar chart

Multiple quantities compared across axes radiating from a center point —
skill/capability comparisons are the common use.

```mermaid
radar-beta
    axis git, github, reviews, automation
    curve colleague["New colleague"]{3, 2, 1, 1}
    curve maintainer["Maintainer"]{5, 5, 4, 4}
```

### Packet diagram

Byte/bit-level layout of a network packet or binary format — a niche,
specific use case.

```mermaid
packet-beta
0-7: "Source Port"
8-15: "Destination Port"
16-31: "Length"
```

### ZenUML

An alternative syntax for sequence diagrams, more code-like than
Mermaid's own `sequenceDiagram`.

```mermaid
zenuml
    title Filing an issue
    User->Agent: File an issue
    Agent->GitHub: gh issue create
```

### Treemap

Nested rectangles sized by value — proportions within a hierarchy, an
alternative to a pie chart when categories nest.

```mermaid
treemap-beta
"Education"
    "GitHub track": 6
    "LLM track": 1
    "Examples": 2
```
