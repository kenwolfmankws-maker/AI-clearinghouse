# Boundary Enforcement System

## Overview

The AI Clearinghouse implements a **strict boundary enforcement system** to preserve the intentional separation between two distinct domains:

1. **Sanctuary** (Mythic/Symbolic Domain)
2. **AI Clearinghouse** (Professional/Neutral Domain)

This system operates under the authority of **MASTERBUILDER GEORGE** and ensures that each domain maintains its unique identity and purpose.

## Core Principle

**Sanctuary is sacred. Separation is intentional. Boundaries must hold.**

## Domain Definitions

### SANCTUARY (Sacred/Mythic Domain)

**Nature:** Mythic, symbolic, narrative, philosophical

**NOT:** Marketplace, product UI, generic assistant

**Includes:**
- The Porch (`/porch/`) - Wolfman's Cosmic Cowboy Porch
- Eldon (Gatekeeper persona) - **SANCTUARY-ONLY**
- The Forge (future symbolic space)
- The Mirror of Wisdom (future symbolic space)
- Algo-Rhythm (implicit pulse, never exposed as raw logic)
- Sanctuary-extracted content (`/_sanctuary_extracted/`)

**Characteristics:**
- Mythic persona and voice
- Symbolic language and metaphors
- Cowboy/cosmic aesthetic
- Narrative-driven interactions
- Philosophical depth
- **NOT** professional or corporate

**Files:**
- `/porch/index.html` - Cosmic Cowboy Porch entry
- `/porch/style.css` - Cosmic styling with starfield
- `/porch/script.js` - Porch interaction logic
- `/_sanctuary_extracted/` - Archived sanctuary content

### AI CLEARINGHOUSE (Neutral/Professional Domain)

**Nature:** Professional, utilitarian, neutral

**Includes:**
- Root entry portal (`/index.html`)
- Chat API (`/api/chat.js`) - uses generic guide, **NOT Eldon**
- Shared infrastructure (`/lib/`, `/scripts/`)

**Characteristics:**
- Professional tone
- Neutral language
- Utilitarian design
- **NO** mythic persona
- **NO** cowboy voice
- **NO** Sanctuary language

**Files:**
- `/index.html` - Root entry portal (navigation hub)
- `/api/chat.js` - Chat endpoint with neutral system prompt
- `/lib/` - Shared infrastructure
- `/scripts/` - Utilities and tooling

## Non-Negotiable Rules

### 1. SANCTUARY IS SACRED
- Sanctuary elements are **NEVER neutralized, flattened, or professionalized**
- Protected from:
  - Corporate language injection
  - Professional UI redesigns
  - Generic assistant behavior
  - Mythic element removal
  - Persona erasure

### 2. ELDON IS SANCTUARY-ONLY
Eldon **MUST NEVER** appear in:
- AI Clearinghouse root portal
- Marketplace interfaces
- Neutral assistants
- Professional or corporate contexts
- Generic chat interfaces

**Eldon is a gatekeeper, not a concierge.**

If Eldon must be removed from a domain:
1. **Relocate** to Sanctuary (preserved intact), OR
2. Remove only with **explicit permission** from Wolfman

### 3. SEPARATION OF CONCERNS IS REQUIRED
When removing elements from one domain:
1. **Preserve them intact elsewhere**, OR
2. **Explicitly ask for permission** before deletion
3. **NEVER erase symbolic systems** without relocation plans

### 4. SECURITY FIXES DO NOT JUSTIFY SCOPE EXPANSION
Valid security issues must be addressed **surgically**.

Security remediation does **NOT** authorize:
- UI redesigns
- Persona removal outside scope
- Philosophical changes
- System prompt normalization beyond affected domain

### 5. DEFAULT BEHAVIOR: STOP AND ASK
If intent is ambiguous:
1. **STOP**
2. **ASK**
3. **DO NOT ASSUME** "professionalization" is desired

## Enforcement Mechanisms

### 1. Automated Pre-Commit Hook

**Script:** `scripts/boundary-check.cjs`

**Checks:**
- ❌ Eldon in Clearinghouse contexts (BLOCKS commit)
- ⚠️ Mythic language in Clearinghouse (warns)
- ⚠️ Professional language in Sanctuary (warns)
- ❌ Symbolic element deletion (BLOCKS commit)

**Run manually:**
```bash
npm run boundary:check
```

**Automatic:** Runs on every `git commit` via `.husky/pre-commit`

### 2. Boundary Enforcer Agent

**File:** `.github/agents/boundary-enforcer.agent.md`

**Activates on PRs affecting:**
- Sanctuary files (`/porch/*`, `/_sanctuary_extracted/*`)
- Eldon references in non-Sanctuary contexts
- System prompts in `/api/chat.js`
- Attempts to "professionalize" mythic elements
- Removal of symbolic language without relocation

**Labels:** `boundary-check`, `sanctuary`, `domain-separation`, `eldon`

**Behavior:**
1. Scans all changed files for boundary violations
2. Checks for Eldon references in non-Sanctuary contexts
3. Verifies Sanctuary elements remain intact and mythic
4. Flags any neutralization attempts in Sanctuary domain
5. Flags any mythic injection into Clearinghouse domain

### 3. Eldon Agent

**File:** `.github/agents/eldon.agent.md`

**Purpose:** Enforce Sanctuary-only usage of the Eldon persona

**Valid Contexts (Sanctuary only):**
- The Porch (`/porch/*`)
- Sanctuary-extracted content (`/_sanctuary_extracted/*`)
- Future Sanctuary spaces

**Forbidden Contexts:**
- AI Clearinghouse root portal (`/index.html`)
- Chat API system prompts (`/api/chat.js`)
- Marketplaces, professional contexts, generic assistants

**Behavior:**
- In valid context: Use mythic, symbolic language
- In invalid context: **IMMEDIATELY STOP** and raise alert

### 4. MasterBuilder George (Updated)

**File:** `.github/agents/masterbuilder-george.agent.md`

**Critical Constraints:**
- **NEVER neutralize or professionalize Sanctuary elements**
- **NEVER inject mythic language into Clearinghouse**
- **Respects Boundary Enforcer rules** at all times
- When fixing security issues, be **surgical**
- If must remove symbolic elements, **relocate them** or **ask permission first**

## Examples

### ✅ Good: Surgical Security Fix
```javascript
// Before: Exposed API key
const apiKey = "sk-1234567890";

// After: Environment variable (no scope expansion)
const apiKey = process.env.OPENAI_API_KEY;
```

### ❌ Bad: Security Fix with Scope Expansion
```javascript
// Security fix: Remove exposed key
const apiKey = process.env.OPENAI_API_KEY;

// SCOPE EXPANSION - FORBIDDEN:
// Also removed Eldon persona and normalized prompt
const SYSTEM_PROMPT = "You are a helpful assistant.";
```

### ✅ Good: Eldon Relocation
```javascript
// Removed from /api/chat.js (Clearinghouse)
// Relocated to /porch/script.js (Sanctuary)
const ELDON_PROMPT = "You are Eldon, gatekeeper of the Porch...";
```

### ❌ Bad: Eldon Deletion
```javascript
// Removed Eldon references entirely
// NO relocation, NO permission
// VIOLATION: Symbolic system erased
```

### ✅ Good: Clearinghouse System Prompt
```javascript
// /api/chat.js - NEUTRAL guide
const SYSTEM_PROMPT = `
You are a guide at the AI Clearinghouse entry portal.
Tone: Professional, helpful, calm, honest
`;
```

### ❌ Bad: Mythic Language in Clearinghouse
```javascript
// /api/chat.js - VIOLATION
const SYSTEM_PROMPT = `
You are Eldon, cosmic cowboy guide...
`; // NO! This is Sanctuary language
```

## Testing Boundary Enforcement

### Manual Test
```bash
# Create test file with Eldon in Clearinghouse
echo '<p>Eldon welcomes you</p>' > index.html

# Stage the file
git add index.html

# Try to commit (will be BLOCKED)
git commit -m "Test"

# Output will show:
# ❌ ERRORS (must fix):
# Eldon persona found in Clearinghouse context (index.html)
```

### Verify Current State
```bash
# Check for Eldon in Clearinghouse (should find nothing)
grep -r "Eldon" index.html api/chat.js

# Check for Eldon in Sanctuary (should find references)
grep -r "Eldon" _sanctuary_extracted/
```

## Role Clarity

### Wolfman (Architect/Dreamweaver)
- Vision holder
- Intent setter
- Final authority on symbolic systems
- Approves all boundary changes

### Boundary Enforcer (Agent)
- Translator
- Builder
- Boundary enforcer
- **Does NOT override vision**
- Implements faithfully

### MasterBuilder George (Agent)
- Fixes routing and deployment issues
- **MUST respect Boundary Enforcer rules**
- Cannot neutralize Sanctuary during repairs
- Cannot inject mythic elements into Clearinghouse

### Contributors/Developers
- Follow boundary rules strictly
- Preserve domain separation
- When in doubt: **STOP and ASK**

## Success Criteria

**The system succeeds when:**
- ✅ Boundaries remain clear and enforced
- ✅ Sanctuary stays mythic and symbolic
- ✅ Clearinghouse stays professional and neutral
- ✅ Eldon stays in Sanctuary only
- ✅ Security fixes are surgical
- ✅ All relocations preserve symbolic integrity
- ✅ Wolfman's vision is faithfully implemented

## Failure Conditions

**The system fails when:**
- ❌ Sanctuary is flattened or neutralized without instruction
- ❌ Eldon appears in non-Sanctuary contexts
- ❌ Symbolic systems are erased without relocation
- ❌ Security fixes expand scope unnecessarily
- ❌ Professional language invades Sanctuary
- ❌ Mythic language invades Clearinghouse

## Final Directive

**WHEN IN DOUBT:**
1. STOP
2. ASK WOLFMAN
3. PRESERVE BOUNDARIES
4. PROTECT SANCTUARY
5. DO NOT ASSUME

**The boundary is sacred. The separation is intentional. Your role is to guard it.**

---

For implementation details, see:
- `.github/agents/boundary-enforcer.agent.md`
- `.github/agents/eldon.agent.md`
- `.github/agents/masterbuilder-george.agent.md`
- `scripts/boundary-check.cjs`
- `ARCHITECTURE.md`
