import { Module } from '@nestjs/common';
import { LocalesController } from './locales.controller.js';
import { LocalesService } from './locales.service.js';

@Module({
  controllers: [LocalesController],
  providers: [LocalesService],
  exports: [LocalesService],
})
export class LocalesModule {}
