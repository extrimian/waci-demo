import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateOobInvitationDto } from './dto/create-oob.dto';
import { RequestCredentialDto } from './dto/request-credential';
import { OfferCredentialDto } from './dto/offer-credential.dto';
import { ProposeCredentialDto } from './dto/propose-credential';
import { IssueCredentialDto } from './dto/issue-credential';
import { OobInvitationDto } from './dto/oob.dto';
import { WaciMessageTypes } from './utils/issuance-utils';
import { AgentTypes } from 'src/agent/utils/agent-types';
import { CredentialFlow } from '@extrimian/agent';
import { AgentService } from 'src/agent/agent.service';
import * as fs from 'fs';

@Injectable()
export class IssuanceService {
  constructor(private readonly agentService: AgentService) {}
  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  async createOobMessage(
    createOobInvitationDto: CreateOobInvitationDto,
  ): Promise<OobInvitationDto> {
    Logger.log('Creating issuance invitation', 'IssueCredentialService');

    if (!(await this.agentService.isAgentPresent(AgentTypes.issuer))) {
      Logger.error('Issuer agent not initialized', 'IssueCredentialService');
      throw new NotFoundException('El agente emisor no fue inicializado');
    }

    const issuerInfo = await this.agentService.initializeAgents([
      AgentTypes.issuer,
    ]);
    if (
      issuerInfo[0].agent.identity.getOperationalDID().value !==
      createOobInvitationDto.senderDid
    ) {
      Logger.error(
        'Issuer DID does not match the one in the request',
        'IssueCredentialService',
      );
      throw new BadRequestException(
        'El DID del emisor no coincide con el dado',
      );
    }

    const invitation = await issuerInfo[0].agent.vc.createInvitationMessage({
      flow: CredentialFlow.Issuance,
    });

    return OobInvitationDto.from(invitation);
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  async proposeCredential(
    oobInvitationDto: OobInvitationDto,
  ): Promise<ProposeCredentialDto> {
    if (!this.agentService.isAgentPresent(AgentTypes.holder)) {
      Logger.error(
        'Issuer or holder agent not initialized',
        'IssueCredentialService',
      );
      throw new NotFoundException('El agente receptor no fue inicializado');
    }
    if (!this.agentService.isAgentPresent(AgentTypes.issuer)) {
      Logger.error('Issuer agent not initialized', 'IssueCredentialService');
      throw new NotFoundException('El agente emisor no fue inicializado');
    }

    const [issuerInfo, holderInfo] = await this.agentService.initializeAgents([
      AgentTypes.issuer,
      AgentTypes.holder,
    ]);
    if (
      oobInvitationDto.from !==
      issuerInfo.agent.identity.getOperationalDID().value
    ) {
      Logger.error(
        'Issuer DID does not match the one in the request',
        'IssueCredentialService',
      );
      throw new NotFoundException('El DID del emisor no coincide con el dado');
    }

    await holderInfo.agent.vc.processMessage({
      message: OobInvitationDto.toInvitationMessage(oobInvitationDto),
    });

    await new Promise((resolve) => {
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
          resolve(1);
        }
      });
    });

    const credentialProposal: ProposeCredentialDto =
      await this.findMessageByType(
        AgentTypes.issuer,
        WaciMessageTypes.ProposeCredential,
        oobInvitationDto.id,
      );
    Logger.debug(
      `Credential proposal found ${credentialProposal}`,
      'IssueCredentialService',
    );
    return credentialProposal;
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

  async findMessageByType(
    agentType: AgentTypes,
    messageType: WaciMessageTypes,
    threadId: string,
  ) {
    const filePath = `${this.agentService.storagePath}/${agentType}-waci-storage.json`;

    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      // Get the matching message and remove nulls
      const result = Object.values(jsonData)
        .flatMap((thread: Array<any>) =>
          thread.find(
            (message) =>
              message.type === messageType && message.thid === threadId,
          ),
        )
        .filter((message) => message)[0];
      return result || null;
    } catch (err) {
      // handle file reading or parsing errors
      Logger.error(
        `Error searching for message ${messageType} in ${agentType}'s thread ${threadId}: ${err}`,
        'IssueCredentialService',
      );
      return null;
    }
  }
}
