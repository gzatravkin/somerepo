import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Ship, Projectile, Vector, Star, WeaponType, Explosion, Loot, Base, AIState, AIPersonality, UpgradeType } from '../types';
import { distance, getRandomColor, getRandomPosition } from '../utils/helpers';
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
const CANNON_THRESHOLD = 40;
const BASE_UPGRADE_COST = 50;
const WIN_SIZE = 150;
const WIN_TIME = 180; // 3 minutes

const Game: React.FC<GameProps> = ({ onGameOver, onWin, score, setScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameObjects = useRef<{
    ships: Map<string, Ship>;
    projectiles: Projectile[];
    stars: Star[];
    explosions: Explosion[];
    loot: Loot[];
    bases: Base[];
  }>({ ships: new Map(), projectiles: [], stars: [], explosions: [], loot: [], bases: [] });
  const mousePosition = useRef<Vector>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animationFrameId = useRef<number | null>(null);
  const [playerCargo, setPlayerCargo] = useState(0);
  const [playerShieldEnergy, setPlayerShieldEnergy] = useState(7);
  const [maxPlayerShieldEnergy, setMaxPlayerShieldEnergy] = useState(7);
  const [timeRemaining, setTimeRemaining] = useState(WIN_TIME);
  const nebulaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mobile controls state
  const [isMobile, setIsMobile] = useState(false);
  const [forceMobile, setForceMobile] = useState(false);
  const [currentWeapon, setCurrentWeapon] = useState<'BULLET' | 'CANNON'>('BULLET');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  const joystickInput = useRef<{ angle: number | null; distance: number }>({ angle: null, distance: 0 });
  const lastShootTime = useRef<number>(0);
  const autoShootInterval = useRef<NodeJS.Timeout | null>(null);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugInfo(prev => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
      return newLogs.slice(-10); // Keep last 10 logs
    });
  };


  const createShip = (isPlayer: boolean = false, assignedBase: Base | null = null): Ship => {
    const isElite = !isPlayer && Math.random() < 0.1; // 10% chance
    const size = isPlayer ? 20 : (isElite ? Math.random() * 15 + 25 : Math.random() * 15 + 10);
    const nonDefenderPersonalities: AIPersonality[] = ['AGGRESSOR', 'SCAVENGER', 'WANDERER'];
    const personality: AIPersonality = isElite ? 'AGGRESSOR' : (assignedBase ? 'DEFENDER' : nonDefenderPersonalities[Math.floor(Math.random() * nonDefenderPersonalities.length)]);

    // Shield energy calculation: smaller ships get more uses (7 for size 20, 2 for size 60+)
    const maxShieldEnergy = Math.max(2, Math.floor(7 * (40 / Math.max(size, 20))));

    return {
      id: isPlayer ? PLAYER_ID : `bot-${Math.random()}`,
      ...getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
      vx: 0, vy: 0, angle: 0,
      size,
      color: isElite ? '#FF00FF' : (isPlayer ? '#00BFFF' : getRandomColor()),
      isPlayer,
      lastShotTime: 0,
      shootCooldown: isElite ? 400 : (isPlayer ? 200 : 800),
      projectileDamage: size * (isElite ? 1.2 : 1),
      maxSpeed: (5 - size * 0.05) * (isElite ? 1.1 : 1),
      health: size * 5 * (isElite ? 1.5 : 1),
      maxHealth: size * 5 * (isElite ? 1.5 : 1),
      cargo: 0,
      isElite,
      upgrades: { 'FIRE_RATE': 0, 'SHIP_SPEED': 0, 'WEAPON_DAMAGE': 0 },
      // Shield properties
      shieldEnergy: maxShieldEnergy,
      maxShieldEnergy,
      shieldActive: false,
      shieldActivatedTime: 0,
      shieldCooldown: 0,
      lastShieldUse: 0,
      aiState: 'WANDERING',
      aiTarget: null,
      aiSecondaryTarget: null,
      wanderTarget: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
      aiPersonality: personality,
      aiParams: { 
        bravery: isElite ? 0.9 : Math.random(), 
        aggression: isElite ? 0.9 : Math.random(),
        reaction: isElite ? 0.8 : Math.random() * 0.6 + 0.2,
        precision: isElite ? 0.9 : Math.random() * 0.5 + 0.3
      },
      lastAIDecision: 0,
      aiFleeShootTimer: 0,
      assignedBase,
    };
  };

  const createProjectile = (owner: Ship): Projectile => {
    // Use current weapon for player, size-based for AI
    const weaponType: WeaponType = owner.isPlayer ? currentWeapon : (owner.size >= CANNON_THRESHOLD ? 'CANNON' : 'BULLET');

    console.log('Creating projectile:', { isPlayer: owner.isPlayer, weaponType, currentWeapon, ownerSize: owner.size });

    if (weaponType === 'CANNON') {
      const speed = 5;
      const projectileSize = owner.size / 3;
      return {
        id: `proj-${Math.random()}`,
        x: owner.x + Math.cos(owner.angle) * owner.size,
        y: owner.y + Math.sin(owner.angle) * owner.size,
        vx: Math.cos(owner.angle) * speed + owner.vx * 0.5,
        vy: Math.sin(owner.angle) * speed + owner.vy * 0.5,
        ownerId: owner.id,
        size: projectileSize,
        color: '#FF4500',
        damage: owner.projectileDamage * 0.5,
        lifetime: 60,
        weaponType: 'CANNON',
      };
    } else { // BULLET
      const speed = 10;
      const projectileSize = owner.size / 4;
      return {
        id: `proj-${Math.random()}`,
        x: owner.x + Math.cos(owner.angle) * owner.size,
        y: owner.y + Math.sin(owner.angle) * owner.size,
        vx: Math.cos(owner.angle) * speed + owner.vx,
        vy: Math.sin(owner.angle) * speed + owner.vy,
        ownerId: owner.id,
        size: projectileSize,
        color: owner.color,
        damage: owner.projectileDamage,
        lifetime: 100,
        weaponType: 'BULLET',
      };
    }
  };

  const createExplosion = (x: number, y: number, ownerId: string, size: number, damage: number) => {
    const explosion: Explosion = {
      id: `expl-${Math.random()}`, x, y, ownerId,
      radius: 0, maxRadius: size * 6, damage,
      lifetime: 25, maxLifetime: 25, damageDealt: false,
    };
    gameObjects.current.explosions.push(explosion);
  };
  
  const createLoot = (x: number, y: number, value: number) => {
    gameObjects.current.loot.push({
      id: `loot-${Math.random()}`, x, y, value,
      radius: Math.max(4, Math.min(20, 3 + value / 4)),
    });
  };

  const shoot = (shipId: string) => {
    const ship = gameObjects.current.ships.get(shipId);
    if (!ship) return;
    const now = Date.now();
    // Use current weapon for player, size-based for AI
    const weaponType = ship.isPlayer ? currentWeapon : (ship.size >= CANNON_THRESHOLD ? 'CANNON' : 'BULLET');
    const cooldown = weaponType === 'CANNON' ? ship.shootCooldown * 2.5 : ship.shootCooldown;

    console.log('Shoot called:', { shipId, isPlayer: ship.isPlayer, weaponType, currentWeapon });

    if (now - ship.lastShotTime > cooldown) {
      gameObjects.current.projectiles.push(createProjectile(ship));
      ship.lastShotTime = now;
    }
  };

  const updateBotAI = (ship: Ship) => {
    const { ships, loot, bases, projectiles } = gameObjects.current;
    const perceptionRadius = 600;
    const now = Date.now();

    // Check for incoming projectiles and activate shield if needed
    const incomingProjectiles = projectiles.filter(p => p.ownerId !== ship.id);
    let shouldUseShield = false;
    
    incomingProjectiles.forEach(proj => {
      const distToProjectile = distance(ship, proj);
      const projSpeed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
      const timeToImpact = distToProjectile / Math.max(projSpeed, 1);
      
      // If projectile will hit within 0.3 seconds and ship has shield energy
      if (timeToImpact < 0.3 && distToProjectile < ship.size * 2.5 && ship.shieldEnergy > 0) {
        // Use shield based on AI personality and reaction time
        const useChance = ship.aiParams.bravery * 0.6 + ship.aiParams.reaction * 0.4 + (ship.isElite ? 0.3 : 0.1);
        if (Math.random() < useChance) {
          shouldUseShield = true;
        }
      }
    });

    if (shouldUseShield) {
      activateShield(ship.id);
    }

    // Only make major AI decisions based on reaction time
    const reactionDelay = (1 - ship.aiParams.reaction) * 500 + 200; // 200-700ms delay
    const shouldMakeDecision = now - ship.lastAIDecision > reactionDelay;

    // --- Perception ---
    let nearestBiggerThreat: Ship | null = null;
    let bestPrey: Ship | null = null;
    let nearestLoot: Loot | null = null;
    let distToThreat = Infinity;
    let preyScore = -Infinity;
    let distToLoot = Infinity;

    ships.forEach(other => {
        if (other.id === ship.id) return;
        const d = distance(ship, other);
        if (d > perceptionRadius) return;

        // Threat Assessment: A threat is significantly larger or another elite
        const sizeThreatRatio = 1.15 + ship.aiParams.bravery * 0.2; // Braver ships have higher threshold
        if ((other.size > ship.size * sizeThreatRatio) || (other.isElite && ship.size < other.size * 1.3)) {
            if (d < distToThreat) {
                distToThreat = d;
                nearestBiggerThreat = other;
            }
        }

        // Prey Assessment: Score potential targets
        const sizeDifference = ship.size - other.size;
        const canAttack = sizeDifference > -ship.size * (0.3 - ship.aiParams.bravery * 0.2);
        if (canAttack) {
            let currentPreyScore = 1000 - d;
            currentPreyScore += sizeDifference * 5;
            if (other.isPlayer) {
                currentPreyScore += 200 * ship.aiParams.aggression;
            }
            // Add some randomness to prey selection
            currentPreyScore += (Math.random() - 0.5) * 100;
            if (currentPreyScore > preyScore) {
                preyScore = currentPreyScore;
                bestPrey = other;
            }
        }
    });

    loot.forEach(l => {
        const d = distance(ship, l);
        if(d < perceptionRadius && d < distToLoot) {
            distToLoot = d;
            nearestLoot = l;
        }
    });

    const cargoFull = ship.cargo >= ship.size * 2;
    let closestBase: Base | null = null;
    if (cargoFull) {
        let distToBase = Infinity;
        bases.forEach(b => {
            const d = distance(ship, b);
            if (d < distToBase) {
                distToBase = d;
                closestBase = b;
            }
        });
    }

    // --- State Decision (only if reaction time allows) ---
    if (shouldMakeDecision) {
        ship.lastAIDecision = now;
        
        // Check if should flee (with chance to fight back)
        const fleeThreshold = (1 - ship.aiParams.bravery) * 0.8 + 0.2;
        if (nearestBiggerThreat && distToThreat < perceptionRadius * fleeThreshold) {
            // Smart flee behavior: sometimes try to shoot while fleeing
            if (ship.aiParams.aggression > 0.5 && bestPrey && Math.random() < 0.4) {
                ship.aiState = 'FLEEING_AND_SHOOTING';
                ship.aiTarget = nearestBiggerThreat;
                ship.aiSecondaryTarget = bestPrey;
                ship.aiFleeShootTimer = now;
            } else {
                ship.aiState = 'FLEEING';
                ship.aiTarget = nearestBiggerThreat;
                ship.aiSecondaryTarget = null;
            }
            return;
        }

        // Defender behavior
        if (ship.aiPersonality === 'DEFENDER' && ship.assignedBase) {
            let potentialTarget: Ship | null = null;
            let targetDist = Infinity;
            ships.forEach(other => {
                if (other.id === ship.id) return;
                const d = distance(other, ship.assignedBase!);
                if (d < ship.assignedBase!.radius * 1.5 && other.size < ship.size * 1.4) {
                    const distToShip = distance(ship, other);
                    if (distToShip < targetDist) {
                        targetDist = distToShip;
                        potentialTarget = other;
                    }
                }
            });

            if (potentialTarget) {
                ship.aiState = 'HUNTING';
                ship.aiTarget = potentialTarget;
                ship.aiSecondaryTarget = null;
            } else if (distance(ship, ship.assignedBase) > 50) {
                ship.aiState = 'DEFENDING_BASE';
                ship.aiTarget = ship.assignedBase;
                ship.aiSecondaryTarget = null;
            } else {
                ship.aiState = 'WANDERING';
                ship.aiSecondaryTarget = null;
            }
            return;
        }

        // Standard personalities with more variation
        if (cargoFull && closestBase) {
            ship.aiState = 'RETURNING_TO_BASE';
            ship.aiTarget = closestBase;
            ship.aiSecondaryTarget = null;
            return;
        }

        const personalityRandomness = Math.random();
        switch (ship.aiPersonality) {
            case 'SCAVENGER':
                if (nearestLoot && (personalityRandomness < 0.7 || !bestPrey)) {
                    ship.aiState = 'COLLECTING_LOOT';
                    ship.aiTarget = nearestLoot;
                } else if (bestPrey && ship.aiParams.bravery > 0.4) {
                    ship.aiState = 'HUNTING';
                    ship.aiTarget = bestPrey;
                } else {
                    ship.aiState = 'WANDERING';
                }
                break;
            case 'AGGRESSOR':
                if (bestPrey && personalityRandomness < 0.8) {
                    ship.aiState = 'HUNTING';
                    ship.aiTarget = bestPrey;
                } else if (nearestLoot) {
                    ship.aiState = 'COLLECTING_LOOT';
                    ship.aiTarget = nearestLoot;
                } else {
                    ship.aiState = 'WANDERING';
                }
                break;
            default: // WANDERER
                const aggressionThreshold = ship.aiParams.aggression * 0.7;
                if (bestPrey && personalityRandomness < aggressionThreshold) {
                    ship.aiState = 'HUNTING';
                    ship.aiTarget = bestPrey;
                } else if (nearestLoot && personalityRandomness < 0.6) {
                    ship.aiState = 'COLLECTING_LOOT';
                    ship.aiTarget = nearestLoot;
                } else {
                    ship.aiState = 'WANDERING';
                }
                break;
        }
        ship.aiSecondaryTarget = null;
    }
  };

  const activateShield = (shipId: string) => {
    const ship = gameObjects.current.ships.get(shipId);
    if (!ship) return;

    const now = Date.now();
    if (ship.shieldEnergy > 0 && !ship.shieldActive) {
      ship.shieldActive = true;
      ship.shieldActivatedTime = now;
      ship.shieldEnergy--;
      ship.lastShieldUse = now;
    }
  };

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 0) shoot(PLAYER_ID);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mousePosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    addDebugLog(`Key pressed: ${event.code}`);
    if (event.code === 'Space') {
      event.preventDefault();
      activateShield(PLAYER_ID);
    }
    // Weapon switching with 1 and 2 keys
    if (event.code === 'Digit1') {
      addDebugLog('Switching to BULLET');
      setCurrentWeapon('BULLET');
    }
    if (event.code === 'Digit2') {
      addDebugLog('Switching to CANNON');
      setCurrentWeapon('CANNON');
    }
    // Toggle weapon with Tab
    if (event.code === 'Tab') {
      event.preventDefault();
      setCurrentWeapon(prev => {
        const newWeapon = prev === 'BULLET' ? 'CANNON' : 'BULLET';
        addDebugLog(`Weapon switched from ${prev} to ${newWeapon}`);
        return newWeapon;
      });
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
    if (now - lastShootTime.current > 100) { // Prevent too rapid firing
      shoot(PLAYER_ID);
      lastShootTime.current = now;
    }
  }, []);

  const handleMobileShield = useCallback(() => {
    activateShield(PLAYER_ID);
  }, []);

  const handleWeaponSwitch = useCallback(() => {
    setCurrentWeapon(prev => {
      const newWeapon = prev === 'BULLET' ? 'CANNON' : 'BULLET';
      addDebugLog(`Weapon switched from ${prev} to ${newWeapon}`);
      return newWeapon;
    });
  }, []);

  // Touch event handlers for canvas (tap anywhere to shoot on mobile)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isMobile) return;

    // Check if touch is on a control element
    const target = event.target as HTMLElement;
    if (target.closest('.mobile-controls')) return;

    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      mousePosition.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isMobile) return;

    const target = event.target as HTMLElement;
    if (target.closest('.mobile-controls')) return;

    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      mousePosition.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [isMobile]);

  useEffect(() => {
    addDebugLog('=== Initial URL check ===');
    // Check URL parameter for forcing mobile mode
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
      setTimeRemaining(prev => {
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
      if (autoShootInterval.current) clearInterval(autoShootInterval.current);
    };
  }, [handleMouseMove, handleMouseDown, handleKeyDown, handleTouchStart, handleTouchMove, onWin, score, forceMobile]);

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

      // Use joystick input for mobile, mouse for desktop
      if (isMobile && joystickInput.current.angle !== null) {
        // Mobile: joystick controls movement direction
        const acceleration = 0.1 * joystickInput.current.distance;
        player.angle = joystickInput.current.angle;
        player.vx += Math.cos(player.angle) * acceleration;
        player.vy += Math.sin(player.angle) * acceleration;

        // Keep aiming at touch position on screen
        const targetX = mousePosition.current.x + viewport.x;
        const targetY = mousePosition.current.y + viewport.y;
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        player.angle = Math.atan2(dy, dx);
      } else if (!isMobile) {
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

    // Update shield mechanics for all ships
    const now = Date.now();
    ships.forEach(ship => {
      // Deactivate shield after 0.2 seconds
      if (ship.shieldActive && now - ship.shieldActivatedTime > 200) {
        ship.shieldActive = false;
      }

      // Check if ship is in a base for fast recovery
      let isInBase = false;
      bases.forEach(base => {
        if (distance(ship, base) < base.radius) {
          isInBase = true;
        }
      });

      // Shield energy recovery (20 seconds normally, 2 seconds in base)
      const recoveryTime = isInBase ? 2000 : 20000;
      if (ship.shieldEnergy < ship.maxShieldEnergy && now - ship.lastShieldUse > recoveryTime / ship.maxShieldEnergy) {
        ship.shieldEnergy = Math.min(ship.maxShieldEnergy, ship.shieldEnergy + (1 / 60)); // Gradual recovery per frame
      }

      // Health recovery in base
      if (isInBase && ship.health < ship.maxHealth) {
        ship.health = Math.min(ship.maxHealth, ship.health + ship.maxHealth * 0.02); // 2% per frame
      }
    });

    // Update all ships
    ships.forEach(ship => {
      if (!ship.isPlayer) {
        updateBotAI(ship);
        let targetAngle: number | undefined;
        const aiAcceleration = 0.05;

        switch (ship.aiState) {
          case 'FLEEING':
            if (ship.aiTarget) {
              // Flee directly away from threat
              targetAngle = Math.atan2(ship.y - ship.aiTarget.y, ship.x - ship.aiTarget.x);
              // Add some imprecision based on AI skill
              const fleeImprecision = (1 - ship.aiParams.precision) * 0.3;
              targetAngle += (Math.random() - 0.5) * fleeImprecision;
            }
            break;
          case 'FLEEING_AND_SHOOTING':
            const fleeShootCycleTime = 1000 + Math.random() * 1000; // 1-2 second cycles
            const cycleProgress = (now - ship.aiFleeShootTimer) % fleeShootCycleTime;
            const shootPhase = cycleProgress < 300; // 300ms shooting phase
            
            if (shootPhase && ship.aiSecondaryTarget) {
              // Briefly turn to shoot at secondary target
              targetAngle = Math.atan2(ship.aiSecondaryTarget.y - ship.y, ship.aiSecondaryTarget.x - ship.x);
              const shootDistance = distance(ship, ship.aiSecondaryTarget as Ship);
              if (shootDistance < 400 + ship.aiParams.aggression * 200) {
                shoot(ship.id);
              }
            } else if (ship.aiTarget) {
              // Continue fleeing from primary threat
              targetAngle = Math.atan2(ship.y - ship.aiTarget.y, ship.x - ship.aiTarget.x);
              const fleeImprecision = (1 - ship.aiParams.precision) * 0.4;
              targetAngle += (Math.random() - 0.5) * fleeImprecision;
            }
            break;
          case 'HUNTING':
            if (ship.aiTarget) {
              targetAngle = Math.atan2(ship.aiTarget.y - ship.y, ship.aiTarget.x - ship.x);
              // Add hunting imprecision
              const huntImprecision = (1 - ship.aiParams.precision) * 0.2;
              targetAngle += (Math.random() - 0.5) * huntImprecision;
              
              const huntDistance = distance(ship, ship.aiTarget as Ship);
              const shootRange = 300 + ship.aiParams.aggression * 250;
              if (huntDistance < shootRange) {
                // Vary shooting frequency based on precision and aggression
                const shootChance = ship.aiParams.precision * 0.3 + ship.aiParams.aggression * 0.4;
                if (Math.random() < shootChance) {
                  shoot(ship.id);
                }
              }
            }
            break;
          case 'COLLECTING_LOOT':
          case 'RETURNING_TO_BASE':
          case 'DEFENDING_BASE':
             if (ship.aiTarget) {
               targetAngle = Math.atan2(ship.aiTarget.y - ship.y, ship.aiTarget.x - ship.x);
               // Add navigation imprecision
               const navImprecision = (1 - ship.aiParams.precision) * 0.15;
               targetAngle += (Math.random() - 0.5) * navImprecision;
             }
             break;
          case 'WANDERING':
            if (distance(ship, ship.wanderTarget) < 100) {
              ship.wanderTarget = getRandomPosition(GAME_WIDTH, GAME_HEIGHT);
            }
            targetAngle = Math.atan2(ship.wanderTarget.y - ship.y, ship.wanderTarget.x - ship.x);
            // Wandering has the most imprecision
            const wanderImprecision = (1 - ship.aiParams.precision) * 0.5;
            targetAngle += (Math.random() - 0.5) * wanderImprecision;
            break;
        }

        if (targetAngle !== undefined) {
          ship.angle = targetAngle;
          ship.vx += Math.cos(ship.angle) * aiAcceleration;
          ship.vy += Math.sin(ship.angle) * aiAcceleration;
          const aiSpeed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
          if (aiSpeed > ship.maxSpeed) {
            ship.vx = (ship.vx / aiSpeed) * ship.maxSpeed;
            ship.vy = (ship.vy / aiSpeed) * ship.maxSpeed;
          }
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
    projectiles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
        const isAlive = p.lifetime > 0 && p.x > 0 && p.x < GAME_WIDTH && p.y > 0 && p.y < GAME_HEIGHT;
        if (isAlive) {
            nextProjectiles.push(p);
        } else if (p.weaponType === 'CANNON') {
            createExplosion(p.x, p.y, p.ownerId, p.size, p.damage);
        }
    });
    gameObjects.current.projectiles = nextProjectiles;

    // Collision detection & Damage
    const projectilesThatHit = new Set<string>();
    const shipsThatDied = new Map<string, { killerId: string; size: number }>();

    gameObjects.current.projectiles.forEach(proj => {
        if (projectilesThatHit.has(proj.id)) return;
        ships.forEach(ship => {
            if (ship.id === proj.ownerId || shipsThatDied.has(ship.id)) return;
            if (distance(proj, ship) < ship.size) {
                // Only damage if shield is not active
                if (!ship.shieldActive) {
                    ship.health -= proj.damage;
                    if (ship.health <= 0) shipsThatDied.set(ship.id, { killerId: proj.ownerId, size: ship.size });
                }
                projectilesThatHit.add(proj.id);
                if (proj.weaponType === 'CANNON') createExplosion(proj.x, proj.y, proj.ownerId, proj.size, proj.damage);
            }
        });
    });
    gameObjects.current.projectiles = gameObjects.current.projectiles.filter(p => !projectilesThatHit.has(p.id));

    explosions.forEach(exp => {
        if (!exp.damageDealt) {
            ships.forEach(ship => {
                if (ship.id === exp.ownerId || shipsThatDied.has(ship.id)) return;
                if (distance(exp, ship) < exp.maxRadius + ship.size) {
                    // Only damage if shield is not active
                    if (!ship.shieldActive) {
                        ship.health -= exp.damage;
                        if (ship.health <= 0 && !shipsThatDied.has(ship.id)) shipsThatDied.set(ship.id, { killerId: exp.ownerId, size: ship.size });
                    }
                }
            });
            exp.damageDealt = true;
        }
    });

    if (shipsThatDied.size > 0) {
        shipsThatDied.forEach((deathInfo, deadShipId) => {
            const deadShip = ships.get(deadShipId);
            if(deadShip) createLoot(deadShip.x, deadShip.y, deadShip.size);
            ships.delete(deadShipId);
        });
    }
    
    // Loot collection
    const collectedLoot = new Set<string>();
    ships.forEach(ship => {
      loot.forEach(l => {
        if (collectedLoot.has(l.id)) return;
        if (distance(ship, l) < ship.size + l.radius) {
          ship.cargo += l.value;
          collectedLoot.add(l.id);
        }
      });
    });
    gameObjects.current.loot = loot.filter(l => !collectedLoot.has(l.id));

    if (player && Math.floor(player.cargo) !== playerCargo) {
        setPlayerCargo(Math.floor(player.cargo));
    }

    // Update shield energy UI
    if (player && Math.floor(player.shieldEnergy) !== playerShieldEnergy) {
        setPlayerShieldEnergy(Math.floor(player.shieldEnergy));
    }


    // Base docking and upgrades
    ships.forEach(ship => {
      bases.forEach(base => {
        if (distance(ship, base) < base.radius) {
            const currentLevel = ship.upgrades[base.upgradeType];
            const upgradeCost = BASE_UPGRADE_COST * (currentLevel + 1);

            if (ship.cargo >= upgradeCost) {
                ship.cargo -= upgradeCost;
                ship.upgrades[base.upgradeType]++;

                const sizeIncrease = 5;
                ship.size += sizeIncrease;
                ship.maxHealth += sizeIncrease * 5;
                ship.health = ship.maxHealth;
                ship.maxSpeed = Math.max(1, 5 - ship.size * 0.05);

                switch (base.upgradeType) {
                    case 'FIRE_RATE': ship.shootCooldown = Math.max(100, ship.shootCooldown * 0.95); break;
                    case 'SHIP_SPEED': ship.maxSpeed *= 1.05; break;
                    case 'WEAPON_DAMAGE': ship.projectileDamage += sizeIncrease; break;
                }
                if (ship.isPlayer) {
                    setScore(Math.floor(ship.size));
                    setPlayerCargo(Math.floor(ship.cargo));
                    if (ship.size >= WIN_SIZE) {
                        onWin(Math.floor(ship.size));
                    }
                }
            }
        }
      });
    });
    
    gameObjects.current.explosions = explosions.filter(exp => {
        exp.lifetime--;
        exp.radius = exp.maxRadius * (1 - (exp.lifetime / exp.maxLifetime) ** 2);
        return exp.lifetime > 0;
    });

    while (ships.size < MAX_BOTS + 1) {
        const defenderBases = bases.filter(b => b.upgradeType === 'FIRE_RATE');
        const assignedBase = Math.random() < 0.2 ? defenderBases[Math.floor(Math.random() * defenderBases.length)] : null;
        const newBot = createShip(false, assignedBase);
        ships.set(newBot.id, newBot);
    }

    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, score, setScore, playerCargo, onWin, isMobile]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { ships, projectiles, stars, explosions, loot, bases } = gameObjects.current;
    const player = ships.get(PLAYER_ID);
    if (!player) return;

    // Clear the entire canvas first to prevent rendering artifacts
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const camX = -player.x + canvas.width / 2;
    const camY = -player.y + canvas.height / 2;
    
    // Draw Nebula (Deepest layer, moves slowest)
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
    
    // Draw Stars with parallax effect
    for (let i = 3; i >= 1; i--) {
        ctx.save();
        ctx.translate(camX / i, camY / i);
        stars.filter(s => s.layer === i).forEach(star => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * (1 - (i-1)*0.2) })`; // Fainter further away
          ctx.fill();
        });
        ctx.restore();
    }
    
    // Translate for main game objects
    ctx.translate(camX, camY);

    bases.forEach(base => {
        ctx.beginPath();
        ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
        ctx.fillStyle = base.color + '33'; // transparent
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
        const currentLevel = player.upgrades[base.upgradeType];
        const costText = `COST: ${BASE_UPGRADE_COST * (currentLevel + 1)} CARGO`;

        ctx.fillText(upgradeText, base.x, base.y - 20);
        ctx.font = '20px sans-serif';
        ctx.fillText(costText, base.x, base.y + 20);
        ctx.shadowBlur = 0;
    });

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    loot.forEach(l => {
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.weaponType === 'CANNON' ? '#FF4500' : p.color;
        ctx.shadowColor = p.weaponType === 'CANNON' ? '#FF4500' : p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    ships.forEach(ship => {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        
        if (ship.isElite) {
          ctx.shadowColor = ship.color;
          ctx.shadowBlur = 20;
        }

        ctx.beginPath();
        ctx.arc(0, 0, ship.size, 0, Math.PI * 2);
        ctx.fillStyle = ship.color;
        ctx.fill();

        ctx.shadowBlur = 0; // Reset shadow before stroke
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw shield effect if active
        if (ship.shieldActive) {
          ctx.beginPath();
          ctx.arc(0, 0, ship.size + 8, 0, Math.PI * 2);
          const shieldGradient = ctx.createRadialGradient(0, 0, ship.size, 0, 0, ship.size + 8);
          shieldGradient.addColorStop(0, 'rgba(0, 150, 255, 0.1)');
          shieldGradient.addColorStop(1, 'rgba(0, 150, 255, 0.8)');
          ctx.fillStyle = shieldGradient;
          ctx.fill();
          
          ctx.strokeStyle = '#00BFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00BFFF';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        
        ctx.save();
        ctx.rotate(ship.angle);
        ctx.beginPath();
        ctx.moveTo(-ship.size * 0.8, 0);
        ctx.lineTo(-ship.size * 1.2, ship.size * 0.5);
        ctx.lineTo(-ship.size * 1.2, -ship.size * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#ff9900';
        ctx.fill();
        ctx.restore();
        
        if (ship.health < ship.maxHealth) {
            const barWidth = ship.size * 2;
            const barHeight = 5;
            ctx.fillStyle = '#333';
            ctx.fillRect(-barWidth/2, ship.size + 10, barWidth, barHeight);
            ctx.fillStyle = ship.health / ship.maxHealth > 0.5 ? 'lightgreen' : (ship.health / ship.maxHealth > 0.2 ? 'yellow' : 'red');
            ctx.fillRect(-barWidth/2, ship.size + 10, barWidth * (ship.health / ship.maxHealth), barHeight);
        }
        ctx.restore();
    });
    
    explosions.forEach(exp => {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
    });
  };
  
  const drawNebula = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const colors = ["#4a0e6c", "#0a0a2a", "#6a1b9a", "#1a237e"];
    ctx.fillStyle = '#00031a';
    ctx.fillRect(0, 0, width, height);

    // Use seeded random for consistent pattern
    const seed = 12345;
    let rng = seed;
    const seededRandom = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    for (let i = 0; i < 75; i++) {
        // Create seamless tiling by wrapping coordinates
        const baseX = seededRandom() * width;
        const baseY = seededRandom() * height;
        const radius = seededRandom() * 200 + 50;
        const color = colors[Math.floor(seededRandom() * colors.length)];
        
        // Draw the main nebula cloud
        const grad = ctx.createRadialGradient(baseX, baseY, 0, baseX, baseY, radius);
        grad.addColorStop(0, `${color}80`);
        grad.addColorStop(0.5, `${color}40`);
        grad.addColorStop(1, `${color}00`);
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add wrapping copies for seamless tiling
        const wrapOffsets = [
          [-width, -height], [0, -height], [width, -height],
          [-width, 0], [width, 0],
          [-width, height], [0, height], [width, height]
        ];
        
        wrapOffsets.forEach(([offsetX, offsetY]) => {
          const wrappedX = baseX + offsetX;
          const wrappedY = baseY + offsetY;
          
          // Only draw if the wrapped cloud would be visible in the canvas
          if (wrappedX + radius > 0 && wrappedX - radius < width && 
              wrappedY + radius > 0 && wrappedY - radius < height) {
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
      x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT,
      radius: Math.random() * 1.5, alpha: Math.random() * 0.5 + 0.5,
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
        { id: 'base3', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 500, radius: 200, color: '#1E90FF', upgradeType: 'WEAPON_DAMAGE'},
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Debug Panel */}
      {showDebug && (
        <div className="absolute top-20 left-2 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-md z-50 border-2 border-yellow-400">
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

      {/* Top Left HUD */}
      <div className={`absolute ${isMobile ? 'top-1 left-1 text-xs' : 'top-5 left-5 text-2xl'} font-bold tracking-wide text-white z-10`}
           style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        <div>SCORE: {score}</div>
        <div>CARGO: {playerCargo}</div>
        {isMobile && (
          <div className="text-xs mt-1">
            WEAPON: {currentWeapon}
          </div>
        )}
        {!isMobile && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">WEAPON: {currentWeapon}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">SHIELD:</span>
              <div className="flex gap-1">
                {Array.from({ length: maxPlayerShieldEnergy }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-6 border ${
                      i < playerShieldEnergy
                        ? 'bg-blue-400 border-blue-300'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top Right HUD */}
      <div className={`absolute ${isMobile ? 'top-1 right-1 text-xs' : 'top-5 right-5 text-2xl'} font-bold tracking-wide text-white text-right z-10`}
           style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        <div>SIZE: {WIN_SIZE}</div>
        <div>{minutes}:{seconds.toString().padStart(2, '0')}</div>
      </div>

      {/* Debug indicator */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 font-bold z-10"
           style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
        {isMobile ? (forceMobile ? 'MOBILE MODE (FORCED)' : 'MOBILE MODE') : 'DESKTOP MODE (Press M to toggle)'}
      </div>

      {!isMobile && (
        <div className="absolute bottom-5 right-5 text-lg font-mono text-gray-500">
          V1.1
        </div>
      )}

      {isMobile && (
        <MobileControls
          onJoystickMove={handleJoystickMove}
          onShoot={handleMobileShoot}
          onShield={handleMobileShield}
          onWeaponSwitch={handleWeaponSwitch}
          shieldEnergy={playerShieldEnergy}
          maxShieldEnergy={maxPlayerShieldEnergy}
          currentWeapon={currentWeapon}
        />
      )}
    </div>
  );
};

export default Game;