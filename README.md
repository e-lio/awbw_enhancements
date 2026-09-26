# AWBW Enhancements (AI-Enhanced Fork)

> **⚠️ Disclaimer & Notice:** All changes and features added in this fork (`e-lio`) were **AI-driven** (developed in collaboration with Antigravity AI pair programming) and have only been **somewhat / lightly tested**. Furthermore, while I can say I have good intentions, I make no promises on good upkeep of this repo. #slop #notarealdev
>
> **🙏 Credits:** This repository builds upon the incredible work of previous authors:
> - **Original Author & Creator:** [kbuzsaki](https://github.com/kbuzsaki) (*saltor* on AWBW Discord) — Created the original [AWBW Enhancements](https://github.com/kbuzsaki/awbw_enhancements) extension, Moveplanner Plus, damage calculator integration, replay hotkeys, and core AWBW hooks.
> - **Major Fork Author:** [carsonhu](https://github.com/carsonhu) (*darthnoob* on AWBW Discord) — Authored the [carsonhu/awbw_enhancements](https://github.com/carsonhu/awbw_enhancements) fork, introducing the Tree-Based Snapshot System, Quick Action Hotkeys (note: I changed the hotkey defaults), Weather Toggle, Automatic Unit Repair, Hachi cost modifiers, and Firefox support.

"AWBW Enhancements" is a browser extension that adds powerful tools, move planning aids, statistics tracking, and quality-of-life improvements to [Advance Wars By Web](https://awbw.amarriner.com).

---

## 📦 Installation Guide

> **⚠️ Note:** If you have the original AWBW Enhancements extension installed from the Chrome Web Store or Firefox Add-ons, **disable or remove it first** to prevent shortcut and content script conflicts.

### Chrome / Edge / Brave / Opera (Chromium)

1. **Download the code:** Clone this repository or download it as a ZIP file and extract it.
2. **Open Extensions:** Go to `chrome://extensions` (or `edge://extensions`).
3. **Enable Developer Mode:** Toggle **Developer mode** in the top right.
4. **Load Unpacked:** Click **Load unpacked** and select the folder containing `manifest.json`.

### Firefox

1. **Download the code:** Clone or download and extract this repository.
2. **Build Manifest:**
   - Run `make ff` (or copy `manifests/manifest_ff.json` over `manifest.json`).
3. **Open Debugging:** Go to `about:debugging` in Firefox.
4. **Load Temporary Add-on:** Click **This Firefox** -> **Load Temporary Add-on...** and select `manifest.json`.

---

## 🚀 Features Added in This Fork (e-lio)

### 🏹 Visual Unit Movement Tracers (Arrows & Circles)
- **Directional SVG Tracers:** When moving units during planning, a thin orange line (`#ff9900`) and directional arrowhead point from the unit's starting square to its destination.
- **Start Location Markers:** A small orange circle marks the original starting location of each moved unit.
- **Clean Alpha Blending:** SVG tracers are rendered on a master container with `65%` opacity, preventing overlapping circles, lines, and arrowheads from creating ugly double-exposed dark spots.
- **Dynamic Cleanup:** Tracers update dynamically as units move, automatically clear when units are unwated or return to their starting square, and reset on turn start.

### 🔷 2-Turn Movement Range Highlight Overlay
- **2-Turn Planning Matrix:** Shows where a unit could reach on its next turn (in two turns total) by executing a secondary BFS movement search from every square reachable on turn one.
- **Distinct Outer Styling:** Highlights 2-turn tiles in a soft 15% opacity cyan fill (`rgba(67, 217, 228, 0.15)`) with an outer boundary border, clearly distinguishing them from the 1-turn movement range.

### ⚡ Smarter CO Power Activator & Tag-Team Auto-Selection
- **Auto Active Player Default:** Opening Move Planner from an active game automatically defaults the AWBW Power Activator army selector to the active player whose turn it is (instead of always defaulting to Player 1).
- **Auto Turn Transitions:** Ending turn in Move Planner automatically advances the Power Activator to the next active player.
- **Smart CO Matching:** Scans available COP/SCOP dropdown options using case-insensitive, alphanumeric-cleaned matching (supporting single COs, Tag Teams like `Drake/Olaf`, and special COs like `Von Bolt`). Defaults to selecting SCOP if both COP and SCOP options are available.

### ✏️ Manual CO Power Charge Editing Modal
- **Click to Edit Charge:** Click anywhere on a player's COP/SCOP power bar to pop up a dark-mode charge editing dialog.
- **Funds & Stars Input:** Enter charge directly in **Funds** (0 to 54,000 G, where 9,000 G = 1 Star) with live star conversion hints (`= X.XX Stars`).
- **Quick Presets:** One-click preset buttons for `Clear (0 G)`, `Full COP`, and `Full SCOP`.
- **Keyboard & Action Confirmation:** Confirm with **OK** (or `Enter` key) or discard with **Cancel** (or `Esc` key / backdrop click). Immediately updates power bar graphics and patches page script variables.

### 🎛️ Top Panel Runtime Settings Toggles
- **Inline Header Checkboxes:** Adds "Show 2-Move Range" and "Show Movement Arrows" checkboxes to the top Move Planner header panel in their own dedicated column on the far right.
- **Instant Board Updates:** Toggling checkboxes updates board overlays dynamically at runtime and persists preferences via `chrome.storage.sync`.

### 🐛 Fog of War Starting Charge Fix
- **Baseline Load Protection:** Fixed a bug where opening Move Planner from an active Fog of War game drained both players' starting CO power meters on initial page parse.

---

## 🛠️ Features Introduced in Carson Hu's Fork

### 🌳 Tree-Based Save/Load Snapshot System
- **Branching Strategy Exploration:** Visualizes snapshots in an interactive tree view (custom SVG renderer), allowing you to branch play and explore multiple tactical variations.
- **Tree File Import/Export:**
  - **Save Tree:** Export your entire snapshot tree to a JSON file.
  - **Load Tree:** Load a saved snapshot tree to resume analysis anytime.
- **Node Management:** Toggle, restore, or delete individual snapshot nodes directly from the visualizer.

### ⌨️ Quick Action Hotkeys & Building Hotkeys
Comprehensive keyboard shortcuts for Move Planner actions:
- **Quick Move (`G`)** — Move a unit (or hold `G` to drag and drop).
- **Quick Capture (`V`)** — Set Infantry/Mech as capturing.
- **Quick Wait (`W`)** — Wait a unit.
- **Quick Unwait (`X`)** — Unwait a unit.
- **Quick Remove (`R`)** — Remove a unit from the board.
- **Convert Property Army (`F`)** — Convert building to your army's color.
- **Convert Property Neutral (`N`)** — Convert building to neutral.
- **Set HP (`1-0`)** — Set unit HP (1–9 for 1–9 HP, 0 for 10 HP).
- **End Turn (`P`)** — End your turn.
- **Toggle Calculator (`C`)** — Open/close the damage calculator.

#### Building Quick Build Hotkeys (Hover over property):
- **Bases:** Infantry (`Q`), Recon (`W`), Artillery (`E`), Tank (`R`), Anti-Air (`T`).
- **Airports:** T-Copter (`Q`), B-Copter (`W`), Fighter (`E`), Bomber (`R`), Stealth (`T`).
- **Ports:** Black Boat (`Q`), Lander (`W`), Cruiser (`E`), Sub (`R`), Battleship (`T`).
- *(Custom hotkeys can also be configured for Mech, Md. Tank, Neotank, Megatank, Piperunner, APC, etc.)*

### 🌦️ Weather Toggle
- Toggle weather between **Clear**, **Rain**, and **Snow** directly in Move Planner to evaluate how weather affects movement costs and range previews.

### 🏥 Automatic Property Repairs
- Units resting on Cities, Bases, Ports, and Airports are automatically repaired at turn start, applying repair costs and updating unit HP.

### 🏷️ Hachi Barter / Merchant Union Cost Modifiers
- Dynamically reduces unit build costs in the build menu when Hachi activates Barter (COP) or Merchant Union (SCOP).

---

## 🛡️ Core Original Features (kbuzsaki)

1. **Moveplanner Plus Sidebar:**
   - Real-time player statistics panels showing income, unit count, unit value, and funds.
   - Automatic income simulation for future turns and fund deduction when building units.
2. **Move Range Previewer:** Preview movement and attack ranges for selected units.
3. **Replay Shortcuts:** Keyboard shortcuts for navigating replay turns and actions.
4. **Menu Opacity Controls:** Adjust opacity for the action menu and build menu.
5. **Move Planner Bug Fixes:**
   - Fixes moved units displaying as unwaited.
   - Fixes "Unwait All" button skipping certain units.
   - Fixes damage calculator selection for newly built units.
   - Fixes visual capture icon bugs and Black Boat sprite corruption on savestate upload.

---

## 💻 Building & Development

The repository uses simple makefiles to merge common manifests for Chrome and Firefox targets:

```bash
# Build for Chrome / Chromium
make chrome

# Build for Firefox
make ff
```

---

## 📷 Screenshots

Here is an example of the Move Planner with AWBW Enhancements:
![screenshot of moveplanner plus](docs/images/demo_new2.png)

---

## 📜 Credits & Acknowledgments

- **Original Extension Author:** [kbuzsaki](https://github.com/kbuzsaki) (*saltor* on AWBW Discord)
- **Fork Author (Tree Snapshots, Hotkeys, Repairs, Firefox):** [carsonhu](https://github.com/carsonhu) (*darthnoob* on AWBW Discord)
- **AI-Enhanced Fork Author (Tracers, 2-Turn Range, Smart Activator, Charge Modal, Fog Fixes):** [e-lio](https://github.com/e-lio) (*e-lio*)
- Special thanks to the AWBW community and developers!

Feel free to open a GitHub issue or pull request if you encounter any bugs or have feature suggestions!
