import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrentUser {
  constructor(private readonly req: any) {}
  get uid(): string {
    return this.req.user?.uid;
  }
}