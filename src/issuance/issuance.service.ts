import { Injectable, Logger } from '@nestjs/common';
import { CreateOobInvitationDto } from './dto/create-oob.dto';
import { RequestCredentialDto } from './dto/request-credential';
import { OfferCredentialDto } from './dto/offer-credential.dto';
import { ProposeCredentialDto } from './dto/propose-credential';
import { IssueCredentialDto } from './dto/issue-credential';
import { OobInvitationDto } from './dto/oob.dto';
import { IssuanceMessageTypes } from '../agent/utils/waci-types';
import { AgentTypes } from '../agent/utils/agent-types';
import { CredentialFlow } from '@extrimian/agent';
import { AgentService } from '../agent/agent.service';
import { AckDto } from './dto/ack.dto';

@Injectable()
export class IssuanceService {
  constructor(private readonly agentService: AgentService) {}

  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  async createOobMessage(
    createOobInvitationDto: CreateOobInvitationDto,
  ): Promise<OobInvitationDto> {
    Logger.log('Creating issuance invitation', 'IssueCredentialService');

    const [issuerInfo] = await this.agentService.verifyInitialization([
      {
        agentType: AgentTypes.issuer,
        expectedDid: createOobInvitationDto.senderDid,
      },
    ]);

    const invitation = await issuerInfo.agent.vc.createInvitationMessage({
      flow: CredentialFlow.Issuance,
    });

    Logger.log(
      `Invitation created: ${JSON.stringify(invitation)}`,
      'IssueCredentialService',
    );

    return OobInvitationDto.from(invitation);
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  async proposeCredential(
    oobInvitationDto: OobInvitationDto,
  ): Promise<ProposeCredentialDto> {
    const [issuerInfo, holderInfo] =
      await this.agentService.verifyInitialization([
        { agentType: AgentTypes.issuer, expectedDid: oobInvitationDto.from },
        { agentType: AgentTypes.holder },
      ]);

    // Issue VC using agent SDK and store it in memory
    await holderInfo.agent.vc.processMessage({
      message: OobInvitationDto.toInvitationMessage(oobInvitationDto),
    });

    await new Promise((resolve, reject) => {
      holderInfo.agent.vc.credentialArrived.on((vc) => {
        if (vc) {
          holderInfo.agent.vc.saveCredential(vc);
          Logger.log(
            'Credential arrived in holder agent',
            'IssueCredentialService',
          );
          resolve(0);
        } else {
          Logger.error(
            "Credential didn't arrive in holder agent",
            'IssueCredentialService',
          );
          reject();
        }
      });
    });

    // Get the credential proposal from the issuer agent's WACI storage
    const credentialProposal: ProposeCredentialDto =
      await this.agentService.findMessageByType(
        IssuanceMessageTypes.ProposeCredential,
        oobInvitationDto.id,
      );

    Logger.log(
      `Credential proposal found ${JSON.stringify(credentialProposal)}`,
      'IssueCredentialService',
    );

    return credentialProposal;
  }

  // Creates a WACI credential offer: https://identity.foundation/waci-didcomm/#step-3-issue-credential-offer-credential-credential-manifest
  async offerCredential(
    proposeCredentialDto: ProposeCredentialDto,
  ): Promise<OfferCredentialDto> {
    await this.agentService.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: proposeCredentialDto.to[0] },
      { agentType: AgentTypes.holder, expectedDid: proposeCredentialDto.from },
    ]);

    // Get the credential offer from the issuer agent's WACI storage
    const credentialOffer: OfferCredentialDto =
      await this.agentService.findMessageByType(
        IssuanceMessageTypes.OfferCredential,
        proposeCredentialDto.id,
      );

    Logger.log(
      `Credential offer found ${JSON.stringify(credentialOffer)}`,
      'IssueCredentialService',
    );

    return credentialOffer;
  }
  // Creates a WACI credential request: https://identity.foundation/waci-didcomm/#step-4-issue-credential-request-credential-credential-application
  async requestCredential(
    offerCredentialDto: OfferCredentialDto,
  ): Promise<RequestCredentialDto> {
    await this.agentService.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: offerCredentialDto.from },
      { agentType: AgentTypes.holder, expectedDid: offerCredentialDto.to[0] },
    ]);

    // Get the credential request from the holder agent's WACI storage
    const credentialRequest: RequestCredentialDto =
      await this.agentService.findMessageByType(
        IssuanceMessageTypes.RequestCredential,
        offerCredentialDto.thid,
      );

    Logger.log(
      `Credential request found ${JSON.stringify(credentialRequest)}`,
      'IssueCredentialService',
    );

    return credentialRequest;
  }

  // Creates a WACI credential: https://identity.foundation/waci-didcomm/#step-5-issue-credential-issue-credential-credential-fulfilment
  async issueCredential(requestCredentialDto: RequestCredentialDto) {
    await this.agentService.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: requestCredentialDto.to[0] },
      { agentType: AgentTypes.holder, expectedDid: requestCredentialDto.from },
    ]);

    // Get the credential from the issuer agent's WACI storage
    const issueCredential: IssueCredentialDto =
      await this.agentService.findMessageByType(
        IssuanceMessageTypes.IssueCredential,
        requestCredentialDto.thid,
      );

    Logger.log(
      `Credential found ${JSON.stringify(issueCredential)}`,
      'IssueCredentialService',
    );

    return issueCredential;
  }

  // Creates a WACI credential acknowledgement: https://identity.foundation/waci-didcomm/#step-6-issue-credential-ack
  async acknowledgeCredential(issueCredentialDto: IssueCredentialDto) {
    await this.agentService.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: issueCredentialDto.from },
      { agentType: AgentTypes.holder, expectedDid: issueCredentialDto.to[0] },
    ]);

    // Get the credential acknowledgement from the holder agent's WACI storage
    const credentialAcknowledgement: AckDto =
      await this.agentService.findMessageByType(
        IssuanceMessageTypes.Ack,
        issueCredentialDto.thid,
      );

    Logger.log(
      `Credential acknowledgement found ${JSON.stringify(
        credentialAcknowledgement,
      )}`,
      'IssueCredentialService',
    );

    return credentialAcknowledgement;
  }
}
