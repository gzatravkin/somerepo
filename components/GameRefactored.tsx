import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Ship, Projectile, Vector, Star, Explosion, Loot, Base, UpgradeType } from '../types';
import { distance } from '../utils/helpers';
import { createShip } from '../systems/shipFactory';
import { updateBotAI, getAIMovementAngle, shouldAIShoot, activateShield } from '../systems/aiSystem';
import { detectProjectileCollisions, detectExplosionCollisions, detectLootCollection } from '../systems/collisionSystem';
import { createAutoFireProjectile, createSpecialAbilityProjectiles, updateHomingMissile, applyGravityWellEffect } from '../systems/weaponSystem';
import { WEAPON_CONFIGS } from '../systems/weapons';
import SVGShip from './svg/SVGShip';
import SVGProjectile from './svg/SVGProjectile';
import SVGExplosion from './svg/SVGExplosion';
import SVGLoot from './svg/SVGLoot';
import SVGFilters from './svg/SVGFilters';

interface GameProps {
  onGameOver: (score: number) => void;
  onWin: (score: number) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;
const MAX_BOTS = 15;
const PLAYER_ID = 'player';
const DRAG_FACTOR = 0.98;
const BASE_UPGRADE_COST = 50;
const WIN_SIZE = 150;
const WIN_TIME = 180;

const GameRefactored: React.FC<GameProps> = ({ onGameOver, onWin, score, setScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gameObjects = useRef<{
    ships: Map<string, Ship>;
    projectiles: Projectile[];
    stars: Star[];
    explosions: Explosion[];
    loot: Loot[];
    bases: Base[];
  }>({
    ships: new Map(),
    projectiles: [],
    stars: [],
    explosions: [],
    loot: [],
    bases: [],
  });
  const mousePosition = useRef<Vector>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animationFrameId = useRef<number | null>(null);
  const [playerCargo, setPlayerCargo] = useState(0);
  const [playerShieldEnergy, setPlayerShieldEnergy] = useState(7);
  const [maxPlayerShieldEnergy, setMaxPlayerShieldEnergy] = useState(7);
  const [timeRemaining, setTimeRemaining] = useState(WIN_TIME);
  const [currentWeapon, setCurrentWeapon] = useState('PULSE_LASER');
  const nebulaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const createExplosion = (x: number, y: number, ownerId: string, size: number, damage: number) => {
    const explosion: Explosion = {
      id: `expl-${Math.random()}-${Date.now()}`,
      x,
      y,
      ownerId,
      radius: 0,
      maxRadius: size * 6,
      damage,
      lifetime: 25,
      maxLifetime: 25,
      damageDealt: false,
    };
    gameObjects.current.explosions.push(explosion);
  };

  const createLoot = (x: number, y: number, value: number) => {
    gameObjects.current.loot.push({
      id: `loot-${Math.random()}-${Date.now()}`,
      x,
      y,
      value,
      radius: Math.max(4, Math.min(20, 3 + value / 4)),
    });
  };

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 0) {
      // Left click - fire special ability
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        const specialProjectiles = createSpecialAbilityProjectiles(player, gameObjects.current.ships);
        gameObjects.current.projectiles.push(...specialProjectiles);
      }
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mousePosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        activateShield(player);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onWin(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);
    };
  }, [handleMouseMove, handleMouseDown, handleKeyDown, onWin, score]);

  const gameLoop = useCallback(() => {
    const { ships, projectiles, explosions, loot, bases } = gameObjects.current;
    const player = ships.get(PLAYER_ID);

    if (!player) {
      animationFrameId.current && cancelAnimationFrame(animationFrameId.current);
      onGameOver(score);
      return;
    }

    // Player movement
    const canvas = canvasRef.current;
    if (canvas) {
      const viewport = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };
      const targetX = mousePosition.current.x + viewport.x;
      const targetY = mousePosition.current.y + viewport.y;
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      player.angle = Math.atan2(dy, dx);
      const acceleration = 0.1;
      player.vx += Math.cos(player.angle) * acceleration;
      player.vy += Math.sin(player.angle) * acceleration;
      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (speed > player.maxSpeed) {
        player.vx = (player.vx / speed) * player.maxSpeed;
        player.vy = (player.vy / speed) * player.maxSpeed;
      }
    }

    // Update shield mechanics
    const now = Date.now();
    ships.forEach((ship) => {
      if (ship.shieldActive && now - ship.shieldActivatedTime > 200) {
        ship.shieldActive = false;
      }

      let isInBase = false;
      bases.forEach((base) => {
        if (distance(ship, base) < base.radius) {
          isInBase = true;
        }
      });

      const recoveryTime = isInBase ? 2000 : 20000;
      if (ship.shieldEnergy < ship.maxShieldEnergy && now - ship.lastShieldUse > recoveryTime / ship.maxShieldEnergy) {
        ship.shieldEnergy = Math.min(ship.maxShieldEnergy, ship.shieldEnergy + 1 / 60);
      }

      if (isInBase && ship.health < ship.maxHealth) {
        ship.health = Math.min(ship.maxHealth, ship.health + ship.maxHealth * 0.02);
      }
    });

    // Auto-fire for all ships
    ships.forEach((ship) => {
      const autoProj = createAutoFireProjectile(ship);
      if (autoProj) {
        projectiles.push(autoProj);
      }
    });

    // Update AI for bots
    ships.forEach((ship) => {
      if (!ship.isPlayer) {
        updateBotAI(ship, ships, loot, bases, projectiles);
        const targetAngle = getAIMovementAngle(ship, now);
        const aiAcceleration = 0.05;

        if (targetAngle !== undefined) {
          ship.angle = targetAngle;
          ship.vx += Math.cos(ship.angle) * aiAcceleration;
          ship.vy += Math.sin(ship.angle) * aiAcceleration;
        }

        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        if (speed > ship.maxSpeed) {
          ship.vx = (ship.vx / speed) * ship.maxSpeed;
          ship.vy = (ship.vy / speed) * ship.maxSpeed;
        }

        // AI shooting
        if (shouldAIShoot(ship)) {
          const aiProj = createAutoFireProjectile(ship);
          if (aiProj) projectiles.push(aiProj);
        }
      }

      ship.vx *= DRAG_FACTOR;
      ship.vy *= DRAG_FACTOR;
      ship.x += ship.vx;
      ship.y += ship.vy;
      ship.x = Math.max(ship.size, Math.min(GAME_WIDTH - ship.size, ship.x));
      ship.y = Math.max(ship.size, Math.min(GAME_HEIGHT - ship.size, ship.y));
    });

    // Update projectiles
    const nextProjectiles: Projectile[] = [];
    projectiles.forEach((p) => {
      // Update homing missiles
      if (p.specialType === 'HOMING_MISSILES') {
        updateHomingMissile(p, ships);
      }

      // Apply gravity well effects
      if (p.specialType === 'GRAVITY_WELL') {
        applyGravityWellEffect(p, ships);
      }

      p.x += p.vx;
      p.y += p.vy;
      p.lifetime--;

      const isAlive = p.lifetime > 0 && p.x > 0 && p.x < GAME_WIDTH && p.y > 0 && p.y < GAME_HEIGHT;
      if (isAlive) {
        nextProjectiles.push(p);
      } else if (p.specialType === 'EXPLOSIVE_BLAST') {
        createExplosion(p.x, p.y, p.ownerId, p.size * 2, p.damage);
      }
    });
    gameObjects.current.projectiles = nextProjectiles;

    // Collision detection
    const { projectilesThatHit, shipsThatDied } = detectProjectileCollisions(gameObjects.current.projectiles, ships);

    // Remove hit projectiles (except piercing and beams)
    gameObjects.current.projectiles = gameObjects.current.projectiles.filter(
      (p) => !projectilesThatHit.has(p.id) || p.piercing || p.isBeam
    );

    // Create explosions for special projectiles
    projectilesThatHit.forEach((projId) => {
      const proj = gameObjects.current.projectiles.find((p) => p.id === projId);
      if (proj && proj.specialType === 'EXPLOSIVE_BLAST') {
        createExplosion(proj.x, proj.y, proj.ownerId, proj.size * 2, proj.damage);
      }
    });

    // Explosion collisions
    detectExplosionCollisions(explosions, ships, shipsThatDied);

    // Handle deaths and award kills
    if (shipsThatDied.size > 0) {
      shipsThatDied.forEach((deathInfo, deadShipId) => {
        const deadShip = ships.get(deadShipId);
        if (deadShip) {
          createLoot(deadShip.x, deadShip.y, deadShip.size);

          const killer = ships.get(deathInfo.killerId);
          if (killer) {
            killer.size += deathInfo.size * 0.15;
            killer.maxHealth = killer.size * 5;
            killer.health = Math.min(killer.health + deathInfo.size * 2, killer.maxHealth);

            if (killer.isPlayer) {
              setScore((prev) => prev + Math.floor(deathInfo.size));
            }
          }
        }
        ships.delete(deadShipId);
      });
    }

    // Loot collection
    const collectedLoot = detectLootCollection(loot, ships);
    gameObjects.current.loot = loot.filter((l) => !collectedLoot.has(l.id));

    if (player && Math.floor(player.cargo) !== playerCargo) {
      setPlayerCargo(Math.floor(player.cargo));
    }

    if (player && Math.floor(player.shieldEnergy) !== playerShieldEnergy) {
      setPlayerShieldEnergy(Math.floor(player.shieldEnergy));
    }

    if (player) {
      setCurrentWeapon(player.weapon);
    }

    // Base upgrades
    ships.forEach((ship) => {
      bases.forEach((base) => {
        if (distance(ship, base) < base.radius) {
          const currentLevel = ship.upgrades[base.upgradeType];
          const upgradeCost = BASE_UPGRADE_COST * (currentLevel + 1);

          if (ship.cargo >= upgradeCost) {
            ship.cargo -= upgradeCost;
            ship.upgrades[base.upgradeType]++;

            if (base.upgradeType === 'FIRE_RATE') {
              ship.shootCooldown = Math.max(50, ship.shootCooldown * 0.85);
            } else if (base.upgradeType === 'SHIP_SPEED') {
              ship.maxSpeed *= 1.1;
            } else if (base.upgradeType === 'WEAPON_DAMAGE') {
              ship.projectileDamage *= 1.2;
            }

            if (ship.isPlayer) {
              ship.size += 5;
              ship.maxHealth = ship.size * 5;
              ship.health = ship.maxHealth;
              setScore((prev) => prev + 5);

              if (ship.size >= WIN_SIZE) {
                onWin(Math.floor(ship.size));
              }
            }
          }
        }
      });
    });

    // Update explosions
    gameObjects.current.explosions = explosions.filter((exp) => {
      exp.lifetime--;
      exp.radius = exp.maxRadius * (1 - (exp.lifetime / exp.maxLifetime) ** 2);
      return exp.lifetime > 0;
    });

    // Spawn new bots
    while (ships.size < MAX_BOTS + 1) {
      const defenderBases = bases.filter((b) => b.upgradeType === 'FIRE_RATE');
      const assignedBase = Math.random() < 0.2 ? defenderBases[Math.floor(Math.random() * defenderBases.length)] : null;
      const newBot = createShip(false, assignedBase);
      ships.set(newBot.id, newBot);
    }

    drawCanvas();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, score, setScore, playerCargo, onWin, playerShieldEnergy]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { ships, stars } = gameObjects.current;
    const player = ships.get(PLAYER_ID);
    if (!player) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const camX = -player.x + canvas.width / 2;
    const camY = -player.y + canvas.height / 2;

    // Draw Nebula background
    if (nebulaCanvasRef.current) {
      const nebulaPattern = ctx.createPattern(nebulaCanvasRef.current, 'repeat');
      if (nebulaPattern) {
        ctx.save();
        ctx.translate(camX / 4, camY / 4);
        ctx.fillStyle = nebulaPattern;
        ctx.fillRect(-canvas.width, -canvas.height, canvas.width * 3, canvas.height * 3);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#00031a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw stars with parallax
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.translate(camX / i, camY / i);
      stars
        .filter((s) => s.layer === i)
        .forEach((star) => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * (1 - (i - 1) * 0.2)})`;
          ctx.fill();
        });
      ctx.restore();
    }

    // Draw game world border
    ctx.translate(camX, camY);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw bases
    gameObjects.current.bases.forEach((base) => {
      ctx.beginPath();
      ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
      ctx.fillStyle = base.color + '33';
      ctx.fill();
      ctx.strokeStyle = base.color;
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 5;

      const upgradeText = base.upgradeType.replace('_', ' ');
      const player = ships.get(PLAYER_ID);
      if (player) {
        const currentLevel = player.upgrades[base.upgradeType];
        const costText = `COST: ${BASE_UPGRADE_COST * (currentLevel + 1)} CARGO`;
        ctx.fillText(upgradeText, base.x, base.y - 20);
        ctx.font = '20px sans-serif';
        ctx.fillText(costText, base.x, base.y + 20);
      }
      ctx.shadowBlur = 0;
    });
  };

  const drawNebula = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = ['#4a0e6c', '#0a0a2a', '#6a1b9a', '#1a237e'];
    ctx.fillStyle = '#00031a';
    ctx.fillRect(0, 0, width, height);

    let rng = 12345;
    const seededRandom = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    for (let i = 0; i < 75; i++) {
      const baseX = seededRandom() * width;
      const baseY = seededRandom() * height;
      const radius = seededRandom() * 200 + 50;
      const color = colors[Math.floor(seededRandom() * colors.length)];

      const grad = ctx.createRadialGradient(baseX, baseY, 0, baseX, baseY, radius);
      grad.addColorStop(0, `${color}80`);
      grad.addColorStop(0.5, `${color}40`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
      ctx.fill();

      const wrapOffsets = [
        [-width, -height],
        [0, -height],
        [width, -height],
        [-width, 0],
        [width, 0],
        [-width, height],
        [0, height],
        [width, height],
      ];

      wrapOffsets.forEach(([offsetX, offsetY]) => {
        const wrappedX = baseX + offsetX;
        const wrappedY = baseY + offsetY;

        if (
          wrappedX + radius > 0 &&
          wrappedX - radius < width &&
          wrappedY + radius > 0 &&
          wrappedY - radius < height
        ) {
          const wrapGrad = ctx.createRadialGradient(wrappedX, wrappedY, 0, wrappedX, wrappedY, radius);
          wrapGrad.addColorStop(0, `${color}80`);
          wrapGrad.addColorStop(0.5, `${color}40`);
          wrapGrad.addColorStop(1, `${color}00`);
          ctx.fillStyle = wrapGrad;

          ctx.beginPath();
          ctx.arc(wrappedX, wrappedY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    gameObjects.current.stars = Array.from({ length: 800 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      radius: Math.random() * 1.5,
      alpha: Math.random() * 0.5 + 0.5,
      layer: Math.ceil(Math.random() * 3),
    }));

    const nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = 1024;
    nebulaCanvas.height = 1024;
    const nebulaCtx = nebulaCanvas.getContext('2d');
    if (nebulaCtx) {
      drawNebula(nebulaCtx, nebulaCanvas.width, nebulaCanvas.height);
    }
    nebulaCanvasRef.current = nebulaCanvas;

    gameObjects.current.bases = [
      { id: 'base1', x: 500, y: 500, radius: 200, color: '#FF4500', upgradeType: 'FIRE_RATE' },
      { id: 'base2', x: GAME_WIDTH - 500, y: 500, radius: 200, color: '#32CD32', upgradeType: 'SHIP_SPEED' },
      { id: 'base3', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 500, radius: 200, color: '#1E90FF', upgradeType: 'WEAPON_DAMAGE' },
    ];

    gameObjects.current.ships.clear();
    const player = createShip(true);
    gameObjects.current.ships.set(player.id, player);
    setMaxPlayerShieldEnergy(player.maxShieldEnergy);
    setPlayerShieldEnergy(player.shieldEnergy);

    for (let i = 0; i < MAX_BOTS; i++) {
      const bot = createShip(false, Math.random() < 0.2 ? gameObjects.current.bases[0] : null);
      gameObjects.current.ships.set(bot.id, bot);
    }

    gameObjects.current.projectiles = [];
    gameObjects.current.explosions = [];
    gameObjects.current.loot = [];
    setPlayerCargo(0);
    setTimeRemaining(WIN_TIME);

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      animationFrameId.current && cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameLoop]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const player = gameObjects.current.ships.get(PLAYER_ID);
  const cameraX = player ? -player.x + (canvasRef.current?.width || 0) / 2 : 0;
  const cameraY = player ? -player.y + (canvasRef.current?.height || 0) / 2 : 0;

  const weaponConfig = WEAPON_CONFIGS[currentWeapon as keyof typeof WEAPON_CONFIGS];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ cursor: 'crosshair' }}
      >
        <SVGFilters />

        {/* Render loot */}
        {gameObjects.current.loot.map((l) => (
          <SVGLoot key={l.id} loot={l} cameraX={cameraX} cameraY={cameraY} />
        ))}

        {/* Render projectiles */}
        {gameObjects.current.projectiles.map((p) => (
          <SVGProjectile key={p.id} projectile={p} cameraX={cameraX} cameraY={cameraY} />
        ))}

        {/* Render ships */}
        {Array.from(gameObjects.current.ships.values()).map((ship) => (
          <SVGShip key={ship.id} ship={ship} cameraX={cameraX} cameraY={cameraY} />
        ))}

        {/* Render explosions */}
        {gameObjects.current.explosions.map((exp) => (
          <SVGExplosion key={exp.id} explosion={exp} cameraX={cameraX} cameraY={cameraY} />
        ))}
      </svg>

      {/* UI Overlay */}
      <div className="absolute top-5 left-5 text-2xl font-bold tracking-widest text-white pointer-events-none">
        <div>SCORE: {score}</div>
        <div>CARGO: {playerCargo}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">SHIELD:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxPlayerShieldEnergy }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-6 border ${
                  i < playerShieldEnergy ? 'bg-blue-400 border-blue-300' : 'bg-gray-700 border-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 p-3 bg-black bg-opacity-50 rounded">
          <div className="text-lg" style={{ color: weaponConfig?.color || '#FFF' }}>
            {weaponConfig?.name || 'Unknown Weapon'}
          </div>
          <div className="text-sm text-gray-300 mt-1">{weaponConfig?.specialDescription || ''}</div>
        </div>
      </div>

      <div className="absolute top-5 right-5 text-2xl font-bold tracking-widest text-white text-right pointer-events-none">
        <div>GOAL: REACH SIZE {WIN_SIZE}</div>
        <div>
          OR SURVIVE: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="absolute bottom-5 right-5 text-lg font-mono text-gray-500 pointer-events-none">V2.0</div>

      <div className="absolute bottom-5 left-5 text-sm text-white pointer-events-none">
        <div className="bg-black bg-opacity-50 p-2 rounded">
          <div>LEFT CLICK: Special Ability</div>
          <div>SPACE: Shield</div>
        </div>
      </div>
    </div>
  );
};

export default GameRefactored;
