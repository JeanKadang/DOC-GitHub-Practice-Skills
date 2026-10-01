# Module 1.5: What never goes in a repository

**Audience:** Anyone who's completed Modules 1.1 and 1.2. The exercise uses the
command line, so Git must be installed (Module 1.2 covers that).
**Format:** Self-paced — read and do each step yourself. Facilitator-note
callouts mark optional group activities.
**Timing:** ~20 min.

A repository remembers everything. That is its purpose, and it is also why a
mistake here is different from a typo: a file you commit and push stays in the
history after you delete it, and in every copy anyone has already made. This
module names what must stay out, shows the everyday tool for keeping it out, and
teaches the one thing to do first after a slip. The full incident procedure is
Module 3.4; here you only need the first step and why it is first.

## Learning objectives

- Name what never belongs in a repository: secrets, tokens, personal data, and
  large binaries.
- Use `.gitignore` and confirm with `git status` that an ignored file is not
  tracked.
- State the first step after a committed secret (rotate it), why deleting the
  file is not enough, and where Module 3.4 picks up.

## What stays out, and why

**Source:** `skills/github-security-response/SKILL.md`

| What | Examples | Why it stays out |
| --- | --- | --- |
| Secrets | Passwords, API keys, tokens, private keys, connection strings with a password in them | Anyone who can read the repository can use them, and bots scan public repositories within seconds |
| Personal data | Customer lists, real names with contact details, exports from a real system | It can't be made private again once it's in history, and it may be covered by privacy rules |
| Large binaries | Installers, disk images, build output, videos | Git stores every version forever, so each one makes every clone bigger. GitHub blocks files over 100 MiB and warns above 50 MiB |
| Generated or local files | Dependency folders, editor settings, logs, local configuration | Noise in every diff, and often a hiding place for the first three |

Two ideas connect these. **Git remembers:** removing a file in a later commit
removes it from the latest version only. The earlier commit, with the file still
in it, stays in the history. And **the value is the problem, not the file
name:** a file called `settings.example.yml` that holds a real key is as bad as
one called `secrets.txt`.

What this diagram shows: the decision you make before you run `git add`.

```mermaid
flowchart TD
    A[A file you are about to commit] --> B{Does it hold a secret,<br/>personal data, or a large binary?}
    B -- Yes --> C[Do not commit it.<br/>Keep it local and add it to .gitignore]
    B -- No --> D{Is it generated,<br/>or specific to your machine?}
    D -- Yes --> C
    D -- No --> E[Commit it]
```

## Keeping files out with .gitignore

**Source:** `skills/github-security-response/SKILL.md`

A `.gitignore` file in the repository lists patterns of files Git should leave
alone. Matching files don't show up in `git status` and can't be staged by
accident with `git add .`:

```text
# local configuration and secrets
.env
*.key

# build output and dependencies
build/
node_modules/
```

Each line is a pattern: a file name (`.env`), a wildcard (`*.key`), or a folder
(`build/`). Lines starting with `#` are comments. The `.gitignore` file is
itself committed, so the whole team ignores the same things.

Two limits you must know:

- **It only affects files Git isn't tracking yet.** If a file was already
  committed, adding it to `.gitignore` doesn't remove it from history and doesn't
  stop Git tracking it. Stopping tracking is a separate step (`git rm --cached
  <file>`), and it still leaves the old commits as they were.
- **It is a safety net, not a vault.** Ignoring a file keeps it out of the
  repository. It does not protect the secret anywhere else, so keep real secrets
  in a password manager or the project's secret store.

Confirm that a pattern works with `git status` (the file should be absent), or
ask Git directly which rule matched:

```bash
git check-ignore -v .env
```

The skill's last step after an incident is the same habit, applied after the
fact: add the file pattern to `.gitignore` so it doesn't happen again.

## If a secret was committed: rotate first

**Source:** `skills/github-security-response/SKILL.md`

The instinct is to delete the file and push. That is the wrong first move. The
credential is compromised from the moment it was pushed, and the old commit
still contains it. So the order is:

1. **Rotate or revoke** the credential at the place that issued it (the cloud
   provider, the registry, the vendor). Assume it has already been copied.
2. Tell the maintainer privately, and don't paste the secret itself into an
   issue, a pull request, a commit message, or chat. Say *where* it was, not
   *what* it was.
3. Only then deal with the file and, if the maintainer decides it is needed, the
   history.

Rewriting history is a destructive step that breaks every clone and fork and
doesn't remove the value from copies that already exist, which is why it needs
the maintainer's explicit go-ahead and comes after rotating. The full
procedure, including private reporting, is in
[Module 3.4: Security response basics](../3_advanced/module-3-4-security-response.md).

## Exercise: spot it, then ignore it

Everything here uses obviously fake values. Never use a real credential in an
exercise.

**Starting state:** a clone of the sandbox repository on your machine (from
Module 1.2), with a clean working tree. Check with `git status`.

**Part A: read a diff.** Below is a proposed change. For each added line, decide
whether it belongs in a repository, and say why.

```diff
+API_BASE_URL=https://api.example.test
+API_TOKEN=example-not-a-real-token
+LOG_LEVEL=info
+DATABASE_URL=postgres://admin:example-password@db.example.test/app
+jane.example@example.test,+1 555 0100
Binary files /dev/null and b/build/app-installer.bin differ
```

**Part B: ignore a local file.**

1. Create a scratch branch: `git checkout -b module-1-5-<your-name>`.
2. Create a file with a fake value: `echo "API_TOKEN=example-not-a-real-token" > .env`.
3. Run `git status`. `.env` appears under untracked files. This is the moment
   an accidental `git add .` would commit it.
4. Create or open `.gitignore` and add the line `.env`.
5. Run `git status` again. `.env` is gone from the list, and `.gitignore` is
   listed as new. Run `git check-ignore -v .env` and read which rule matched.

**Success state:** for Part A you can point to the four lines that must not be
committed and give a reason each; for Part B `.env` exists in your folder but
`git status` doesn't list it, and `git check-ignore -v .env` names your rule.

**Cleanup:** don't commit or push anything from Part B. Delete the fake file,
undo your `.gitignore` change, and return to your normal branch:

```bash
rm .env                    # PowerShell: Remove-Item .env
git status                 # shows only .gitignore (new or modified)
```

If `.gitignore` is listed as *new* (untracked), delete it
(`rm .gitignore`). If it is listed as *modified*, the sandbox already had one,
so undo your line with `git restore .gitignore` instead. Then:

```bash
git checkout main
git branch -D module-1-5-<your-name>
```

> **Facilitator note (optional group activity):** ask attendees to say which
> line in Part A they would have missed, and why. The personal-data line and the
> password inside the connection string are the usual ones.

### Model answer

Part A:

- `API_BASE_URL=https://api.example.test` is fine: a public address, not a
  credential.
- `API_TOKEN=...` is a secret. It stays out.
- `LOG_LEVEL=info` is fine: ordinary configuration.
- `DATABASE_URL=postgres://admin:...@...` is a secret, because the password is
  inside the connection string. It stays out.
- The e-mail and phone line is personal data. It stays out.
- The `.bin` file is a large generated binary. It stays out, and `build/` is a
  pattern for `.gitignore`.

Part B: `.env` is listed as untracked before the `.gitignore` line and absent
after it, and `git check-ignore -v .env` prints the `.gitignore` file, the line
number, and the pattern `.env`.

## Self-check

- Name three kinds of thing that never belong in a repository.
- You committed an API key and pushed. You delete the file and push again. Is
  the key safe? What do you do first?
- You add `.env` to `.gitignore`, but Git still tracks `.env`. Why?
- How do you find out which `.gitignore` rule is hiding a file?
- You're reporting a leaked key. What do you write about it, and what do you
  leave out?

Not confident on any of these? Re-read the matching section above, then check
the answers below.

### Self-check answers

- Any three of: secrets and tokens, personal data, large binaries (and
  generated or local files).
- No. The earlier commit still contains it, and anyone may have copied it.
  Rotate or revoke the key at its source first.
- `.gitignore` only affects files Git isn't tracking yet. A file that was
  already committed stays tracked until you run `git rm --cached` on it, and the
  old commits still contain it.
- `git check-ignore -v <file>`, which prints the rule and where it is.
- Where it was found (file, rough location); never the value itself.

## Feedback

Something unclear, wrong, or worth improving in this module? Open a
Discussion in this repo (**Ideas** category). Concrete, actionable
feedback gets converted into a tracked issue, per this repo's own
issue-first convention — see `skills/github-issue-first/SKILL.md`'s
Discussions section.

---

Next: [Module 2.1: Issue-first and the closure gate](../2_intermediate/module-2-1-issue-first-and-closure-gate.md)
