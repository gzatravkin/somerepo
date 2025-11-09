# 🍽️ Dungeon Delights

A unique blend of **restaurant management** and **roguelike dungeon crawler**! Run a fantasy tavern that serves dishes made from ingredients looted from dangerous dungeons. Mix medieval fantasy with modern weapons in a post-apocalyptic setting.

## 🎮 Game Overview

### Two Game Modes

**🏠 Restaurant Mode (Management)**
- Manage your tavern kitchen with multiple cooking stations
- Serve customers with varying patience levels and preferences
- Cook 12 unique recipes using dungeon-sourced ingredients
- Earn money and reputation to unlock advanced recipes
- Upgrade your restaurant capabilities

**⚔️ Expedition Mode (Roguelike Dungeon Crawler)**
- Explore procedurally generated tile-based dungeons
- Combat 9 different enemy types that actively shoot back
- Wield 12 weapons (fantasy + modern): swords, bows, pistols, rifles, magic wands
- Loot corpses for rare food ingredients
- Progress through multiple dungeon floors with increasing difficulty

### The Core Loop
1. Start in your restaurant
2. Customers arrive wanting specific dishes
3. Need ingredients? Go on an expedition!
4. Fight enemies in the dungeon
5. Loot corpses to collect ingredients
6. Return to restaurant with your haul
7. Cook dishes and serve customers
8. Earn money and reputation
9. Unlock new recipes and repeat!

---

## 🎯 Features

### Restaurant Management
- **Real-time cooking system** with visual progress bars
- **5 customer types**: Adventurers, Merchants, Nobles, Soldiers, Wizards
- **Patience mechanics**: Serve quickly for bigger tips!
- **Recipe progression**: 4 starter recipes → 12 total recipes to unlock
- **Money & reputation economy**

### Dungeon Combat
- **Tile-based grid movement** with smooth pixel interpolation
- **9 enemy types with unique AI**:
  - Fantasy: Goblin, Orc, Skeleton, Zombie, Demon
  - Modern: Soldier, Robot, Mutant, Cultist
- **12 weapons across categories**:
  - Melee: Sword, Dagger
  - Fantasy Ranged: Bow, Crossbow, Staff, Magic Wand
  - Modern Guns: Pistol, Shotgun, Rifle, SMG, Sniper
  - Special: Flamethrower
- **Enemies actively shoot at you** within aggro range
- **Corpse looting system** for ingredient collection

### Recipes
**Starter Recipes:**
- Goblin Stew, Orc Roast, Bone Broth, Soldier Sandwich

**Advanced (50+ reputation):**
- Demon Curry, Mutant Burger, Robot Oil Soup

**Premium (100+ reputation):**
- Mystery Meat Pie, Zombie Pizza, Cultist Salad

**Legendary (200+ reputation):**
- Fantasy Feast, Wasteland Special

---

## 🎮 Controls

### Restaurant Mode
- **Mouse**: Click to interact with UI
- **Cook**: Click recipe cards to start cooking
- **Serve**: Click "Serve [Dish]" buttons on customers
- **Expedition**: Click "Start Expedition" to enter dungeon

### Expedition Mode
- **WASD / Arrow Keys**: Move through dungeon
- **Mouse**: Aim weapon
- **Left Click (Hold)**: Shoot
- **E**: Loot nearby corpse
- **1-7**: Switch weapons
- **Return Button**: Go back to restaurant with loot

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Play Online
[Live Demo](#) *(add your deployment URL)*

---

## 📂 Project Structure

```
src/
├── components/
│   ├── GameOptimized.tsx      # Expedition mode (dungeon crawler)
│   ├── Restaurant.tsx          # Restaurant management UI
│   ├── svg/                    # SVG art components
│   │   ├── SVGTile.tsx        # Dungeon tiles
│   │   ├── SVGPlayer.tsx      # Player character
│   │   ├── SVGEnemy.tsx       # Enemy sprites
│   │   ├── SVGCorpse.tsx      # Lootable corpses
│   │   └── SVGRogueProjectile.tsx
│   └── ...
├── systems/
│   ├── dungeonGenerator.ts    # Procedural dungeon generation
│   ├── weapons.ts             # Weapon configurations
│   ├── enemyConfigs.ts        # Enemy stats and behaviors
│   ├── foodIngredients.ts     # Ingredient definitions
│   ├── recipes.ts             # Recipe system
│   └── customerSystem.ts      # Customer AI and serving
├── types.ts                   # TypeScript type definitions
└── App.tsx                    # Main app with mode switching
```

---

## 🎨 Game Design

### Visual Style
- **Hand-crafted SVG sprites** for all characters and enemies
- **Pixel-perfect tile-based dungeon** rendering
- **Dark fantasy tavern aesthetic** for restaurant
- **Color-coded ingredients** for easy recognition

### Progression System
- **Reputation unlocks recipes**: Higher reputation = better dishes
- **Money economy**: Earn from serving, spend on (future) upgrades
- **Floor progression**: Deeper dungeons = tougher enemies
- **Persistent inventory**: Keep ingredients between expeditions

### Balance Philosophy
- Fast-paced combat encouraging active dodging
- Risk/reward: Deeper floors = rarer ingredients
- Customer patience creates urgency in restaurant
- No permadeath: Return to restaurant anytime

---

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **SVG** - All game graphics
- **RequestAnimationFrame** - Game loop

---

## 📋 Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed upcoming features.

**Next Priority Features:**
1. Save/Load System
2. Restaurant Upgrades (more cooking slots, faster cooking)
3. Boss Fights
4. Weapon Upgrade System
5. Difficulty Scaling

---

## 🤝 Contributing

Contributions welcome! Please:
1. Check [ROADMAP.md](ROADMAP.md) for planned features
2. Create feature branch: `feature/your-feature`
3. Write tests for new systems
4. Follow existing code style
5. Submit PR with description

---

## 📝 Game Mechanics Deep Dive

### Restaurant Economics
- **Base dish prices**: 15-120 gold per dish
- **Tips**: 10-40 gold (based on customer type and service speed)
- **Reputation gains**: 4-30 per satisfied customer
- **Reputation loss**: -10 per unhappy customer

### Combat Balance
- **Player health**: 100 HP (no regeneration in dungeon)
- **Enemy health**: 25-100 HP (scales with type)
- **Weapon damage**: 12-80 per shot
- **Enemy damage**: 10-25 per hit
- **Fire rates**: 100-1500ms between shots

### Dungeon Generation
- **Size**: 60x40 tiles
- **Rooms**: 6-12 per floor
- **Enemies**: 1-3 per room
- **Corridors**: L-shaped connections between rooms

---

## 🐛 Known Issues

See [ROADMAP.md - Bug Fixes](ROADMAP.md#bug-fixes--technical-debt) for current bugs and technical debt.

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🙏 Credits

- **Game Design & Programming**: Built with Claude Code
- **Art Style**: Hand-crafted SVG sprites
- **Setting**: Fantasy + Post-Apocalyptic fusion

---

## 🎮 Tips for New Players

1. **Start simple**: Master Goblin Stew and Bone Broth first
2. **Watch patience**: Serve nobles quickly for big tips!
3. **Stock up**: Collect ingredients before returning
4. **Weapon variety**: Each weapon has different strengths
5. **Room clearing**: Clear one room at a time, don't rush
6. **Reputation matters**: Focus on customer satisfaction early
7. **Experiment**: Try different weapon combinations in dungeons

---

**Ready to start your culinary adventure? Install and run to begin!** 🍖⚔️
