import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Ship, Projectile, Vector, Star, Explosion, Loot, Base, WeaponType, Particle } from '../types';
import { distance } from '../utils/helpers';
import { createShip } from '../systems/shipFactory';
import { updateBotAI, getAIMovementAngle, shouldAIShoot, activateShield } from '../systems/aiSystem';
import { detectProjectileCollisions, detectExplosionCollisions, detectLootCollection } from '../systems/collisionSystem';
import { createAutoFireProjectile, createSpecialAbilityProjectiles, updateHomingMissile, applyGravityWellEffect } from '../systems/weaponSystem';
import { WEAPON_CONFIGS } from '../systems/weapons';
import { CanvasRenderer } from '../systems/canvasRenderer';
import SVGShip from './svg/SVGShip';
import SVGFilters from './svg/SVGFilters';
import SVGProjectile from './svg/SVGProjectile';
import SVGExplosion from './svg/SVGExplosion';
import SVGLoot from './svg/SVGLoot';
import SVGBase from './svg/SVGBase';
import MobileControls from './MobileControls';

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

const GameOptimized: React.FC<GameProps> = ({ onGameOver, onWin, score, setScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const gameObjects = useRef<{
    ships: Map<string, Ship>;
    projectiles: Projectile[];
    stars: Star[];
    explosions: Explosion[];
    loot: Loot[];
    bases: Base[];
    particles: Particle[];
  }>({
    ships: new Map(),
    projectiles: [],
    stars: [],
    explosions: [],
    loot: [],
    bases: [],
    particles: [],
  });
  const mousePosition = useRef<Vector>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animationFrameId = useRef<number | null>(null);
  const [playerCargo, setPlayerCargo] = useState(0);
  const [playerShieldEnergy, setPlayerShieldEnergy] = useState(7);
  const [maxPlayerShieldEnergy, setMaxPlayerShieldEnergy] = useState(7);
  const [timeRemaining, setTimeRemaining] = useState(WIN_TIME);
  const [currentWeapon, setCurrentWeapon] = useState('PULSE_LASER');
  const [specialCooldownPercent, setSpecialCooldownPercent] = useState(100);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(false);
  const nebulaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenShake = useRef<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });
  const screenFlash = useRef<{ color: string; intensity: number }>({ color: '#FFFFFF', intensity: 0 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });

  // Mobile controls state
  const [isMobile, setIsMobile] = useState(false);
  const [forceMobile, setForceMobile] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const joystickInput = useRef<{ angle: number | null; distance: number }>({ angle: null, distance: 0 });
  const lastShootTime = useRef<number>(0);
  const mobileAimPosition = useRef<Vector | null>(null);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugInfo(prev => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
      return newLogs.slice(-10); // Keep last 10 logs
    });
  };

  const createParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    type: 'spark' | 'smoke' | 'glow' | 'debris',
    speed: number = 5
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = Math.random() * speed;
      gameObjects.current.particles.push({
        id: `particle-${Math.random()}-${Date.now()}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        lifetime: 60,
        maxLifetime: 60,
        type,
      });
    }
  };

  const triggerScreenShake = (intensity: number) => {
    screenShake.current.intensity = intensity;
  };

  const triggerScreenFlash = (color: string, intensity: number) => {
    screenFlash.current.color = color;
    screenFlash.current.intensity = intensity;
  };

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

    // Add explosion particles and effects
    createParticles(x, y, 30, '#FF8C00', 'spark', 8);
    createParticles(x, y, 15, '#888888', 'smoke', 3);
    createParticles(x, y, 10, '#FFFF00', 'debris', 10);
    triggerScreenShake(size * 0.5);
    triggerScreenFlash('#FF8C00', 0.15);
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
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        const specialProjectiles = createSpecialAbilityProjectiles(player, gameObjects.current.ships);
        if (specialProjectiles.length > 0) {
          gameObjects.current.projectiles.push(...specialProjectiles);
          // Create muzzle flash particles
          const weaponConfig = WEAPON_CONFIGS[player.weapon];
          createParticles(
            player.x + Math.cos(player.angle) * player.size,
            player.y + Math.sin(player.angle) * player.size,
            10,
            weaponConfig.glowColor,
            'glow',
            3
          );
        }
      }
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mousePosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.code === 'Space') {
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        activateShield(player);
      }
    }

    // Weapon switching with 1-7 keys
    const weaponKeys: Record<string, WeaponType> = {
      'Digit1': 'PULSE_LASER',
      'Digit2': 'PLASMA_CANNON',
      'Digit3': 'RAILGUN',
      'Digit4': 'MISSILE_LAUNCHER',
      'Digit5': 'BEAM_WEAPON',
      'Digit6': 'QUANTUM_DISRUPTOR',
      'Digit7': 'MATTER_ANNIHILATOR',
    };

    if (weaponKeys[event.code]) {
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        player.weapon = weaponKeys[event.code];
        setCurrentWeapon(weaponKeys[event.code]);
      }
    }

    // Toggle scanlines with 'C' key
    if (event.code === 'KeyC') {
      setScanlinesEnabled(prev => !prev);
    }

    // Toggle mobile mode with 'M' key for testing
    if (event.code === 'KeyM') {
      addDebugLog('M key pressed! Toggling mobile mode');
      setForceMobile(prev => {
        const newValue = !prev;
        addDebugLog(`Force mobile changed from ${prev} to ${newValue}`);
        return newValue;
      });
    }

    // Toggle debug panel with 'D' key
    if (event.code === 'KeyD') {
      setShowDebug(prev => !prev);
    }
  }, []);

  // Mobile control handlers
  const handleJoystickMove = useCallback((angle: number | null, distance: number) => {
    joystickInput.current = { angle, distance };
  }, []);

  const handleMobileShoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShootTime.current > 100) {
      const player = gameObjects.current.ships.get(PLAYER_ID);
      if (player) {
        const specialProjectiles = createSpecialAbilityProjectiles(player, gameObjects.current.ships);
        if (specialProjectiles.length > 0) {
          gameObjects.current.projectiles.push(...specialProjectiles);
          const weaponConfig = WEAPON_CONFIGS[player.weapon];
          createParticles(
            player.x + Math.cos(player.angle) * player.size,
            player.y + Math.sin(player.angle) * player.size,
            10,
            weaponConfig.glowColor,
            'glow',
            3
          );
        }
      }
      lastShootTime.current = now;
    }
  }, []);

  const handleMobileShield = useCallback(() => {
    const player = gameObjects.current.ships.get(PLAYER_ID);
    if (player) {
      activateShield(player);
    }
  }, []);

  const handleWeaponSwitch = useCallback(() => {
    const player = gameObjects.current.ships.get(PLAYER_ID);
    if (player) {
      const weaponOrder: WeaponType[] = ['PULSE_LASER', 'PLASMA_CANNON', 'RAILGUN', 'MISSILE_LAUNCHER', 'BEAM_WEAPON', 'QUANTUM_DISRUPTOR', 'MATTER_ANNIHILATOR'];
      const currentIndex = weaponOrder.indexOf(player.weapon);
      const nextIndex = (currentIndex + 1) % weaponOrder.length;
      player.weapon = weaponOrder[nextIndex];
      setCurrentWeapon(weaponOrder[nextIndex]);
      addDebugLog(`Weapon switched to ${weaponOrder[nextIndex]}`);
    }
  }, []);

  // Touch event handlers for canvas (tap anywhere to set aim direction on mobile)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isMobile) return;

    const target = event.target as HTMLElement;
    if (target.closest('.mobile-controls')) return;

    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      // Store mobile aim position for aiming
      mobileAimPosition.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isMobile) return;

    const target = event.target as HTMLElement;
    if (target.closest('.mobile-controls')) return;

    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      // Update mobile aim position while dragging
      mobileAimPosition.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [isMobile]);

  // Check URL parameter for forcing mobile mode
  useEffect(() => {
    addDebugLog('=== Initial URL check ===');
    const urlParams = new URLSearchParams(window.location.search);
    const mobileParam = urlParams.get('mobile');
    addDebugLog(`URL mobile parameter: ${mobileParam}`);
    if (mobileParam === 'true') {
      addDebugLog('Setting forceMobile to true from URL parameter');
      setForceMobile(true);
    }
  }, []);

  useEffect(() => {
    addDebugLog(`=== forceMobile changed === ${forceMobile}`);
  }, [forceMobile]);

  useEffect(() => {
    addDebugLog(`=== isMobile changed === ${isMobile}`);
  }, [isMobile]);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      addDebugLog('=== checkMobile called ===');

      if (forceMobile) {
        addDebugLog('Force mobile is TRUE, setting isMobile to true');
        setIsMobile(true);
        return;
      }

      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      const isMobileDevice = isMobileUserAgent || (hasTouch && isSmallScreen);

      addDebugLog(`UserAgent: ${isMobileUserAgent}, Touch: ${hasTouch}, SmallScreen: ${isSmallScreen}, IsMobile: ${isMobileDevice}`);

      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

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
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      clearInterval(timer);
    };
  }, [handleMouseMove, handleMouseDown, handleKeyDown, handleTouchStart, handleTouchMove, onWin, score, forceMobile]);

  const gameLoop = useCallback(() => {
    const { ships, projectiles, explosions, loot, bases, particles } = gameObjects.current;
    const player = ships.get(PLAYER_ID);

    if (!player) {
      animationFrameId.current && cancelAnimationFrame(animationFrameId.current);
      onGameOver(score);
      return;
    }

    // Update screen shake
    if (screenShake.current.intensity > 0) {
      screenShake.current.x = (Math.random() - 0.5) * screenShake.current.intensity;
      screenShake.current.y = (Math.random() - 0.5) * screenShake.current.intensity;
      screenShake.current.intensity *= 0.9;
      if (screenShake.current.intensity < 0.1) {
        screenShake.current.intensity = 0;
        screenShake.current.x = 0;
        screenShake.current.y = 0;
      }
    }

    // Update screen flash
    if (screenFlash.current.intensity > 0) {
      screenFlash.current.intensity *= 0.85;
      if (screenFlash.current.intensity < 0.01) {
        screenFlash.current.intensity = 0;
      }
    }

    // Update base animations
    bases.forEach(base => {
      base.pulsePhase += 0.05;
      base.rotationAngle += 0.01;
    });

    // Player movement
    const canvas = canvasRef.current;
    if (canvas) {
      const viewport = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };

      // Use joystick input for mobile, mouse for desktop
      if (isMobile) {
        // Mobile: joystick controls movement, ship aims in joystick direction OR touch aim position
        if (joystickInput.current.angle !== null && joystickInput.current.distance > 0) {
          const acceleration = 0.1 * joystickInput.current.distance;
          const moveAngle = joystickInput.current.angle;
          player.vx += Math.cos(moveAngle) * acceleration;
          player.vy += Math.sin(moveAngle) * acceleration;

          // If user has set an aim position by touching screen, use that; otherwise aim in movement direction
          if (mobileAimPosition.current) {
            const targetX = mobileAimPosition.current.x + viewport.x;
            const targetY = mobileAimPosition.current.y + viewport.y;
            const dx = targetX - player.x;
            const dy = targetY - player.y;
            player.angle = Math.atan2(dy, dx);
          } else {
            // Aim in the direction of movement
            player.angle = moveAngle;
          }
        } else if (mobileAimPosition.current) {
          // Not moving but has aim position
          const targetX = mobileAimPosition.current.x + viewport.x;
          const targetY = mobileAimPosition.current.y + viewport.y;
          const dx = targetX - player.x;
          const dy = targetY - player.y;
          player.angle = Math.atan2(dy, dx);
        }
      } else {
        // Desktop: mouse controls both movement and aiming
        const targetX = mousePosition.current.x + viewport.x;
        const targetY = mousePosition.current.y + viewport.y;
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        player.angle = Math.atan2(dy, dx);
        const acceleration = 0.1;
        player.vx += Math.cos(player.angle) * acceleration;
        player.vy += Math.sin(player.angle) * acceleration;
      }

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

        if (shouldAIShoot(ship)) {
          const aiProj = createAutoFireProjectile(ship);
          if (aiProj) projectiles.push(aiProj);
        }
      }

      ship.vx *= DRAG_FACTOR;
      ship.vy *= DRAG_FACTOR;

      // Update engine trail
      const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      if (speed > 0.5) {
        const trailX = ship.x - Math.cos(ship.angle) * ship.size * 0.5;
        const trailY = ship.y - Math.sin(ship.angle) * ship.size * 0.5;
        ship.engineTrail.push({
          x: trailX,
          y: trailY,
          alpha: Math.min(speed / ship.maxSpeed, 1),
          size: ship.size * 0.15,
        });

        // Limit trail length
        if (ship.engineTrail.length > 15) {
          ship.engineTrail.shift();
        }
      }

      // Fade out trail
      ship.engineTrail.forEach(point => {
        point.alpha *= 0.95;
      });
      ship.engineTrail = ship.engineTrail.filter(point => point.alpha > 0.05);

      ship.x += ship.vx;
      ship.y += ship.vy;
      ship.x = Math.max(ship.size, Math.min(GAME_WIDTH - ship.size, ship.x));
      ship.y = Math.max(ship.size, Math.min(GAME_HEIGHT - ship.size, ship.y));
    });

    // Update projectiles
    const nextProjectiles: Projectile[] = [];
    const gravityWellDestroyedProjectiles = new Set<string>();
    const shipsThatDied = new Map<string, { killerId: string; size: number }>();

    projectiles.forEach((p) => {
      // Track beam with owner position and angle
      if (p.trackOwner && p.isBeam) {
        const owner = ships.get(p.ownerId);
        if (owner) {
          p.x = owner.x;
          p.y = owner.y;
          // Store angle as velocity for rendering (unit vector)
          p.vx = Math.cos(owner.angle);
          p.vy = Math.sin(owner.angle);
        }
      }

      // Don't move tracking beams (they follow owner)
      const shouldMove = !(p.trackOwner && p.isBeam);

      // Update projectile trail
      if (shouldMove && !p.isBeam) {
        p.trail.push({
          x: p.x,
          y: p.y,
          alpha: 0.8,
          size: p.size * 0.6,
        });

        // Limit trail length
        if (p.trail.length > 8) {
          p.trail.shift();
        }

        // Fade out trail
        p.trail.forEach(point => {
          point.alpha *= 0.85;
          point.size *= 0.95;
        });
        p.trail = p.trail.filter(point => point.alpha > 0.1);
      }

      // Handle homing missiles
      if (p.specialType === 'HOMING_MISSILES') {
        updateHomingMissile(p, ships);
      }

      // Handle gravity wells
      if (p.specialType === 'GRAVITY_WELL') {
        // Become stationary after stationaryTime
        if (p.stationaryTime !== undefined && !p.stationary) {
          if (p.lifetime < (300 - p.stationaryTime)) {
            p.stationary = true;
            p.vx = 0;
            p.vy = 0;
          }
        }

        const { damagedShips, destroyedProjectiles } = applyGravityWellEffect(p, ships, projectiles);

        // Apply damage from gravity well
        damagedShips.forEach((damage, shipId) => {
          const ship = ships.get(shipId);
          if (ship && !ship.shieldActive) {
            ship.health -= damage;
            if (ship.health <= 0) {
              if (!shipsThatDied.has(shipId)) {
                shipsThatDied.set(shipId, { killerId: p.ownerId, size: ship.size });
              }
            }
          }
        });

        // Mark projectiles for destruction
        destroyedProjectiles.forEach((projId) => gravityWellDestroyedProjectiles.add(projId));
      }

      // Update position (but not for tracking beams)
      if (shouldMove) {
        p.x += p.vx;
        p.y += p.vy;
      }
      p.lifetime--;

      // Keep projectile alive if within bounds (gravity wells and tracking beams ignore bounds)
      const ignoreBounds = (p.specialType === 'GRAVITY_WELL' && p.stationary) || (p.trackOwner && p.isBeam);
      const isAlive = p.lifetime > 0 && (ignoreBounds || (p.x > 0 && p.x < GAME_WIDTH && p.y > 0 && p.y < GAME_HEIGHT));

      if (isAlive && !gravityWellDestroyedProjectiles.has(p.id)) {
        nextProjectiles.push(p);
      } else if (p.specialType === 'EXPLOSIVE_BLAST') {
        createExplosion(p.x, p.y, p.ownerId, p.size * 2, p.damage);
      }
    });
    gameObjects.current.projectiles = nextProjectiles;

    // Update particles
    gameObjects.current.particles = particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.lifetime--;
      particle.alpha = particle.lifetime / particle.maxLifetime;
      return particle.lifetime > 0;
    });

    // Collision detection
    const { projectilesThatHit, shipsThatDied: collisionDeaths } = detectProjectileCollisions(gameObjects.current.projectiles, ships);

    // Merge collision deaths with gravity well deaths
    collisionDeaths.forEach((deathInfo, shipId) => {
      if (!shipsThatDied.has(shipId)) {
        shipsThatDied.set(shipId, deathInfo);
      }
    });

    // Create explosions and particles for projectiles that hit BEFORE filtering them out
    projectilesThatHit.forEach((projId) => {
      const proj = gameObjects.current.projectiles.find((p) => p.id === projId);
      if (proj) {
        if (proj.specialType === 'EXPLOSIVE_BLAST') {
          createExplosion(proj.x, proj.y, proj.ownerId, proj.size * 2, proj.damage);
        } else if (!proj.piercing && !proj.isBeam) {
          // Hit particles for normal projectiles
          const weaponConfig = WEAPON_CONFIGS[proj.weaponType];
          createParticles(proj.x, proj.y, 5, weaponConfig.glowColor, 'spark', 4);
        }
      }
    });

    // Now filter out projectiles that hit (except piercing and beams)
    gameObjects.current.projectiles = gameObjects.current.projectiles.filter(
      (p) => !projectilesThatHit.has(p.id) || p.piercing || p.isBeam
    );

    // Trigger damage flash on ships that were hit
    ships.forEach((ship) => {
      projectilesThatHit.forEach((projId) => {
        const proj = gameObjects.current.projectiles.find((p) => p.id === projId);
        if (proj && proj.ownerId !== ship.id) {
          const dist = Math.sqrt((proj.x - ship.x) ** 2 + (proj.y - ship.y) ** 2);
          if (dist < ship.size + proj.size) {
            ship.damageFlashTime = Date.now();
          }
        }
      });
    });

    detectExplosionCollisions(explosions, ships, shipsThatDied);

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

    const collectedLoot = detectLootCollection(loot, ships);
    // Add particles for collected loot
    collectedLoot.forEach((lootId) => {
      const collected = loot.find(l => l.id === lootId);
      if (collected) {
        createParticles(collected.x, collected.y, 10, '#FFD700', 'glow', 6);
      }
    });
    gameObjects.current.loot = loot.filter((l) => !collectedLoot.has(l.id));

    if (player && Math.floor(player.cargo) !== playerCargo) {
      setPlayerCargo(Math.floor(player.cargo));
    }

    if (player && Math.floor(player.shieldEnergy) !== playerShieldEnergy) {
      setPlayerShieldEnergy(Math.floor(player.shieldEnergy));
    }

    if (player) {
      setCurrentWeapon(player.weapon);

      // Update special ability cooldown
      const weaponConfig = WEAPON_CONFIGS[player.weapon];
      const timeSinceLastSpecial = now - player.lastSpecialTime;
      const cooldownPercent = Math.min(100, (timeSinceLastSpecial / weaponConfig.specialCooldown) * 100);
      setSpecialCooldownPercent(cooldownPercent);
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

    gameObjects.current.explosions = explosions.filter((exp) => {
      exp.lifetime--;
      exp.radius = exp.maxRadius * (1 - (exp.lifetime / exp.maxLifetime) ** 2);
      return exp.lifetime > 0;
    });

    while (ships.size < MAX_BOTS + 1) {
      const defenderBases = bases.filter((b) => b.upgradeType === 'FIRE_RATE');
      const assignedBase = Math.random() < 0.2 ? defenderBases[Math.floor(Math.random() * defenderBases.length)] : null;
      const newBot = createShip(false, assignedBase);
      ships.set(newBot.id, newBot);
    }

    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, score, setScore, playerCargo, onWin, playerShieldEnergy, isMobile]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { ships, projectiles, stars, explosions, loot, bases, particles } = gameObjects.current;
    const player = ships.get(PLAYER_ID);
    if (!player) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    const camX = -player.x + canvas.width / 2 + screenShake.current.x;
    const camY = -player.y + canvas.height / 2 + screenShake.current.y;

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

    ctx.translate(camX, camY);

    // Draw game world border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Use the renderer for enhanced visuals
    const renderer = rendererRef.current;

    // All visual elements now rendered as SVG overlay, not on canvas
    // Only draw particles on canvas (simple effects)
    particles.forEach((particle) => renderer.drawParticle(particle));

    // Reset transformation for UI elements
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Update camera position for SVG overlay (only if changed significantly to reduce re-renders)
    if (Math.abs(camX - cameraPos.x) > 1 || Math.abs(camY - cameraPos.y) > 1) {
      setCameraPos({ x: camX, y: camY });
    }

    // Draw minimap
    renderer.drawMinimap(
      canvas.width - 220,
      20,
      200,
      200,
      GAME_WIDTH,
      GAME_HEIGHT,
      player,
      ships,
      bases,
      loot
    );

    // Draw screen flash
    if (screenFlash.current.intensity > 0) {
      renderer.drawScreenFlash(screenFlash.current.color, screenFlash.current.intensity);
    }

    // Draw scanlines (optional CRT effect)
    if (scanlinesEnabled) {
      renderer.drawScanlines(0.08);
    }
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

      const ctx = canvas.getContext('2d');
      if (ctx) {
        rendererRef.current = new CanvasRenderer(ctx);
      }
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
      { id: 'base1', x: 500, y: 500, radius: 200, color: '#FF4500', upgradeType: 'FIRE_RATE', pulsePhase: 0, rotationAngle: 0 },
      { id: 'base2', x: GAME_WIDTH - 500, y: 500, radius: 200, color: '#32CD32', upgradeType: 'SHIP_SPEED', pulsePhase: Math.PI * 2 / 3, rotationAngle: 0 },
      { id: 'base3', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 500, radius: 200, color: '#1E90FF', upgradeType: 'WEAPON_DAMAGE', pulsePhase: Math.PI * 4 / 3, rotationAngle: 0 },
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
    gameObjects.current.particles = [];
    setPlayerCargo(0);
    setTimeRemaining(WIN_TIME);

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      animationFrameId.current && cancelAnimationFrame(animationFrameId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const weaponConfig = WEAPON_CONFIGS[currentWeapon as keyof typeof WEAPON_CONFIGS];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair block" />

      {/* SVG overlay for all game elements */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 1,
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)' // GPU acceleration
        }}
      >
        <SVGFilters />

        {/* Bases */}
        {gameObjects.current.bases.map((base) => {
          const player = gameObjects.current.ships.get(PLAYER_ID);
          const currentLevel = player ? player.upgrades[base.upgradeType] : 0;
          const upgradeCost = BASE_UPGRADE_COST * (currentLevel + 1);
          return (
            <SVGBase
              key={base.id}
              base={base}
              cameraX={cameraPos.x}
              cameraY={cameraPos.y}
              upgradeLevel={currentLevel}
              upgradeCost={upgradeCost}
            />
          );
        })}

        {/* Loot */}
        {gameObjects.current.loot.map((loot) => (
          <SVGLoot
            key={loot.id}
            loot={loot}
            cameraX={cameraPos.x}
            cameraY={cameraPos.y}
          />
        ))}

        {/* Projectiles */}
        {gameObjects.current.projectiles.map((projectile) => (
          <SVGProjectile
            key={projectile.id}
            projectile={projectile}
            cameraX={cameraPos.x}
            cameraY={cameraPos.y}
          />
        ))}

        {/* Ships */}
        {Array.from(gameObjects.current.ships.values()).map((ship) => (
          <SVGShip
            key={ship.id}
            ship={ship}
            cameraX={cameraPos.x}
            cameraY={cameraPos.y}
          />
        ))}

        {/* Explosions */}
        {gameObjects.current.explosions.map((explosion) => (
          <SVGExplosion
            key={explosion.id}
            explosion={explosion}
            cameraX={cameraPos.x}
            cameraY={cameraPos.y}
          />
        ))}
      </svg>

      <div className={`absolute pointer-events-none ${isMobile ? 'top-1 left-1 text-xs' : 'top-5 left-5 text-2xl'} font-bold tracking-widest text-white`} style={{ textShadow: '2px 2px 4px #000' }}>
        <div>SCORE: {score}</div>
        <div>CARGO: {playerCargo}</div>
        {isMobile && (
          <div className="text-xs mt-1">
            WEAPON: {weaponConfig?.name || 'Unknown'}
          </div>
        )}
        {!isMobile && (
          <>
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

          {/* Cooldown Indicator */}
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">SPECIAL ABILITY</div>
            <div className="w-full h-3 bg-gray-700 border border-gray-500 relative overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${specialCooldownPercent}%`,
                  backgroundColor: specialCooldownPercent === 100 ? weaponConfig?.glowColor || '#00FF00' : '#666',
                  boxShadow: specialCooldownPercent === 100 ? `0 0 10px ${weaponConfig?.glowColor || '#00FF00'}` : 'none',
                }}
              />
            </div>
            <div className="text-xs text-center mt-1" style={{ color: specialCooldownPercent === 100 ? weaponConfig?.glowColor || '#00FF00' : '#999' }}>
              {specialCooldownPercent === 100 ? 'READY!' : `${Math.floor(specialCooldownPercent)}%`}
            </div>
          </div>

          {/* Weapon Selection */}
          <div className="mt-3 text-xs text-gray-400">
            <div className="mb-1">PRESS 1-7 TO SWITCH WEAPONS:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(WEAPON_CONFIGS).map(([key, config], index) => (
                <div
                  key={key}
                  className={`p-1 rounded ${currentWeapon === key ? 'bg-opacity-30' : 'bg-opacity-10'}`}
                  style={{
                    backgroundColor: currentWeapon === key ? config.color : '#333',
                    color: currentWeapon === key ? config.glowColor : '#888',
                    border: currentWeapon === key ? `1px solid ${config.glowColor}` : '1px solid #444',
                  }}
                >
                  {index + 1}: {config.name}
                </div>
              ))}
              </div>
            </div>
          </div>
        </>
        )}
      </div>

      <div className={`absolute text-right pointer-events-none ${isMobile ? 'top-1 right-1 text-xs' : 'top-5 right-5 text-2xl'} font-bold tracking-widest text-white`} style={{ textShadow: '2px 2px 4px #000' }}>
        <div>{isMobile ? `SIZE ${WIN_SIZE}` : `GOAL: REACH SIZE ${WIN_SIZE}`}</div>
        <div>
          {isMobile ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `OR SURVIVE: ${minutes}:${seconds.toString().padStart(2, '0')}`}
        </div>
      </div>

      <div className="absolute bottom-5 right-5 text-lg font-mono text-gray-500 pointer-events-none">V2.0</div>

      {!isMobile && (
        <div className="absolute bottom-5 left-5 text-sm text-white pointer-events-none">
          <div className="bg-black bg-opacity-50 p-2 rounded">
            <div className="font-bold mb-1">CONTROLS:</div>
            <div>MOUSE: Aim & Move</div>
            <div>LEFT CLICK: Special Ability</div>
            <div>SPACE: Activate Shield</div>
            <div>1-7: Switch Weapons</div>
            <div>C: Toggle Scanlines {scanlinesEnabled ? '(ON)' : '(OFF)'}</div>
            <div>M: Toggle Mobile Mode (for testing)</div>
            <div>D: Toggle Debug Panel</div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="absolute top-20 left-2 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-md z-50 border-2 border-yellow-400 pointer-events-none">
          <div className="flex justify-between items-center mb-2 border-b border-yellow-400 pb-1">
            <span className="font-bold text-yellow-400">DEBUG INFO (Press D to toggle)</span>
          </div>
          <div className="space-y-1">
            <div>Mode: <span className="text-cyan-400 font-bold">{isMobile ? 'MOBILE' : 'DESKTOP'}</span></div>
            <div>Force Mobile: <span className="text-cyan-400">{forceMobile ? 'YES' : 'NO'}</span></div>
            <div>Screen: <span className="text-cyan-400">{window.innerWidth}x{window.innerHeight}</span></div>
            <div>Touch Support: <span className="text-cyan-400">{('ontouchstart' in window) ? 'YES' : 'NO'}</span></div>
            <div>Current Weapon: <span className="text-cyan-400">{currentWeapon}</span></div>
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div className="font-bold text-yellow-400 mb-1">Recent Logs:</div>
              {debugInfo.map((log, i) => (
                <div key={i} className="text-green-400 text-[10px]">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Debug indicator */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 font-bold z-10 pointer-events-none"
           style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
        {isMobile ? (forceMobile ? 'MOBILE MODE (FORCED)' : 'MOBILE MODE') : 'DESKTOP MODE (Press M to toggle)'}
      </div>

      {isMobile && (
        <MobileControls
          onJoystickMove={handleJoystickMove}
          onShoot={handleMobileShoot}
          onShield={handleMobileShield}
          onWeaponSwitch={handleWeaponSwitch}
          shieldEnergy={playerShieldEnergy}
          maxShieldEnergy={maxPlayerShieldEnergy}
          currentWeapon={currentWeapon === 'PULSE_LASER' ? 'BULLET' : 'CANNON'}
        />
      )}
    </div>
  );
};

export default GameOptimized;
