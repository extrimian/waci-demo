import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DidModule } from './did/did.module';

@Module({
  imports: [DidModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
