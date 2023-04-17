import { Module } from '@nestjs/common';
import { IssueCredentialService } from './issue-credential.service';
import { IssueCredentialController } from './issue-credential.controller';

@Module({
  controllers: [IssueCredentialController],
  providers: [IssueCredentialService]
})
export class IssueCredentialModule {}
