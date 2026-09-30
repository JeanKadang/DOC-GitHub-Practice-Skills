# Mermaid Diagram Types Showcase

A lookup reference — one minimal example of each major Mermaid diagram
type, so you can copy the shape you need instead of searching external
docs. Every example here is confirmed to render on GitHub.com; if you're
viewing this in an editor instead, the Mermaid preview extension from
[Extra: Setting Up Your Local Dev Environment](../extra/setup-local-dev-environment.md)
renders these locally too. Mermaid has more diagram types than this page
covers (some are newer or still experimental) — this is the established
core, not the complete list.

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

Already used in `education/beginners/session-1-getting-started.md` —
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
