import { Injectable } from '@nestjs/common';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class IssueCredentialService {
  // Creates a WACI credential: https://identity.foundation/waci-didcomm/#step-5-issue-credential-issue-credential-credential-fulfilment
  issueCredential(createCredentialDto: CreateCredentialDto) {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI credential request: https://identity.foundation/waci-didcomm/#step-4-issue-credential-request-credential-credential-application
  requestCredential(createRequestDto: CreateRequestDto) {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI credential offer: https://identity.foundation/waci-didcomm/#step-3-issue-credential-offer-credential-credential-manifest
  offerCredential(createOfferDto: CreateOfferDto) {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  proposeCredential(createProposalDto: CreateProposalDto) {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  createInvitation(createInvitation: CreateInvitationDto) {
    throw new Error('Method not implemented.');
  }
}
