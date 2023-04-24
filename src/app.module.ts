import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { IssuanceModule } from './issue-credential/issuance.module';

@Module({
  imports: [AgentModule, IssuanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
