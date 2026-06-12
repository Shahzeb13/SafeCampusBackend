# SafeCampus Implementation Milestones

To avoid burning out today, focus on one milestone at a time. Finish a milestone, test it via Postman/frontend, take a 5-minute break, and then move to the next.

## 🏁 Milestone 1: Top-Level Setup (SuperAdmin & Organizations)
*Goal: Get the highest level of the hierarchy working first.*
- [x] Implement endpoint: Create user with ANY role (Restricted to `SuperAdmin` only).
- [x] Implement endpoint: Assign a user as an `OrgOwner` to a specific Organization.
- [x] Implement endpoint: Allow `SuperAdmin` and `OrgOwner` to create users with roles *smaller* than `OrgOwner`.

## 🏛️ Milestone 2: Campus Infrastructure
*Goal: Set up the physical boundaries of the system.*
- [ ] Implement endpoint: Register a new Campus under a specific Organization.
- [ ] Implement endpoint: Assign a `CampusAdmin` to a specific Campus within an Organization.
- [ ] **Test:** Ensure `OrgOwner` can manage their Campuses, and `CampusAdmin` access is strictly scoped to their assigned Campus.

## 👥 Milestone 3: Campus Level Operations (Populating the Campus)
*Goal: Allow the Campus Admin to set up their specific campus.*
- [ ] Implement endpoint: Allow `SuperAdmin`, `OrgOwner`, and `CampusAdmin` to create users with roles like `Student`, `Staff`, `SecurityIncharge`, and `SecurityGuard`.
- [ ] Implement Permissions: Ensure robust campus-level permissions (e.g., CampusAdmin of 'Campus A' cannot create or view users in 'Campus B').

## 🚨 Milestone 4: Security Incident Workflows
*Goal: Bring the core operational loop to life for the Security Incharge.*
- [ ] Implement endpoint: Students & Staff can submit SOS and Incident Requests.
- [ ] Implement endpoint: `SecurityIncharge` can fetch, view, and manage these active requests.
- [ ] Implement endpoint: `SecurityIncharge` can assign/delegate an incident to specific `SecurityGuard`s.
- [ ] Implement endpoint: Allow updating and resolving the status of active incidents (from 'Pending' to 'In Progress' to 'Resolved').

---
*Tip: Don't try to build all the UI at once. Build a milestone's backend, verify the API works, and then move to the next milestone.*