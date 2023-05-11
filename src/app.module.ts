import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { IssuanceModule } from './issuance/issuance.module';
import { VerificationModule } from './presentation/verification.module';

@Module({
  imports: [AgentModule, IssuanceModule, VerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
