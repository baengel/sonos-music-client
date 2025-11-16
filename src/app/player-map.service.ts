import {Injectable} from '@angular/core';

export const availablePlayers = [
  { ip: '192.168.188.34', room: 'Len Zimmer' },
  { ip: '192.168.188.43', room: 'Juna Zimmer' },
  { ip: '192.168.188.35', room: 'Maxim Zimmer' },
  { ip: '192.168.188.146', room: 'Kueche (L)' },
  { ip: '192.168.188.86', room: 'Wohnzimmer' }
];

@Injectable({ providedIn: 'root' })
export class PlayerMapService {
  getRoomByIp(ip: string): string {
    const found = availablePlayers.find(p => p.ip === ip);
    return found ? found.room : ip;
  }

  getIpByRoom(room: string): string {
    const found = availablePlayers.find(p => p.room === room);
    return found ? found.ip : room;
  }

  getAllRooms(): string[] {
    return availablePlayers.map(p => p.room);
  }

  getAllIps(): string[] {
    return availablePlayers.map(p => p.ip);
  }

  getAllMappings(): { ip: string, room: string }[] {
    return availablePlayers;
  }
}

