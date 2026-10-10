# Sourced by bash through BASH_ENV in the eval sandbox. It puts a `git` function
# in front of the real git (bash would otherwise find its own git before the mock
# folder on PATH) so the agent sees the scenario's GitHub URL instead of the
# local bare repository that receives pushes. See mock-git.mjs.
git() { node "$(cygpath -u "$GH_MOCK_DIR")/mock-git.mjs" "$@"; }
