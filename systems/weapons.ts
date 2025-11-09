import { WeaponType, WeaponConfig } from '../types';

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  // === FANTASY WEAPONS ===
  SWORD: {
    type: 'SWORD',
    name: 'Iron Sword',
    damage: 35,
    fireRate: 400,
    projectileSpeed: 0,
    projectileSize: 0,
    range: 1.5, // Melee range in tiles
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 2,
    isMelee: true,
    color: '#C0C0C0'
  },
  BOW: {
    type: 'BOW',
    name: 'Longbow',
    damage: 25,
    fireRate: 600,
    projectileSpeed: 8,
    projectileSize: 6,
    range: 15,
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 0.5,
    isMelee: false,
    color: '#8B4513'
  },
  CROSSBOW: {
    type: 'CROSSBOW',
    name: 'Heavy Crossbow',
    damage: 40,
    fireRate: 1000,
    projectileSpeed: 12,
    projectileSize: 8,
    range: 20,
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 1.5,
    isMelee: false,
    color: '#654321'
  },
  STAFF: {
    type: 'STAFF',
    name: 'Wizard Staff',
    damage: 20,
    fireRate: 500,
    projectileSpeed: 6,
    projectileSize: 10,
    range: 12,
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 0,
    isMelee: false,
    color: '#9370DB'
  },
  DAGGER: {
    type: 'DAGGER',
    name: 'Shadow Dagger',
    damage: 20,
    fireRate: 200,
    projectileSpeed: 0,
    projectileSize: 0,
    range: 1.2,
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 0.5,
    isMelee: true,
    color: '#696969'
  },

  // === MODERN WEAPONS ===
  PISTOL: {
    type: 'PISTOL',
    name: '9mm Pistol',
    damage: 22,
    fireRate: 300,
    projectileSpeed: 15,
    projectileSize: 4,
    range: 18,
    spreadAngle: 0.1,
    projectileCount: 1,
    knockback: 0.3,
    isMelee: false,
    ammoType: '9mm',
    color: '#FFD700'
  },
  SHOTGUN: {
    type: 'SHOTGUN',
    name: 'Combat Shotgun',
    damage: 15,
    fireRate: 800,
    projectileSpeed: 10,
    projectileSize: 3,
    range: 10,
    spreadAngle: 0.4,
    projectileCount: 6,
    knockback: 3,
    isMelee: false,
    ammoType: '12 gauge',
    color: '#FF4500'
  },
  RIFLE: {
    type: 'RIFLE',
    name: 'Assault Rifle',
    damage: 18,
    fireRate: 150,
    projectileSpeed: 18,
    projectileSize: 4,
    range: 25,
    spreadAngle: 0.08,
    projectileCount: 1,
    knockback: 0.2,
    isMelee: false,
    ammoType: '5.56mm',
    color: '#FFA500'
  },
  SMG: {
    type: 'SMG',
    name: 'Submachine Gun',
    damage: 12,
    fireRate: 100,
    projectileSpeed: 14,
    projectileSize: 3,
    range: 15,
    spreadAngle: 0.15,
    projectileCount: 1,
    knockback: 0.1,
    isMelee: false,
    ammoType: '9mm',
    color: '#FFFF00'
  },
  SNIPER: {
    type: 'SNIPER',
    name: 'Sniper Rifle',
    damage: 80,
    fireRate: 1500,
    projectileSpeed: 25,
    projectileSize: 5,
    range: 35,
    spreadAngle: 0,
    projectileCount: 1,
    knockback: 2,
    isMelee: false,
    ammoType: '.50 cal',
    color: '#00CED1'
  },

  // === SPECIAL WEAPONS ===
  MAGIC_WAND: {
    type: 'MAGIC_WAND',
    name: 'Arcane Wand',
    damage: 15,
    fireRate: 250,
    projectileSpeed: 7,
    projectileSize: 8,
    range: 14,
    spreadAngle: 0.2,
    projectileCount: 3,
    knockback: 0,
    isMelee: false,
    color: '#FF00FF'
  },
  FLAMETHROWER: {
    type: 'FLAMETHROWER',
    name: 'Flamethrower',
    damage: 8,
    fireRate: 50,
    projectileSpeed: 5,
    projectileSize: 6,
    range: 8,
    spreadAngle: 0.3,
    projectileCount: 1,
    knockback: 0,
    isMelee: false,
    ammoType: 'fuel',
    color: '#FF6347'
  }
};

export function getWeaponConfig(type: WeaponType): WeaponConfig {
  return WEAPONS[type];
}
