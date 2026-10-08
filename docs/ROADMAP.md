# Roadmap

The first release should help an existing agent improve a real interface and carry useful decisions into the next task. Keep the engine small; add expertise through packs and optional extensions.

## Next

- Import screenshots and reference files already available to the host agent.
- Support authenticated browser capture with explicit handling of local session state.
- Exercise the full workflow in two actual agent hosts and document working setup, image handling, and cancellation.

## Before a published MVP

- Run real design tasks against a plain brief/skill baseline; measure useful findings, setup effort, and repeat use.
- Have a new contributor build a pack or check from the documentation.
- Finish response limits, public contract validation, crash-recovery tests, and dependency notices.
- Choose stable package names and publishing ownership, then publish tested CLI and optional browser packages.

## Later, if real use calls for it

- More observers and checks maintained outside core.
- Better context selection and explicit decision updates.
- Pack compatibility tests and shared evaluation fixtures.

A hosted app, marketplace, and a separate model orchestration layer are outside the first release. [Current status](STATUS.md) records what works today.
