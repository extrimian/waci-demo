import { Injectable, Logger } from '@nestjs/common';
import {
  CreateOobInvitationDto as CreateOobInvitationDto,
  OobInvitationBody,
} from './dto/create-oob.dto';
import { RequestCredentialDto } from './dto/request-credential';
import { OfferCredentialDto } from './dto/offer-credential.dto';
import { ProposeCredentialDto } from './dto/propose-credential';
import { IssueCredentialDto } from './dto/issue-credential';
import * as UUID from 'uuid';
import { OobInvitationDto } from './dto/oob.dto';

const createUUID = UUID.v4;

export enum IssuanceMessageTypes {
  OutOfBandInvitation = 'https://didcomm.org/out-of-band/2.0/invitation',
  ProposeCredential = 'https://didcomm.org/issue-credential/3.0/propose-credential',
  OfferCredential = 'https://didcomm.org/issue-credential/3.0/offer-credential',
  RequestCredential = 'https://didcomm.org/issue-credential/3.0/request-credential',
  IssueCredential = 'https://didcomm.org/issue-credential/3.0/issue-credential',
  Acknowledgement = 'https://didcomm.org/issue-credential/3.0/ack',
  ProblemReport = 'https://didcomm.org/report-problem/2.0/problem-report',
}

@Injectable()
export class IssueCredentialService {
  static IssuanceMessageTypes = IssuanceMessageTypes;
  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  createOobMessage(
    createOobInvitationDto: CreateOobInvitationDto,
  ): OobInvitationDto {
    Logger.log('Creating issuance invitation', 'IssueCredentialService');
    const SUPPORTED_ALGORITHMS = ['didcomm/v2'];

    const responseBody: OobInvitationBody = {
      body: {
        goal_code: createOobInvitationDto.goalCode,
        accept: SUPPORTED_ALGORITHMS,
      },
    };

    return new OobInvitationDto(
      createUUID(),
      createOobInvitationDto.senderDid,
      responseBody,
    );
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  proposeCredential(oobInvitationDto: OobInvitationDto): ProposeCredentialDto {
    throw new Error('Method not implemented.');
  }
  // Creates a WACI credential offer: https://identity.foundation/waci-didcomm/#step-3-issue-credential-offer-credential-credential-manifest
  offerCredential(
    proposeCredentialDto: ProposeCredentialDto,
  ): OfferCredentialDto {
    throw new Error('Method not implemented.');
  }
  // Creates a WACI credential request: https://identity.foundation/waci-didcomm/#step-4-issue-credential-request-credential-credential-application
  requestCredential(
    offerCredentialDto: OfferCredentialDto,
  ): RequestCredentialDto {
    throw new Error('Method not implemented.');
  }
  // Creates a WACI credential: https://identity.foundation/waci-didcomm/#step-5-issue-credential-issue-credential-credential-fulfilment
  issueCredential(requestCredentialDto: RequestCredentialDto): AckDto {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI credential acknowledgement: https://identity.foundation/waci-didcomm/#step-6-issue-credential-ack
  acknowledgeCredential(issueCredentialDto: IssueCredentialDto): AckDto {
    throw new Error('Method not implemented.');
  }
}
