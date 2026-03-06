# 🦅 Kapmirmet — The Living Clan Tree

A highly interactive, community-driven digital clan tree for the Kapmirmet clan. Built with React, D3.js, and Framer Motion.

## Getting Started

```bash
npm install
npm run dev
```

The app will open at `http://localhost:3000`.

## Features

### 🌱 Self-Planting Branches
Anyone can add themselves to the tree, even without knowing their exact branch. Unattached entries appear as floating "seedlings" that elders can later connect.

### 🙋 Claim Your Profile
Click any person node to view their details, claim their profile, add children, photos, and memories.

### 📨 Invite Your Kin
Share invite links via WhatsApp, SMS, or email. Dedicated buttons for inviting siblings, parents, children, cousins, and elders.

### 🗺️ Zoomable Heritage Map
Google Maps-style pan and zoom. Scroll to zoom, drag to pan. Use the +/−/reset controls in the bottom-left.

### 📏 Generational Timeline
A timeline bar at the bottom spans from 1850 to Today, showing generational layers at a glance.

### 🌳 Clan Offshoots
The Kapcheboin offshoot clan renders in distinct green tones, visually separate but connected to the main trunk.

### 👑 Historical Figure Badges
Special badges highlight key ancestors:
- 👑 Founder
- 🛡️ Warrior
- 🧭 Migration Leader
- 📜 Story Keeper
- 🌱 Clan Builder

### 🦅 Founder Visualization
Mirmetin (Kipkenken) has an oversized golden node with a crown badge and eagle companion at the root of the tree.

### 🔍 Playful Search
Searching for a name returns a playful message encouraging exploration from the ancestors rather than direct lookup.

### 📜 Clan Summary Panel
An expandable panel with the clan's origin story, totem meaning (Mooi Kogos), migration history, key ancestors, and cultural practices.

## Demo Data

The tree includes ~55 people across 6 generations:
- **Generation 1 (1845):** Founder Mirmetin
- **Generation 2 (1870s):** 4 children including warriors, story keepers, and the Kapcheboin offshoot founder
- **Generation 3 (1900s):** 7 descendants
- **Generation 4 (1930s):** 9 descendants
- **Generation 5 (1960s):** 10 descendants
- **Generation 6 (1990s-2000s):** 14 descendants
- **3 seedlings** (unattached members)

## Tech Stack

- **React 18** — UI framework
- **D3.js 7** — Tree layout and SVG rendering
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Vite** — Build tool

## Project Structure

```
src/
├── App.jsx                 # Main app shell
├── main.jsx                # Entry point
├── data/
│   └── clanData.js         # Demo dataset & constants
├── hooks/
│   └── useTreeZoom.js      # D3 zoom/pan hook
├── components/
│   ├── TreeCanvas.jsx      # D3 tree visualization
│   ├── Header.jsx          # Top bar with search & actions
│   ├── PersonPanel.jsx     # Person detail side panel
│   ├── ClanStoryPanel.jsx  # Clan archive panel
│   ├── AddSelfPanel.jsx    # "Plant Yourself" form
│   ├── InvitePanel.jsx     # Invite relatives panel
│   ├── ZoomControls.jsx    # Zoom +/−/reset
│   ├── TimelineBar.jsx     # Bottom timeline
│   └── Legend.jsx          # Badge & clan legend
└── styles/
    └── global.css          # CSS variables & animations
```

## Cultural Context

- **Clan:** Kapmirmet
- **Totem:** Eagle with a white breast and black back
- **Totem Name:** Mooi Kogos
- **Origin Ancestor:** Mirmetin / Kipkenken (third name unknown)
- **Timeline:** 1850s to present
