import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  uptimeSec: number;
}

export interface VroomResponse {
  fact: string;
}

const VROOM_FACTS: ReadonlyArray<string> = [
  'The first speeding ticket was issued in 1896 — to a driver going 8 mph.',
  "Henry Ford's Model T was offered in only one colour because the paint dried fastest in black.",
  'The longest-serving traffic light has been operating in Ohio since 1932.',
  'An average modern car contains roughly 30,000 individual parts.',
  "The world's narrowest car, the Peel P50, has a top speed of just 38 mph.",
  'Volkswagen owns Lamborghini, Bugatti, Bentley and Porsche — all at once.',
];

@Injectable()
export class AppService {
  private readonly bootedAt = Date.now();

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      uptimeSec: Math.floor((Date.now() - this.bootedAt) / 1000),
    };
  }

  getVroom(): VroomResponse {
    const fact = VROOM_FACTS[Math.floor(Math.random() * VROOM_FACTS.length)];
    return { fact };
  }
}
