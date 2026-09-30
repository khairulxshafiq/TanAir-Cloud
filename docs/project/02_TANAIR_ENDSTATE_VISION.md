# 02 — TanAir Endstate Vision

# TanAir Cloud Definition of Done

Version: 1.1
Status: CANONICAL — dokumentasi Definasi Siap utama. (07 Execution Guide adalah duplicate yang telah dipadam; 08 merujuk entri ini juga.)

A feature, phase or release is not complete merely because it appears
correct in the browser.

---

# 1. Product

- [ ] Scope matches the accepted requirement
- [ ] Behaviour matches subscription rules
- [ ] BM-first labels are consistent
- [ ] Simulated capability is labelled
- [ ] Empty state exists
- [ ] Loading state exists
- [ ] Error state exists
- [ ] Success feedback exists
- [ ] No unintended feature regression

---

# 2. Architecture

- [ ] Dependency direction is respected
- [ ] UI does not access storage directly
- [ ] UI does not call Hermes directly
- [ ] Domain logic is testable without DOM
- [ ] Vendor implementation is behind an adapter
- [ ] New architectural decision has an ADR
- [ ] No unnecessary duplicate abstraction
- [ ] Module ownership is clear

---

# 3. Code Quality

- [ ] TypeScript strict check passes
- [ ] Lint passes
- [ ] Formatting passes
- [ ] No dead code
- [ ] No unexplained global state
- [ ] No unsafe type escape without justification
- [ ] No duplicated business rules
- [ ] Error handling is explicit
- [ ] Public functions are understandable
- [ ] Naming is consistent

---

# 4. Security

- [ ] No secret committed
- [ ] User input validated
- [ ] User output safely rendered
- [ ] No unsafe `innerHTML`
- [ ] Sensitive values masked
- [ ] Audit payload sanitised
- [ ] Permissions checked centrally
- [ ] Destructive action confirmed
- [ ] System prompts are not exposed
- [ ] Production credentials remain server-side
- [ ] Security finding status updated

---

# 5. Privacy

- [ ] Only necessary data is collected
- [ ] Data use is explained
- [ ] Memory requires approval
- [ ] Context can be disabled
- [ ] Delete action exists where required
- [ ] Logs exclude sensitive content
- [ ] Trust claims are verified
- [ ] Retention assumptions are documented

---

# 6. Accessibility

- [ ] Keyboard navigation works
- [ ] Visible focus works
- [ ] Labels are present
- [ ] Icon buttons have accessible names
- [ ] Modal focus is trapped
- [ ] Escape behaviour is correct
- [ ] Screen reader announcements are appropriate
- [ ] Status is not colour-only
- [ ] Contrast is readable
- [ ] Reduced motion is supported
- [ ] Mobile touch targets are usable

---

# 7. Responsive Design

- [ ] Works at 320px
- [ ] Works on common phone widths
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] No clipped tooltip
- [ ] No inaccessible horizontal action
- [ ] Tables have a responsive strategy
- [ ] Drawers close correctly
- [ ] Composer remains usable with mobile keyboard

---

# 8. Performance

- [ ] No unnecessary animation loop
- [ ] Event listeners are cleaned up
- [ ] Large module is lazy-loaded where appropriate
- [ ] Images have dimensions
- [ ] Loading behaviour is reasonable
- [ ] Bundle impact reviewed
- [ ] Search is debounced where appropriate
- [ ] Hidden-tab work is paused where appropriate
- [ ] No obvious memory leak

---

# 9. Testing

- [ ] Unit tests added
- [ ] Integration tests added where required
- [ ] Permission tests added
- [ ] Error tests added
- [ ] Critical journey tests updated
- [ ] Accessibility checks completed
- [ ] Existing tests pass
- [ ] Production build passes
- [ ] Manual test checklist completed

---

# 10. Data and Migration

- [ ] Data model updated
- [ ] Backward compatibility considered
- [ ] Migration documented
- [ ] Rollback or forward-fix documented
- [ ] Seed data updated if needed
- [ ] Corrupted storage handled
- [ ] Cross-user access tested for Supabase
- [ ] RLS decision documented

---

# 11. Documentation

- [ ] README updated if needed
- [ ] Feature README updated
- [ ] ADR added or updated
- [ ] Decisions Log updated if needed
- [ ] Environment variables documented
- [ ] Known limitations updated
- [ ] Operations notes updated
- [ ] Handover notes prepared

---

# 12. Operational Readiness

- [ ] Deployment steps known
- [ ] Rollback steps known
- [ ] Monitoring impact considered
- [ ] Log events defined
- [ ] Correlation ID available where required
- [ ] Alerting requirement documented
- [ ] Support impact documented
- [ ] Ownership assigned

---

# 13. Phase Gate

Before a phase is approved:

```text
Lint: PASS
Format: PASS
Typecheck: PASS
Tests: PASS
Build: PASS
Security review: PASS or accepted finding
Accessibility review: PASS or accepted finding
Documentation: COMPLETE
Rollback: DOCUMENTED
```

---

# 14. Release Definition

TanAir is release-ready only when:

- Build is reproducible
- Tests are green
- Critical journeys pass
- No critical security findings remain
- No production secrets are exposed
- Admin authorisation is enforced appropriately
- RLS is tested for exposed Supabase data
- Monitoring is available
- Backup and rollback are documented
- Known limitations are disclosed
- Founder approval is recorded

