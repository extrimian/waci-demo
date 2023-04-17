import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { IssueCredentialModule } from './issue-credential/issue-credential.module';

@Module({
  imports: [AgentModule, IssueCredentialModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
