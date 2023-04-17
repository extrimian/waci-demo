import { Body, Controller, Post } from '@nestjs/common';
import { IssueCredentialService } from './issue-credential.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Controller('issue-credential')
export class IssueCredentialController {
  constructor(
    private readonly issueCredentialService: IssueCredentialService,
  ) {}

  @Post('invitation')
  async createIvitation(@Body() createInvitationDto: CreateInvitationDto) {
    this.issueCredentialService.createInvitation(createInvitationDto);
  }

  @Post('proposal')
  async proposeCredential(@Body() createProposalDto: CreateProposalDto) {
    this.issueCredentialService.proposeCredential(createProposalDto);
  }

  @Post('offer')
  async offerCredential(@Body() createOfferDto: CreateOfferDto) {
    this.issueCredentialService.offerCredential(createOfferDto);
  }

  @Post('request')
  async requestCredential(@Body() createRequestDto: CreateRequestDto) {
    this.issueCredentialService.requestCredential(createRequestDto);
  }

  @Post('credential')
  async issueCredential(@Body() createCredentialDto: CreateCredentialDto) {
    this.issueCredentialService.issueCredential(createCredentialDto);
  }
}
