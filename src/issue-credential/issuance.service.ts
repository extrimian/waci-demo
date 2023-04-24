import { Inject, Injectable, Logger } from '@nestjs/common';
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
import {
  WACIMessageResponseType,
  WaciGoalCodes,
  WaciMessageTypes,
  getDidByType,
} from './utils/issuance-utils';
import { AgentTypes } from 'src/agent/utils/agent-types';
import { Agent } from '@extrimian/agent';
import { AgentService } from 'src/agent/agent.service';

const createUUID = UUID.v4;

@Injectable()
export class IssuanceService {
  constructor(private readonly agentService: AgentService) {}
  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  createOobMessage(
    createOobInvitationDto: CreateOobInvitationDto,
  ): OobInvitationDto {
    Logger.log('Creating issuance invitation', 'IssueCredentialService');
    const SUPPORTED_ALGORITHMS = ['didcomm/v2'];

    const responseBody: OobInvitationBody = {
      goal_code: createOobInvitationDto.goalCode,
      accept: SUPPORTED_ALGORITHMS,
    };

    return new OobInvitationDto(
      createUUID(),
      createOobInvitationDto.senderDid,
      responseBody,
    );
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  proposeCredential(oobInvitationDto: OobInvitationDto): ProposeCredentialDto {
    // const message = messageThread[messageThread.length - 1];
    let responseMessageType: WaciMessageTypes;
    switch (oobInvitationDto.body.goal_code) {
      case WaciGoalCodes.Issuance:
        responseMessageType = WaciMessageTypes.ProposeCredential;
        break;
      default:
        throw Error('No goal code defined in invitation');
    }
    const issuerDid = oobInvitationDto.from;
    const holderDid = getDidByType(AgentTypes.holder);

    // Send DWN message to issuer
    // const dwnMessage = {
    //   responseType: WACIMessageResponseType.CreateThread,
    //   message: {
    //     type: responseMessageType,
    //     id: createUUID(),
    //     pthid: oobInvitationDto.id,
    //     from: holderDid,
    //     to: [issuerDid],
    //   },
    // };

    return new ProposeCredentialDto(
      createUUID(),
      oobInvitationDto.id,
      holderDid,
      [issuerDid],
    );
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
  issueCredential(requestCredentialDto: RequestCredentialDto) {
    throw new Error('Method not implemented.');
  }

  // Creates a WACI credential acknowledgement: https://identity.foundation/waci-didcomm/#step-6-issue-credential-ack
  acknowledgeCredential(issueCredentialDto: IssueCredentialDto) {
    throw new Error('Method not implemented.');
  }
}
