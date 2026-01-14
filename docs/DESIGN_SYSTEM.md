# Design System

## Overview

The **Invoice Reader AI** follows a "Flux" design philosophy: utility-first, cleaner, flatter, and bolder. It leverages **Material Design 3** (M3) principles for its foundation, particularly the color system and elevation model, but adapts them for a dense, productivity-focused desktop interface.

## 🎨 Color Palette (Material Design 3)

The application uses dynamic semantic color tokens defined in `src/styles/index.css` and mapped in `tailwind.config.js`.

### Color Roles

| Token               | Light Mode Value      | Dark Mode Value      | Usage                                       |
| :------------------ | :-------------------- | :------------------- | :------------------------------------------ |
| `primary`           | `#2551b8` (Aura Blue) | `#a8c7fa` (Blue 200) | Key CTA, active states, progress bars       |
| `on-primary`        | `#ffffff`             | `#002568`            | Text on primary backgrounds                 |
| `primary-container` | `#e0e7ff`             | `#003a94`            | Lower emphasis fills (e.g., selected chips) |
| `surface`           | `#fef7ff`             | `#141218`            | Default page background                     |
| `surface-container` | `#f3edf7`             | `#211f26`            | Card backgrounds, modest contrast           |
| `surface-bright`    | `#fef7ff`             | `#3b383e`            | Highlighted areas                           |
| `error`             | `#b3261e`             | `#f2b8b5`            | Error messages, destructive actions         |
| `outline`           | `#79747e`             | `#938f99`            | Low emphasis borders                        |
| `outline-variant`   | `#cac4d0`             | `#49454f`            | Dividers, disabled borders                  |

### Dark Mode Strategy

- **True Black vs. Grey**: We use `#141218` (M3 Dark) as the base, not `#000000`.
- **Elevation Overlays**: In dark mode, elevation is expressed via semi-transparent white overlays (5% - 16%) rather than shadows.
- **Contrast**: Text colors use `on-surface` (`#1d1b20` / `#e6e1e5`) to ensure WCAG 2.1 AA compliance.

## ✒️ Typography

We use a dual-font stack to establish hierarchy and readability.

- **Headings**: `Merriweather` (Serif). Used for `h1` through `h6`. Adds a touch of formality and editorial feel.
- **Body**: `Inter` (Sans-serif). Used for all interface text, tables, and inputs. selected for its excellent legibility at small sizes.

```css
/* Tailwind Class Mappings */
font-sans -> "Inter", sans-serif
font-serif -> "Merriweather", serif
```

## 🧱 Layout & Spacing

### Grid System

- **Desktop**: Flexible 12-column logic, typically split into sidebar/main or card grids.
- **Mobile**: Single column stack with full-width inputs (`text-base` to prevent iOS zoom).

### Rounding (Shape System)

- **XS (`rounded-m3-xs`)**: 4px - Text inputs, Menu items
- **SM (`rounded-m3-sm`)**: 8px - Chips, Menus
- **MD (`rounded-m3-md`)**: 12px - Cards, Dialogs
- **LG (`rounded-m3-lg`)**: 16px - Large Containers

## 🧩 Core Components

### `ValidatedInput`

A wrapper around standard inputs that handles:

- Floating logic (label positioning).
- Error checking (red border + helper text).
- Success states.

### `ThemeToggle`

A specialized button that switches between `light` and `dark` classes on the `<html>` element. Persists preference to `localStorage`.

### `LogisticsSection`

A complex organism that handles:

- Package types (Pallets, Cartons).
- Weight/Measurement inputs.
- "Smart Conversion" toggles (KG/LB).

## 🔮 Future Improvements

- **Motion**: Standardize transition durations (currently mixed `300ms` and `500ms`).
- **Iconography**: Fully migrate to `lucide-react` (currently partial).
