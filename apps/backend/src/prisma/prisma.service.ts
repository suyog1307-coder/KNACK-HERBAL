import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Create a pg database pool using your environment variable
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    
    // Wrap it in the Prisma Driver Adapter
    const adapter = new PrismaPg(pool);

    // Pass the adapter to the parent PrismaClient class
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}