# Design System & Theme Engine
**EduFlow SaaS Platform**

---

## 🎨 Global Theme Engine Architecture

Theme preference states are managed globally and synchronized dynamically across both frontend storage buffers and backend database profiles.

```
+--------------+        useTheme()        +--------------------+
|  UI Toggle   | ➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔➔  |  Zustand Store     |
+--------------+                          +--------------------+
                                                     │
                                                     ▼
+--------------+      database update                │
|  Laravel DB  | 🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠🡠  │
+--------------+   api.put('/auth/theme')            ▼
                                          +--------------------+
                                          |   localStorage     |
                                          +--------------------+
```

---

## 🪙 Design Tokens (CSS Variables)

Colors are managed exclusively via custom CSS properties defined inside `:root` of `frontend/src/index.css`:

```css
:root {
  --primary: 108 99 255;          /* Electric violet */
  --accent: 0 212 170;            /* Teal */
  --bg-base: 250 250 255;         /* Light Background */
  --bg-surface: 255 255 255;      /* Light Card */
  --text-primary: 15 14 35;
  --text-secondary: 99 98 126;
  --border: 226 225 240;
}

.dark {
  --bg-base: 10 9 25;             /* Dark Background */
  --bg-surface: 18 17 38;         /* Dark Card */
  --text-primary: 240 239 255;
  --text-secondary: 168 166 200;
  --border: 38 36 70;
}
```

---

## 🛠️ Reusable Components

All UI components (Buttons, Inputs, Cards, Tables, Dropdowns, Skeletons) must dynamically adapt to theme states using utility variables:

- **Background**: `bg-[rgb(var(--bg-surface))]`
- **Text**: `text-[rgb(var(--text-primary))]`
- **Borders**: `border-[rgb(var(--border))]`
- **Transitions**: Theme transitions are animated smoothly (250ms base duration) with zero visual layouts shift or page flickers.
