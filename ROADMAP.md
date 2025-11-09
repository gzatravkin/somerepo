# Dungeon Delights - Development Roadmap

## Current State
- ✅ Tile-based roguelike dungeon crawler (Expedition Mode)
- ✅ Restaurant management system with cooking and customer service
- ✅ 12 weapons (fantasy + modern guns)
- ✅ 9 enemy types with shooting mechanics
- ✅ Corpse looting system for food ingredients
- ✅ 12 recipes with progression unlocking
- ✅ Customer system with 5 types and patience mechanics
- ✅ Persistent inventory between modes

---

## High Priority Features

### 1. Restaurant Upgrades & Progression
**Priority:** HIGH | **Effort:** Medium

- [ ] **Kitchen Upgrades**
  - Unlock additional cooking slots (3rd, 4th slot)
  - Faster cooking speed upgrades
  - Auto-completion notifications
  - Recipe cost reduction upgrades

- [ ] **Restaurant Expansion**
  - Increase customer capacity (5 → 8 → 10)
  - Hire NPC staff (cooks, waiters) to auto-serve
  - Unlock storage expansion for more ingredients
  - Restaurant decoration/theme system

- [ ] **Upgrade Shop UI**
  - Dedicated upgrades menu
  - Cost: Money-based purchases
  - Visual feedback when upgrades are applied

**Files to modify:**
- `types.ts` - Add upgrade types
- `components/Restaurant.tsx` - Add upgrade UI
- `systems/upgrades.ts` - New file for upgrade logic

---

### 2. Save/Load System
**Priority:** HIGH | **Effort:** Medium

- [ ] **LocalStorage persistence**
  - Save restaurant state (money, reputation, upgrades)
  - Save persistent inventory
  - Save unlocked recipes
  - Auto-save every 30 seconds

- [ ] **Multiple save slots**
  - 3 save slots
  - Display save info (money, reputation, floor reached)
  - Delete save option

- [ ] **Export/Import saves**
  - JSON export for backup
  - Share codes for showing off progress

**Files to create:**
- `systems/saveSystem.ts` - Save/load logic
- `components/SaveSlotSelector.tsx` - UI for save management

**Files to modify:**
- `App.tsx` - Load save on startup
- `components/Restaurant.tsx` - Trigger saves

---

### 3. Boss Fights & Mini-Bosses
**Priority:** HIGH | **Effort:** High

- [ ] **Boss enemies**
  - 1 boss per 5 floors
  - Unique boss types: Demon Lord, Robot Commander, Necromancer King
  - Multi-phase boss fights
  - Special attack patterns
  - Boss rooms (larger arena)

- [ ] **Boss rewards**
  - Guaranteed rare ingredient drops
  - Unlock special recipes
  - Unique weapons/upgrades

- [ ] **Elite mini-bosses**
  - Rare spawns in normal rooms
  - 2x health, unique abilities
  - Better ingredient quality

**Files to create:**
- `systems/bossConfigs.ts` - Boss definitions
- `components/svg/SVGBoss.tsx` - Boss sprites

**Files to modify:**
- `systems/dungeonGenerator.ts` - Boss room generation
- `systems/enemyConfigs.ts` - Elite modifiers
- `components/GameOptimized.tsx` - Boss fight logic

---

### 4. Difficulty Scaling & Balancing
**Priority:** MEDIUM | **Effort:** Low

- [ ] **Progressive difficulty**
  - Enemy health scales with floor (+10% per floor)
  - Enemy damage increases (+5% per floor)
  - More enemies spawn per room
  - Enemy aggro range increases

- [ ] **Player power progression**
  - Permanent upgrades from restaurant
  - Weapon damage upgrades
  - Max health increases
  - Movement speed upgrades

- [ ] **Difficulty modes**
  - Easy: 75% enemy stats, +50% money
  - Normal: Current balance
  - Hard: 150% enemy stats, +100% reputation gain

**Files to modify:**
- `systems/enemyConfigs.ts` - Scaling formulas
- `components/GameOptimized.tsx` - Apply difficulty modifiers
- `App.tsx` - Difficulty selection

---

## Medium Priority Features

### 5. Advanced Recipe System
**Priority:** MEDIUM | **Effort:** Medium

- [ ] **Recipe discovery**
  - Experiment mode: Combine any 2-3 ingredients
  - Success rate based on reputation
  - Failed dishes (burnt food) for comedy

- [ ] **Special recipes**
  - Daily specials with bonus reputation
  - Seasonal recipes (limited time)
  - Secret recipes from achievements

- [ ] **Recipe quality tiers**
  - Basic/Good/Excellent quality based on cooking time
  - Better quality = more tips
  - Burnt if cooking takes too long

- [ ] **Ingredient quality**
  - Fresh (100%), Aged (80%), Spoiled (50%)
  - Ingredients decay over time
  - Storage upgrades slow decay

**Files to modify:**
- `systems/recipes.ts` - Recipe discovery system
- `types.ts` - Add quality/freshness properties
- `components/Restaurant.tsx` - Recipe experimentation UI

---

### 6. Customer Enhancement
**Priority:** MEDIUM | **Effort:** Medium

- [ ] **Customer preferences**
  - Favorite dishes (2x tip)
  - Dietary restrictions (can't eat certain ingredients)
  - VIP customers with special requests

- [ ] **Regular customers**
  - Return after being served well
  - Reputation boost for regulars
  - Named characters with backstories

- [ ] **Customer events**
  - Food critic visits (high pressure, big rewards)
  - Group orders (serve 3+ of same dish)
  - Rush hour (2x customers for limited time)

- [ ] **Customer satisfaction system**
  - Star ratings (1-5 stars)
  - Reviews affect reputation
  - Bad reviews if served wrong dish

**Files to modify:**
- `systems/customerSystem.ts` - Enhanced customer logic
- `types.ts` - Add customer properties
- `components/Restaurant.tsx` - Display ratings

---

### 7. Weapon & Combat Enhancements
**Priority:** MEDIUM | **Effort:** High

- [ ] **Weapon upgrade system**
  - Upgrade damage, fire rate, range
  - Cost: Money from restaurant
  - Visual indicators for upgraded weapons

- [ ] **Weapon special abilities**
  - Each weapon gets unique special attack
  - Cooldown-based abilities
  - Examples: Sword dash, Shotgun knockback blast

- [ ] **Combo system**
  - Chain kills for bonus loot
  - Multiplier display
  - Combo rewards (extra ingredients)

- [ ] **Status effects**
  - Poison, Burn, Freeze, Stun
  - Certain weapons apply effects
  - Enemies can apply effects to player

**Files to modify:**
- `systems/weapons.ts` - Add upgrade system
- `types.ts` - Add weapon upgrade properties
- `components/GameOptimized.tsx` - Combo tracking

---

### 8. Dungeon Variety & Biomes
**Priority:** MEDIUM | **Effort:** High

- [ ] **Multiple biomes**
  - Dungeon (current), Forest, Desert, Ice Cave, Volcano
  - Unique enemy types per biome
  - Biome-specific ingredients
  - Visual themes (tile colors, effects)

- [ ] **Room types**
  - Treasure rooms (extra loot)
  - Challenge rooms (waves of enemies, big reward)
  - Shop rooms (buy health/ammo with money)
  - Safe rooms (no enemies, heal station)

- [ ] **Environmental hazards**
  - Lava (damage over time)
  - Spike traps
  - Moving walls
  - Poison gas clouds

- [ ] **Interactive objects**
  - Chests with loot
  - Explosive barrels
  - Doors requiring keys
  - Health fountains

**Files to modify:**
- `systems/dungeonGenerator.ts` - Biome generation
- `components/svg/SVGTile.tsx` - Biome visuals
- `types.ts` - Biome types

---

## Low Priority / Polish Features

### 9. Achievement System
**Priority:** LOW | **Effort:** Low

- [ ] **Achievement categories**
  - Combat: Kill X enemies, reach floor X
  - Restaurant: Serve X customers, earn X money
  - Collection: Collect all ingredients, unlock all recipes
  - Speedrun: Complete floor in X seconds

- [ ] **Rewards**
  - Unlock special recipes
  - Unique weapon skins
  - Title/badge display
  - Permanent stat boosts

**Files to create:**
- `systems/achievements.ts`
- `components/AchievementsPanel.tsx`

---

### 10. Audio System
**Priority:** LOW | **Effort:** Medium

- [ ] **Sound effects**
  - Weapon firing sounds
  - Enemy hit/death sounds
  - Cooking sounds (sizzle, chop)
  - Customer satisfaction sounds
  - UI clicks and notifications

- [ ] **Background music**
  - Restaurant theme (calm, medieval tavern)
  - Dungeon theme (tense, action)
  - Boss battle music
  - Victory/game over music

- [ ] **Volume controls**
  - Master, SFX, Music sliders
  - Mute toggle
  - Settings persistence

**Files to create:**
- `systems/audioSystem.ts`
- `assets/sounds/` directory
- `components/SettingsMenu.tsx`

---

### 11. Tutorial & Help System
**Priority:** LOW | **Effort:** Low

- [ ] **First-time tutorial**
  - Guided restaurant tutorial
  - First expedition walkthrough
  - Recipe cooking explanation
  - Customer serving guide

- [ ] **Help menu**
  - Controls reference
  - Game mechanics explained
  - Recipe list viewer
  - Enemy encyclopedia

- [ ] **Tooltips**
  - Hover tooltips for UI elements
  - Recipe ingredient tooltips
  - Weapon stat explanations

**Files to create:**
- `components/Tutorial.tsx`
- `components/HelpMenu.tsx`

---

### 12. Visual Polish & Effects
**Priority:** LOW | **Effort:** Medium

- [ ] **Particle effects**
  - Better muzzle flashes
  - Blood splatter on enemy death
  - Cooking steam/smoke
  - Customer mood indicators (hearts, exclamation marks)

- [ ] **Animations**
  - Player walking animation
  - Enemy death animations
  - Smooth page transitions
  - Coin/money collect animations

- [ ] **UI improvements**
  - Animated buttons
  - Screen shake on hits
  - Flash effects for critical hits
  - Minimap for dungeon

**Files to modify:**
- All SVG components
- `components/Restaurant.tsx` - Add animations
- `components/GameOptimized.tsx` - Screen effects

---

### 13. Meta Progression
**Priority:** LOW | **Effort:** High

- [ ] **Permanent upgrades**
  - Spend money between runs
  - Unlock starting weapons
  - Increase starting health
  - Better starting recipes

- [ ] **Prestige system**
  - Reset progress for permanent bonuses
  - Prestige currency
  - Unique prestige upgrades

- [ ] **Daily challenges**
  - Special modifiers (double enemies, limited weapons)
  - Leaderboard for daily scores
  - Unique rewards

**Files to create:**
- `systems/metaProgression.ts`
- `systems/dailyChallenges.ts`

---

### 14. Multiplayer / Social Features
**Priority:** LOW | **Effort:** Very High

- [ ] **Online leaderboards**
  - Highest floor reached
  - Most money earned
  - Fastest dungeon clear
  - Highest reputation

- [ ] **Co-op expedition mode**
  - 2-player dungeon runs
  - Shared loot
  - Revive system

- [ ] **Restaurant visits**
  - Visit other players' restaurants
  - Rate/review
  - Trade recipes

**Requires:**
- Backend server
- Database
- Authentication
- Real-time multiplayer infrastructure

---

## Bug Fixes & Technical Debt

### Current Known Issues
- [ ] Fix camera clamping at dungeon edges
- [ ] Optimize particle system (remove old particles)
- [ ] Balance weapon damage values
- [ ] Add error boundaries for React components
- [ ] Mobile responsive UI for restaurant
- [ ] Touch controls for expedition mode
- [ ] Performance optimization for large enemy counts

### Code Quality
- [ ] Add unit tests for game systems
- [ ] Add integration tests for game loop
- [ ] TypeScript strict mode compliance
- [ ] Extract magic numbers to constants
- [ ] Refactor large components into smaller ones
- [ ] Add JSDoc comments for complex functions

---

## Implementation Priority Order

### Phase 1 (Next Sprint)
1. Save/Load System
2. Restaurant Upgrades
3. Difficulty Scaling

### Phase 2
4. Boss Fights
5. Advanced Recipe System
6. Customer Enhancement

### Phase 3
7. Weapon Upgrades
8. Dungeon Biomes
9. Achievement System

### Phase 4 (Polish)
10. Audio System
11. Visual Polish
12. Tutorial System

### Phase 5 (Future)
13. Meta Progression
14. Multiplayer (long-term)

---

## Contributing

When implementing features:
1. Create feature branch: `feature/feature-name`
2. Update this roadmap with checkboxes
3. Write tests for new systems
4. Update type definitions in `types.ts`
5. Add inline code documentation
6. Test on both desktop and mobile
7. Create PR with detailed description

---

## Notes

- Focus on gameplay loop first (restaurant ↔ expedition)
- Balance is key - test with real playtime
- Keep SVG art style consistent
- Maintain 60 FPS performance target
- Consider accessibility (colorblind modes, keyboard-only)

Last Updated: 2025-11-09
