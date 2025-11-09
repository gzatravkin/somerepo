import { Dungeon, Room, Tile } from '../types';

// Dungeon generation using BSP (Binary Space Partitioning) and room connection

export function generateDungeon(width: number, height: number): Dungeon {
  const tiles: Tile[][] = [];

  // Initialize with walls
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        type: 'WALL',
        x,
        y,
        variant: Math.floor(Math.random() * 3)
      };
    }
  }

  // Generate rooms
  const rooms = generateRooms(width, height, 6, 12); // 6-12 rooms

  // Carve out rooms
  rooms.forEach(room => {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          tiles[y][x] = {
            type: 'FLOOR',
            x,
            y,
            variant: Math.floor(Math.random() * 4)
          };
        }
      }
    }
  });

  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    connectRooms(tiles, rooms[i], rooms[i + 1]);
  }

  // Add entrance in first room
  const firstRoom = rooms[0];
  tiles[firstRoom.centerY][firstRoom.centerX] = {
    type: 'ENTRANCE',
    x: firstRoom.centerX,
    y: firstRoom.centerY
  };

  // Add exit in last room
  const lastRoom = rooms[rooms.length - 1];
  tiles[lastRoom.centerY][lastRoom.centerX] = {
    type: 'EXIT',
    x: lastRoom.centerX,
    y: lastRoom.centerY
  };

  return { width, height, tiles, rooms };
}

function generateRooms(dungeonWidth: number, dungeonHeight: number, minRooms: number, maxRooms: number): Room[] {
  const rooms: Room[] = [];
  const numRooms = minRooms + Math.floor(Math.random() * (maxRooms - minRooms));

  for (let i = 0; i < numRooms; i++) {
    const width = 5 + Math.floor(Math.random() * 8); // 5-12 tiles wide
    const height = 5 + Math.floor(Math.random() * 8); // 5-12 tiles tall
    const x = 2 + Math.floor(Math.random() * (dungeonWidth - width - 4));
    const y = 2 + Math.floor(Math.random() * (dungeonHeight - height - 4));

    const newRoom: Room = {
      x,
      y,
      width,
      height,
      centerX: Math.floor(x + width / 2),
      centerY: Math.floor(y + height / 2)
    };

    // Check if this room overlaps with existing rooms
    let overlaps = false;
    for (const room of rooms) {
      if (roomsIntersect(newRoom, room)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push(newRoom);
    }
  }

  return rooms;
}

function roomsIntersect(room1: Room, room2: Room): boolean {
  return (
    room1.x < room2.x + room2.width + 2 &&
    room1.x + room1.width + 2 > room2.x &&
    room1.y < room2.y + room2.height + 2 &&
    room1.y + room1.height + 2 > room2.y
  );
}

function connectRooms(tiles: Tile[][], room1: Room, room2: Room): void {
  const start = { x: room1.centerX, y: room1.centerY };
  const end = { x: room2.centerX, y: room2.centerY };

  // Create L-shaped corridor
  if (Math.random() < 0.5) {
    // Horizontal then vertical
    createHorizontalCorridor(tiles, start.x, end.x, start.y);
    createVerticalCorridor(tiles, start.y, end.y, end.x);
  } else {
    // Vertical then horizontal
    createVerticalCorridor(tiles, start.y, end.y, start.x);
    createHorizontalCorridor(tiles, start.x, end.x, end.y);
  }
}

function createHorizontalCorridor(tiles: Tile[][], x1: number, x2: number, y: number): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);

  for (let x = startX; x <= endX; x++) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      if (tiles[y][x].type === 'WALL') {
        tiles[y][x] = {
          type: 'FLOOR',
          x,
          y,
          variant: Math.floor(Math.random() * 4)
        };
      }
    }
  }
}

function createVerticalCorridor(tiles: Tile[][], y1: number, y2: number, x: number): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);

  for (let y = startY; y <= endY; y++) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      if (tiles[y][x].type === 'WALL') {
        tiles[y][x] = {
          type: 'FLOOR',
          x,
          y,
          variant: Math.floor(Math.random() * 4)
        };
      }
    }
  }
}

// Helper functions for game logic
export function isWalkable(tiles: Tile[][], x: number, y: number): boolean {
  if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) {
    return false;
  }
  const tile = tiles[y][x];
  return tile.type === 'FLOOR' || tile.type === 'ENTRANCE' || tile.type === 'EXIT' || tile.type === 'DOOR_OPEN';
}

export function getRandomFloorPosition(dungeon: Dungeon): { x: number; y: number } {
  const room = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
  const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
  const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
  return { x, y };
}

export function getRandomFloorPositionInRoom(room: Room): { x: number; y: number } {
  const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
  const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
  return { x, y };
}
