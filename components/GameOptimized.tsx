import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Player,
  Enemy,
  Projectile,
  Corpse,
  Particle,
  Dungeon,
  WeaponType,
  FoodIngredient,
  GameStats
} from '../types';
import { generateDungeon, isWalkable, getRandomFloorPositionInRoom } from '../systems/dungeonGenerator';
import { WEAPONS, getWeaponConfig } from '../systems/weapons';
import { ENEMY_CONFIGS, getEnemyConfig, getRandomEnemyType } from '../systems/enemyConfigs';
import { FOOD_INGREDIENTS, getFoodIngredient } from '../systems/foodIngredients';
import { SVGTile } from './svg/SVGTile';
import { SVGPlayer } from './svg/SVGPlayer';
import { SVGEnemy } from './svg/SVGEnemy';
import { SVGRogueProjectile } from './svg/SVGRogueProjectile';
import { SVGCorpse } from './svg/SVGCorpse';

interface GameProps {
  onGameOver: (score: number) => void;
  onWin: (score: number) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

const DUNGEON_WIDTH = 60;
const DUNGEON_HEIGHT = 40;
const TILE_SIZE = 32;
const MOVE_SPEED = 200; // ms between player moves
const PIXEL_MOVE_SPEED = 8; // pixels per frame for smooth movement

const GameOptimized: React.FC<GameProps> = ({ onGameOver, onWin, score, setScore }) => {
  const [gameStarted, setGameStarted] = useState(false);

  const gameState = useRef<{
    dungeon: Dungeon;
    player: Player;
    enemies: Enemy[];
    projectiles: Projectile[];
    corpses: Corpse[];
    particles: Particle[];
    stats: GameStats;
    cameraX: number;
    cameraY: number;
    keys: Set<string>;
    mouseX: number;
    mouseY: number;
    mouseDown: boolean;
  }>({
    dungeon: generateDungeon(DUNGEON_WIDTH, DUNGEON_HEIGHT),
    player: createPlayer(),
    enemies: [],
    projectiles: [],
    corpses: [],
    particles: [],
    stats: {
      enemiesKilled: 0,
      itemsCollected: 0,
      floor: 1,
      score: 0
    },
    cameraX: 0,
    cameraY: 0,
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false
  });

  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    const state = gameState.current;

    // Create initial dungeon and spawn player
    const firstRoom = state.dungeon.rooms[0];
    const spawnPos = getRandomFloorPositionInRoom(firstRoom);
    state.player.x = spawnPos.x;
    state.player.y = spawnPos.y;
    state.player.pixelX = spawnPos.x * TILE_SIZE + TILE_SIZE / 2;
    state.player.pixelY = spawnPos.y * TILE_SIZE + TILE_SIZE / 2;

    // Spawn enemies in other rooms
    for (let i = 1; i < state.dungeon.rooms.length; i++) {
      const room = state.dungeon.rooms[i];
      const numEnemies = 1 + Math.floor(Math.random() * 3);

      for (let j = 0; j < numEnemies; j++) {
        const enemyPos = getRandomFloorPositionInRoom(room);
        const enemy = createEnemy(enemyPos.x, enemyPos.y);
        state.enemies.push(enemy);
      }
    }

    setGameStarted(true);
  }, []);

  // Main game loop
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime.current;
      lastFrameTime.current = now;

      const state = gameState.current;

      // Update player movement
      updatePlayerMovement(state, deltaTime);

      // Update player shooting
      if (state.mouseDown) {
        updatePlayerShooting(state, now);
      }

      // Update enemies
      updateEnemies(state, now);

      // Update projectiles
      updateProjectiles(state, deltaTime);

      // Update particles
      updateParticles(state, deltaTime);

      // Check collisions
      checkCollisions(state);

      // Update camera to follow player
      updateCamera(state);

      // Check for game over
      if (state.player.health <= 0) {
        onGameOver(state.stats.score);
        return;
      }

      // Check for level complete
      const exitTile = state.dungeon.tiles[state.player.y][state.player.x];
      if (exitTile && exitTile.type === 'EXIT') {
        nextLevel(state);
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, onGameOver]);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys.add(e.key.toLowerCase());

      // Weapon switching
      const weaponKeys: Record<string, WeaponType> = {
        '1': 'SWORD',
        '2': 'BOW',
        '3': 'PISTOL',
        '4': 'SHOTGUN',
        '5': 'RIFLE',
        '6': 'STAFF',
        '7': 'MAGIC_WAND'
      };

      if (weaponKeys[e.key]) {
        gameState.current.player.weapon = weaponKeys[e.key];
      }

      // Loot corpse with E key
      if (e.key.toLowerCase() === 'e') {
        lootNearbyCorpse(gameState.current);
      }

      // Use food with Q key
      if (e.key.toLowerCase() === 'q') {
        useFood(gameState.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      gameState.current.mouseX = e.clientX - rect.left;
      gameState.current.mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      gameState.current.mouseDown = true;
    };

    const handleMouseUp = () => {
      gameState.current.mouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Render
  const state = gameState.current;
  const viewWidth = 800;
  const viewHeight = 600;

  return (
    <div ref={containerRef} style={{ width: viewWidth, height: viewHeight, position: 'relative', overflow: 'hidden', backgroundColor: '#1A1A1A' }}>
      <svg width={viewWidth} height={viewHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
        <g transform={`translate(${-state.cameraX}, ${-state.cameraY})`}>
          {/* Render tiles */}
          {state.dungeon.tiles.map((row, y) =>
            row.map((tile, x) => (
              <SVGTile key={`${x}-${y}`} tile={tile} tileSize={TILE_SIZE} />
            ))
          )}

          {/* Render corpses */}
          {state.corpses.map(corpse => (
            <SVGCorpse key={corpse.id} corpse={corpse} tileSize={TILE_SIZE} />
          ))}

          {/* Render projectiles */}
          {state.projectiles.map(projectile => (
            <SVGRogueProjectile key={projectile.id} projectile={projectile} />
          ))}

          {/* Render enemies */}
          {state.enemies.map(enemy => (
            <SVGEnemy key={enemy.id} enemy={enemy} tileSize={TILE_SIZE} />
          ))}

          {/* Render player */}
          <SVGPlayer player={state.player} tileSize={TILE_SIZE} />

          {/* Render particles */}
          {state.particles.map(particle => (
            <circle
              key={particle.id}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill={particle.color}
              opacity={particle.alpha}
            />
          ))}
        </g>
      </svg>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#FFF', fontFamily: 'monospace', fontSize: '14px', textShadow: '2px 2px 4px #000' }}>
        <div>Health: {state.player.health} / {state.player.maxHealth}</div>
        <div>Weapon: {WEAPONS[state.player.weapon].name}</div>
        <div>Floor: {state.stats.floor}</div>
        <div>Kills: {state.stats.enemiesKilled}</div>
        <div>Items: {state.stats.itemsCollected}</div>
        <div style={{ marginTop: 10 }}>
          <div>Inventory ({state.player.inventory.length}):</div>
          {state.player.inventory.slice(0, 5).map((item, i) => (
            <div key={i} style={{ fontSize: '12px', color: item.color }}>
              {item.name} (+{item.healValue})
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '12px', color: '#AAA' }}>
          <div>WASD/Arrows: Move</div>
          <div>Mouse: Aim & Shoot</div>
          <div>E: Loot corpse</div>
          <div>Q: Use food</div>
          <div>1-7: Switch weapon</div>
        </div>
      </div>
    </div>
  );
};

// ===== HELPER FUNCTIONS =====

function createPlayer(): Player {
  return {
    id: 'player',
    x: 0,
    y: 0,
    pixelX: 0,
    pixelY: 0,
    health: 100,
    maxHealth: 100,
    weapon: 'PISTOL',
    inventory: [],
    angle: 0,
    lastShotTime: 0,
    movementCooldown: 0
  };
}

function createEnemy(x: number, y: number): Enemy {
  const type = getRandomEnemyType();
  const config = getEnemyConfig(type);

  return {
    id: `enemy-${Date.now()}-${Math.random()}`,
    x,
    y,
    pixelX: x * TILE_SIZE + TILE_SIZE / 2,
    pixelY: y * TILE_SIZE + TILE_SIZE / 2,
    type,
    health: config.health,
    maxHealth: config.health,
    damage: config.damage,
    moveSpeed: config.moveSpeed,
    shootSpeed: config.shootSpeed,
    projectileSpeed: config.projectileSpeed,
    projectileSize: config.projectileSize,
    aggroRange: config.aggroRange,
    lastMoveTime: 0,
    lastShotTime: 0,
    angle: 0,
    state: 'IDLE'
  };
}

function updatePlayerMovement(state: any, deltaTime: number) {
  const player = state.player;
  const keys = state.keys;

  // Smooth pixel movement
  const targetX = player.x * TILE_SIZE + TILE_SIZE / 2;
  const targetY = player.y * TILE_SIZE + TILE_SIZE / 2;

  // Interpolate to target
  const dx = targetX - player.pixelX;
  const dy = targetY - player.pixelY;

  if (Math.abs(dx) > 1) {
    player.pixelX += Math.sign(dx) * Math.min(PIXEL_MOVE_SPEED, Math.abs(dx));
  }
  if (Math.abs(dy) > 1) {
    player.pixelY += Math.sign(dy) * Math.min(PIXEL_MOVE_SPEED, Math.abs(dy));
  }

  // Grid movement
  const now = Date.now();
  if (now - player.movementCooldown < MOVE_SPEED) return;

  let newX = player.x;
  let newY = player.y;

  if (keys.has('w') || keys.has('arrowup')) newY--;
  if (keys.has('s') || keys.has('arrowdown')) newY++;
  if (keys.has('a') || keys.has('arrowleft')) newX--;
  if (keys.has('d') || keys.has('arrowright')) newX++;

  if (isWalkable(state.dungeon.tiles, newX, newY)) {
    player.x = newX;
    player.y = newY;
    player.movementCooldown = now;
  }

  // Update player angle based on mouse
  const centerX = 400; // viewWidth / 2
  const centerY = 300; // viewHeight / 2
  const dx2 = state.mouseX - centerX;
  const dy2 = state.mouseY - centerY;
  player.angle = Math.atan2(dy2, dx2);
}

function updatePlayerShooting(state: any, now: number) {
  const player = state.player;
  const weapon = getWeaponConfig(player.weapon);

  if (now - player.lastShotTime < weapon.fireRate) return;

  player.lastShotTime = now;

  if (weapon.isMelee) {
    // Melee attack
    createMeleeAttack(state, player, weapon);
  } else {
    // Ranged attack
    for (let i = 0; i < weapon.projectileCount; i++) {
      const spreadOffset = (i - (weapon.projectileCount - 1) / 2) * weapon.spreadAngle;
      const angle = player.angle + spreadOffset;

      const projectile: Projectile = {
        id: `proj-${Date.now()}-${Math.random()}`,
        x: player.pixelX + Math.cos(angle) * TILE_SIZE / 2,
        y: player.pixelY + Math.sin(angle) * TILE_SIZE / 2,
        vx: Math.cos(angle) * weapon.projectileSpeed,
        vy: Math.sin(angle) * weapon.projectileSpeed,
        angle,
        size: weapon.projectileSize,
        color: weapon.color,
        damage: weapon.damage,
        lifetime: 0,
        maxLifetime: weapon.range * 60 / weapon.projectileSpeed,
        ownerId: player.id,
        isPlayerProjectile: true,
        weaponType: weapon.type,
        knockback: weapon.knockback
      };

      state.projectiles.push(projectile);
    }
  }

  // Muzzle flash particle
  createParticles(state, player.pixelX, player.pixelY, weapon.color, 5);
}

function createMeleeAttack(state: any, player: Player, weapon: any) {
  // Create temporary melee projectile for visual effect
  const angle = player.angle;
  const projectile: Projectile = {
    id: `melee-${Date.now()}`,
    x: player.pixelX + Math.cos(angle) * TILE_SIZE,
    y: player.pixelY + Math.sin(angle) * TILE_SIZE,
    vx: 0,
    vy: 0,
    angle,
    size: TILE_SIZE / 2,
    color: weapon.color,
    damage: weapon.damage,
    lifetime: 0,
    maxLifetime: 10,
    ownerId: player.id,
    isPlayerProjectile: true,
    weaponType: weapon.type,
    knockback: weapon.knockback
  };

  state.projectiles.push(projectile);
}

function updateEnemies(state: any, now: number) {
  const player = state.player;

  for (const enemy of state.enemies) {
    if (enemy.state === 'DEAD') continue;

    // Smooth pixel movement
    const targetX = enemy.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = enemy.y * TILE_SIZE + TILE_SIZE / 2;

    const dx = targetX - enemy.pixelX;
    const dy = targetY - enemy.pixelY;

    if (Math.abs(dx) > 1) {
      enemy.pixelX += Math.sign(dx) * Math.min(PIXEL_MOVE_SPEED * 0.7, Math.abs(dx));
    }
    if (Math.abs(dy) > 1) {
      enemy.pixelY += Math.sign(dy) * Math.min(PIXEL_MOVE_SPEED * 0.7, Math.abs(dy));
    }

    // Calculate distance to player
    const distToPlayer = Math.sqrt(
      Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
    );

    // AI behavior
    if (distToPlayer <= enemy.aggroRange) {
      enemy.state = 'CHASING';

      // Move towards player
      if (now - enemy.lastMoveTime > enemy.moveSpeed) {
        let newX = enemy.x;
        let newY = enemy.y;

        if (player.x < enemy.x) newX--;
        else if (player.x > enemy.x) newX++;

        if (player.y < enemy.y) newY--;
        else if (player.y > enemy.y) newY++;

        if (isWalkable(state.dungeon.tiles, newX, newY)) {
          enemy.x = newX;
          enemy.y = newY;
          enemy.lastMoveTime = now;
        }
      }

      // Update angle to face player
      enemy.angle = Math.atan2(player.pixelY - enemy.pixelY, player.pixelX - enemy.pixelX);

      // Shoot at player
      if (distToPlayer > 2 && now - enemy.lastShotTime > enemy.shootSpeed) {
        enemy.lastShotTime = now;

        const projectile: Projectile = {
          id: `enemy-proj-${Date.now()}-${Math.random()}`,
          x: enemy.pixelX + Math.cos(enemy.angle) * TILE_SIZE / 2,
          y: enemy.pixelY + Math.sin(enemy.angle) * TILE_SIZE / 2,
          vx: Math.cos(enemy.angle) * enemy.projectileSpeed,
          vy: Math.sin(enemy.angle) * enemy.projectileSpeed,
          angle: enemy.angle,
          size: enemy.projectileSize,
          color: '#FF4444',
          damage: enemy.damage,
          lifetime: 0,
          maxLifetime: 100,
          ownerId: enemy.id,
          isPlayerProjectile: false,
          weaponType: 'PISTOL',
          knockback: 0.5
        };

        state.projectiles.push(projectile);
        createParticles(state, enemy.pixelX, enemy.pixelY, '#FF4444', 3);
      }
    } else {
      enemy.state = 'IDLE';
    }
  }
}

function updateProjectiles(state: any, deltaTime: number) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];

    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime++;

    // Remove expired projectiles
    if (proj.lifetime >= proj.maxLifetime) {
      state.projectiles.splice(i, 1);
    }
  }
}

function updateParticles(state: any, deltaTime: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const particle = state.particles[i];

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.lifetime++;
    particle.alpha = 1 - (particle.lifetime / particle.maxLifetime);

    if (particle.lifetime >= particle.maxLifetime) {
      state.particles.splice(i, 1);
    }
  }
}

function checkCollisions(state: any) {
  const player = state.player;

  // Projectile collisions
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];

    if (proj.isPlayerProjectile) {
      // Check hits on enemies
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const enemy = state.enemies[j];
        if (enemy.state === 'DEAD') continue;

        const dist = Math.sqrt(
          Math.pow(proj.x - enemy.pixelX, 2) + Math.pow(proj.y - enemy.pixelY, 2)
        );

        if (dist < TILE_SIZE / 2) {
          enemy.health -= proj.damage;
          state.projectiles.splice(i, 1);

          createParticles(state, enemy.pixelX, enemy.pixelY, '#FF0000', 8);

          if (enemy.health <= 0) {
            enemy.state = 'DEAD';
            state.stats.enemiesKilled++;
            state.stats.score += 100;
            createCorpse(state, enemy);
            state.enemies.splice(j, 1);
          }
          break;
        }
      }
    } else {
      // Check hits on player
      const dist = Math.sqrt(
        Math.pow(proj.x - player.pixelX, 2) + Math.pow(proj.y - player.pixelY, 2)
      );

      if (dist < TILE_SIZE / 2) {
        player.health -= proj.damage;
        state.projectiles.splice(i, 1);
        createParticles(state, player.pixelX, player.pixelY, '#FF0000', 8);
      }
    }
  }
}

function createCorpse(state: any, enemy: Enemy) {
  const config = getEnemyConfig(enemy.type);
  const loot: FoodIngredient[] = [];

  for (const ingredientType of config.lootTable) {
    loot.push(getFoodIngredient(ingredientType));
  }

  const corpse: Corpse = {
    id: `corpse-${Date.now()}-${Math.random()}`,
    x: enemy.x,
    y: enemy.y,
    pixelX: enemy.pixelX,
    pixelY: enemy.pixelY,
    enemyType: enemy.type,
    loot,
    looted: false,
    decayTime: Date.now() + 60000 // 1 minute
  };

  state.corpses.push(corpse);
}

function lootNearbyCorpse(state: any) {
  const player = state.player;

  for (const corpse of state.corpses) {
    if (corpse.looted) continue;

    const dist = Math.sqrt(
      Math.pow(player.x - corpse.x, 2) + Math.pow(player.y - corpse.y, 2)
    );

    if (dist <= 1.5) {
      corpse.looted = true;
      player.inventory.push(...corpse.loot);
      state.stats.itemsCollected += corpse.loot.length;
      state.stats.score += corpse.loot.length * 10;
      createParticles(state, corpse.pixelX, corpse.pixelY, '#FFD700', 10);
      break;
    }
  }
}

function useFood(state: any) {
  const player = state.player;

  if (player.inventory.length === 0) return;

  const food = player.inventory.shift()!;
  player.health = Math.min(player.maxHealth, player.health + food.healValue);
  createParticles(state, player.pixelX, player.pixelY, '#00FF00', 10);
}

function createParticles(state: any, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;

    state.particles.push({
      id: `particle-${Date.now()}-${Math.random()}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color,
      alpha: 1,
      lifetime: 0,
      maxLifetime: 30 + Math.random() * 20
    });
  }
}

function updateCamera(state: any) {
  const viewWidth = 800;
  const viewHeight = 600;

  state.cameraX = state.player.pixelX - viewWidth / 2;
  state.cameraY = state.player.pixelY - viewHeight / 2;

  // Clamp camera to dungeon bounds
  state.cameraX = Math.max(0, Math.min(state.cameraX, DUNGEON_WIDTH * TILE_SIZE - viewWidth));
  state.cameraY = Math.max(0, Math.min(state.cameraY, DUNGEON_HEIGHT * TILE_SIZE - viewHeight));
}

function nextLevel(state: any) {
  state.stats.floor++;
  state.stats.score += 500;

  // Generate new dungeon
  state.dungeon = generateDungeon(DUNGEON_WIDTH, DUNGEON_HEIGHT);

  // Reset player position
  const firstRoom = state.dungeon.rooms[0];
  const spawnPos = getRandomFloorPositionInRoom(firstRoom);
  state.player.x = spawnPos.x;
  state.player.y = spawnPos.y;
  state.player.pixelX = spawnPos.x * TILE_SIZE + TILE_SIZE / 2;
  state.player.pixelY = spawnPos.y * TILE_SIZE + TILE_SIZE / 2;

  // Clear old entities
  state.enemies = [];
  state.projectiles = [];
  state.corpses = [];
  state.particles = [];

  // Spawn new enemies
  for (let i = 1; i < state.dungeon.rooms.length; i++) {
    const room = state.dungeon.rooms[i];
    const numEnemies = 1 + Math.floor(Math.random() * (3 + state.stats.floor));

    for (let j = 0; j < numEnemies; j++) {
      const enemyPos = getRandomFloorPositionInRoom(room);
      const enemy = createEnemy(enemyPos.x, enemyPos.y);
      state.enemies.push(enemy);
    }
  }
}

export default GameOptimized;
