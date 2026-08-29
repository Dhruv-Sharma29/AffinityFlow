# AffinityFlow

AffinityFlow is a powerful, infinite-canvas sensemaking and diagramming tool built with React, TypeScript, and Konva. It enables users to brainstorm, organize ideas with affinity mapping, create architecture diagrams, and visually connect thoughts on an infinite digital whiteboard.

## Features

- **Infinite Canvas:** Limitless space to explore and organize your ideas.
- **Rich Elements:**
  - **Cards:** Sticky note-like cards for brain-dumping and grouping.
  - **Shapes:** Basic geometric shapes for diagramming (rectangles, circles, etc.).
  - **Connectors:** Draw lines between cards and shapes with customizable labels.
  - **Clusters:** Visually group related items together.
- **Advanced Tools:**
  - **Minimap:** A radar overview of the entire canvas to help you navigate.
  - **Sensemaking Templates:** Pre-built templates to kickstart your brainstorming sessions.
  - **Export Options:** Export your board to PDF or JSON, and import back from JSON.
- **Seamless Interactions:**
  - Zoom and pan across the canvas effortlessly.
  - Multi-select, group move, and bulk delete operations.
  - Full Undo/Redo support.
  - Sound effects for satisfying interactions (can be toggled).

## Tech Stack

- **Framework:** [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Canvas Rendering:** [Konva](https://konvajs.org/) & [React-Konva](https://github.com/konvajs/react-konva)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Exports:** [jsPDF](https://github.com/parallax/jsPDF)
- **Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

## Keyboard Shortcuts

Speed up your workflow with these handy shortcuts:

| Shortcut | Action |
| --- | --- |
| `V` | Select Tool |
| `N` | Card Tool |
| `S` | Shape Tool |
| `C` | Connector Tool |
| `G` | Cluster / Group Tool |
| `H` or `Space` | Hand / Pan Tool |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + Y` | Redo |
| `Cmd/Ctrl + E` | Export Board |
| `F` | Zoom to Fit |
| `+` / `-` | Zoom In / Out |
| `Delete` / `Backspace` | Delete Selected Item(s) |
| `Esc` | Cancel Current Action / Deselect |

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd "affinity map"
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173` to start creating!

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Type-checks and builds the app for production.
- `npm run lint`: Runs Oxlint to check for code quality.
- `npm run preview`: Previews the production build locally.

## License

This project is licensed under the terms of the LICENSE file included in the repository.
