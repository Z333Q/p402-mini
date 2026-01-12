Design style: Neo-brutalism, dev-first, bold structure

Visual preview
Primary aesthetic: High-contrast panels, thick borders, sharp hierarchy, minimal rounding. Designed for builders shipping fast and debugging 402 flows.
Colors: Black and near-white base, with a loud lime accent for actions and a cyan for links.
Typography: Modern monospace for code and payloads, sans for UI labels.
Best for: SDK docs, API reference, request inspector, playground, quickstart UI.

Signature moves

Thick 2px borders on interactive elements.

Command-palette first navigation.

Split-pane request inspector with raw headers, signatures, and facilitator response.

Example mental image
A “Call endpoint” playground. Left side shows request builder. Right side shows the full exchange with the 402 response, the PAYMENT-REQUIRED header, the computed PAYMENT-SIGNATURE, and the retry response.

<details> <summary>View complete design system</summary>

# Design System Specification

You are implementing a neo-brutalist developer tool design system characterized by high contrast, strong borders, fast affordances, and code-forward surfaces. Follow these exact specifications for all UI components.

## Core Visual Language
Principles:
- Obvious affordances: buttons and inputs look clickable.
- Debug-first: raw data is a first-class citizen.
- Keyboard-first: every key flow supports shortcuts.
- Opinionated: no ambiguous states, show clear success or failure.

## Color Palette

### Primary Colors
- Primary: #B6FF2E  Use for primary actions, selected states.
- Primary-hover: #A0E626
- Primary-light: #E9FFD0  Subtle highlights.

### Neutral Scale
- neutral-50:  #FFFFFF
- neutral-100: #F5F5F5
- neutral-200: #E6E6E6
- neutral-300: #CFCFCF
- neutral-400: #A8A8A8
- neutral-500: #7A7A7A
- neutral-600: #4A4A4A
- neutral-700: #2B2B2B
- neutral-800: #141414
- neutral-900: #000000

### Semantic Colors
- success: #22C55E
- warning: #F59E0B
- error:   #EF4444
- info:    #22D3EE

### Special Effects
- gradient-1: none
- shadow-sm: none
- shadow-md: none
- shadow-lg: none
- blur-effect: none
- special-effect-1: border: 2px solid #000000 on all interactive components.

## Typography System

### Font Stack
UI: font-family: IBM Plex Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
Code: font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace;

### Type Scale
- text-xs: 0.75rem / 1rem
- text-sm: 0.875rem / 1.25rem
- text-base: 1rem / 1.5rem
- text-lg: 1.125rem / 1.75rem
- text-xl: 1.25rem / 1.75rem
- text-2xl: 1.5rem / 2rem
- text-3xl: 1.875rem / 2.25rem
- text-4xl: 2.25rem / 2.5rem
- text-5xl: 3rem / 1.1

### Font Weights
- Headings: 700
- Body: 500
- UI elements: 700
- Emphasis: 800

## Spacing System
Base unit: 8px

### Scale
- space-0: 0
- space-1: 4px
- space-2: 8px
- space-3: 12px
- space-4: 16px
- space-5: 20px
- space-6: 24px
- space-8: 32px
- space-10: 40px
- space-12: 48px
- space-16: 64px

## Component Specifications

### Buttons
Primary Button
padding: 10px 14px
border-radius: 0px
font-weight: 800
text-transform: uppercase
transition: transform 80ms ease-out
background: #B6FF2E
color: #000000
border: 2px solid #000000

Hover
transform: translateY(-2px)

Active
transform: translateY(0px) scale(0.99)

Secondary Button
background: #FFFFFF
color: #000000
border: 2px solid #000000

### Input Fields
height: 44px
padding: 10px 12px
border: 2px solid #000000
border-radius: 0px
background: #FFFFFF
transition: none

Focus
outline: 3px solid #22D3EE
outline-offset: 2px

### Cards
padding: 16px
border-radius: 0px
background: #FFFFFF
border: 2px solid #000000

### Code Blocks
- Background: #141414
- Text: #F5F5F5
- Border: 2px solid #000
- Copy button: top-right, always visible
- Line wrap: off by default, toggle on

### Layout Principles
- Container max-width: 1280px
- Grid columns: 12
- Grid gap: 16px
- Section padding: 48px top and bottom
- Mobile breakpoint: 640px
- Tablet breakpoint: 1024px
- Desktop breakpoint: 1280px

## Animation Guidelines
- Keep motion minimal.
- Use transform-only animations for performance.

Durations
- fast: 80ms
- normal: 150ms

## Implementation Rules

DO:
- Use thick borders and uppercase labels on primary actions.
- Provide keyboard shortcuts list on every complex page.
- Always show raw headers and payloads next to “pretty” view.
- Provide a single “Copy cURL” and “Copy fetch” action everywhere.

DON’T:
- Use subtle shadows as hierarchy.
- Hide copy actions behind hover.
- Over-round corners.

Accessibility Requirements
- Minimum contrast: 7:1 on white and black surfaces
- Focus indicators: visible outline, never removed
- Touch targets: 44px minimum
- Motion preferences: reduce hover lifts to 0px

## Visual Hierarchy System
- Level 1: 36px uppercase page title
- Level 2: 18px section headers with border-bottom 2px solid #000
- Level 3: 14 to 16px body, weight 500
- Labels use monospace for ids, tx hashes, request ids

## Iconography System
- Style: outlined
- Stroke: 2px
- Grid: 20px
- Icons only next to labels, never alone on critical buttons.

## Interaction States
Disabled: background #E6E6E6, opacity 1, text #4A4A4A, border stays 2px solid #000
Loading: inline bar at top of panel, 4px height, color #22D3EE

## Responsive Behavior
- Mobile: collapse split panes into tabs: Request, 402, Payment, Response, Logs
- Desktop: always show split-pane for inspector.

## Content & Messaging
Voice: direct, technical, no fluff.
Microcopy:
- Success: “Payment verified.”
- Error: “Payment rejected. See facilitator response.”
- Empty: “No events yet. Send a request from the playground.”

## Code Examples

Component example (Split Pane Inspector)
HTML structure:
<div class="pane">
  <div class="pane-left">Request Builder</div>
  <div class="pane-right">Inspector</div>
</div>

CSS:
.pane { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pane-left, .pane-right { border: 2px solid #000; padding: 16px; background: #fff; }

