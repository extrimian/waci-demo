import { Module } from '@nestjs/common';
import { DidService } from './did.service';
import { DidController } from './did.controller';

@Module({
  controllers: [DidController],
  providers: [DidService],
})
export class DidModule {}
