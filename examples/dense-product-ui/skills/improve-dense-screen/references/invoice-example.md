# Example: choosing an overdue invoice

**Illustrative, not research evidence.** A finance operator needs to find the highest overdue amount and contact its owner.

The existing screen has a compact table with invoice number, customer, due date, amount, status, and owner. Every cell uses a colored badge, and the primary contact action competes with three secondary actions.

Proposed improvement: retain the aligned comparison columns; use ordinary text for neutral values; reserve stronger emphasis for overdue status and amount; make contact the visible row action; put infrequent actions in an accessible menu. Preserve sorting and selection behavior.

Check desktop comparison, a narrow viewport, long customer names, zero invoices, failed loading, and keyboard access to the row action. A screenshot alone cannot establish that sorting or the menu works. Describe those as untested until observed.

Alternative: on a narrow viewport, prioritize the most decision-relevant columns with an explicit route to remaining details. Do not silently delete required invoice information to improve appearance.

Potential remembered decision: “For invoice comparison tasks, preserve aligned amounts and due dates.” Record it as accepted only after the owner makes that choice, with this scope and the reason. Do not promote it into “all lists must be tables.”
