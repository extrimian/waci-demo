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
import { AgentInfo, AgentService } from 'src/agent/agent.service';
import * as fs from 'fs';
import { AckDto } from './dto/ack.dto';

@Injectable()
export class IssuanceService {
  constructor(private readonly agentService: AgentService) {}
  // Verifies that the agents are initialized and that their DIDs match the ones in the request
  private async verifyInitialization(
    agentData: { agentType: AgentTypes; expectedDid?: string }[],
  ): Promise<AgentInfo[]> {
    enum TranslatedAgentTypes {
      issuer = 'emisor',
      holder = 'receptor',
    }

    agentData.forEach((data) => {
      if (!this.agentService.isAgentPresent(data.agentType)) {
        Logger.error(
          `${data.agentType} agent not initialized`,
          'IssueCredentialService',
        );
        throw new NotFoundException(
          `El agente ${
            TranslatedAgentTypes[data.agentType]
          } no fue inicializado`,
        );
      }
    });

    const agentTypes = agentData.map((data) => data.agentType);
    const agentInfoArray = await this.agentService.initializeAgents(agentTypes);

    // Check that the DIDs match the ones in the request, if given
    agentInfoArray.forEach((agentInfo, index) => {
      if (
        agentData[index].expectedDid &&
        agentInfo.agent.identity.getOperationalDID().value !==
          agentData[index].expectedDid
      ) {
        Logger.error(
          `${agentInfo.agentType} agent DID does not match the one in the request`,
          'IssueCredentialService',
        );
        throw new BadRequestException(
          `El DID del agente ${
            TranslatedAgentTypes[agentData[index].agentType]
          } no coincide con el dado`,
        );
      }
    });

    return agentInfoArray;
  }

  // Creates a WACI OOB invitation for credential issuance: https://identity.foundation/waci-didcomm/#step-1-generate-out-of-band-oob-message
  async createOobMessage(
    createOobInvitationDto: CreateOobInvitationDto,
  ): Promise<OobInvitationDto> {
    Logger.log('Creating issuance invitation', 'IssueCredentialService');

    const [issuerInfo] = await this.verifyInitialization([
      {
        agentType: AgentTypes.issuer,
        expectedDid: createOobInvitationDto.senderDid,
      },
    ]);

    const invitation = await issuerInfo.agent.vc.createInvitationMessage({
      flow: CredentialFlow.Issuance,
    });

    return OobInvitationDto.from(invitation);
  }

  // Creates a WACI credential proposal: https://identity.foundation/waci-didcomm/#step-2-issue-credential-propose-credential
  async proposeCredential(
    oobInvitationDto: OobInvitationDto,
  ): Promise<ProposeCredentialDto> {
    const [issuerInfo, holderInfo] = await this.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: oobInvitationDto.from },
      { agentType: AgentTypes.holder },
    ]);

    // Issue VC using agent SDK and store it in memory
    // await holderInfo.agent.vc.processMessage({
    //   message: OobInvitationDto.toInvitationMessage(oobInvitationDto),
    // });

    // await new Promise((resolve) => {
    //   holderInfo.agent.vc.credentialArrived.on((vc) => {
    //     if (vc) {
    //       holderInfo.agent.vc.saveCredential(vc);
    //       Logger.log(
    //         'Credential arrived in holder agent',
    //         'IssueCredentialService',
    //       );
    //       resolve(0);
    //     } else {
    //       Logger.error(
    //         "Credential didn't arrive in holder agent",
    //         'IssueCredentialService',
    //       );
    //       resolve(1);
    //     }
    //   });
    // });

    // Get the credential proposal from the issuer agent's WACI storage
    const credentialProposal: ProposeCredentialDto =
      await this.findMessageByType(
        AgentTypes.issuer,
        WaciMessageTypes.ProposeCredential,
        oobInvitationDto.id,
      );
    Logger.debug(
      `Credential proposal found ${JSON.stringify(credentialProposal)}`,
      'IssueCredentialService',
    );
    return credentialProposal;
  }

  // Creates a WACI credential offer: https://identity.foundation/waci-didcomm/#step-3-issue-credential-offer-credential-credential-manifest
  async offerCredential(
    proposeCredentialDto: ProposeCredentialDto,
  ): Promise<OfferCredentialDto> {
    await this.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: proposeCredentialDto.to[0] },
      { agentType: AgentTypes.holder, expectedDid: proposeCredentialDto.from },
    ]);

    // Get the credential offer from the issuer agent's WACI storage
    const credentialOffer: OfferCredentialDto = await this.findMessageByType(
      AgentTypes.issuer,
      WaciMessageTypes.OfferCredential,
      proposeCredentialDto.pthid,
    );
    Logger.debug(
      `Credential offer found ${credentialOffer}`,
      'IssueCredentialService',
    );

    return credentialOffer;
  }
  // Creates a WACI credential request: https://identity.foundation/waci-didcomm/#step-4-issue-credential-request-credential-credential-application
  async requestCredential(
    offerCredentialDto: OfferCredentialDto,
  ): Promise<RequestCredentialDto> {
    await this.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: offerCredentialDto.from },
      { agentType: AgentTypes.holder, expectedDid: offerCredentialDto.to[0] },
    ]);

    // Get the credential request from the holder agent's WACI storage
    const credentialRequest: RequestCredentialDto =
      await this.findMessageByType(
        AgentTypes.holder,
        WaciMessageTypes.RequestCredential,
        offerCredentialDto.thid,
      );

    Logger.debug(
      `Credential request found ${credentialRequest}`,
      'IssueCredentialService',
    );

    return credentialRequest;
  }

  // Creates a WACI credential: https://identity.foundation/waci-didcomm/#step-5-issue-credential-issue-credential-credential-fulfilment
  async issueCredential(requestCredentialDto: RequestCredentialDto) {
    await this.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: requestCredentialDto.to[0] },
      { agentType: AgentTypes.holder, expectedDid: requestCredentialDto.from },
    ]);

    // Get the credential from the issuer agent's WACI storage
    const issueCredential: IssueCredentialDto = await this.findMessageByType(
      AgentTypes.issuer,
      WaciMessageTypes.IssueCredential,
      requestCredentialDto.thid,
    );

    Logger.debug(
      `Credential found ${issueCredential}`,
      'IssueCredentialService',
    );

    return issueCredential;
  }

  // Creates a WACI credential acknowledgement: https://identity.foundation/waci-didcomm/#step-6-issue-credential-ack
  async acknowledgeCredential(issueCredentialDto: IssueCredentialDto) {
    await this.verifyInitialization([
      { agentType: AgentTypes.issuer, expectedDid: issueCredentialDto.from },
      { agentType: AgentTypes.holder, expectedDid: issueCredentialDto.to[0] },
    ]);

    // Get the credential acknowledgement from the holder agent's WACI storage
    const credentialAcknowledgement: AckDto = await this.findMessageByType(
      AgentTypes.holder,
      WaciMessageTypes.Ack,
      issueCredentialDto.thid,
    );

    Logger.debug(
      `Credential acknowledgement found ${credentialAcknowledgement}`,
      'IssueCredentialService',
    );

    return credentialAcknowledgement;
  }

  async findMessageByType(
    agentType: AgentTypes,
    messageType: WaciMessageTypes,
    threadId: string,
  ): Promise<any> {
    const filePath = `${this.agentService.storagePath}/${agentType}-waci-storage.json`;
    let waciStorage;
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      waciStorage = JSON.parse(fileContent) as JSON;
    } catch (err) {
      // handle file reading or parsing errors
      Logger.error(
        `Error searching for message ${messageType} in ${agentType}'s thread ${threadId}: ${err}`,
        'IssueCredentialService',
      );
      return null;
    }

    if (agentType === AgentTypes.holder) {
      // The holder agent stores the ack, but not the proposal
      if (messageType === WaciMessageTypes.ProposeCredential) {
        return null;
      }
      // ThreadId is the id of the proposal, not the pthid of the invitation
      const result = waciStorage[threadId].find(
        (message) => message.type === messageType,
      );
      return result;
    } else if (agentType === AgentTypes.issuer) {
      // The issuer agent stores the proposal, but not the ack
      if (messageType === WaciMessageTypes.Ack) {
        return null;
      }

      // If I'm looking for a proposal, I need to find the proposal with the same pthid as the threadId (the id of the invitation)
      // The same pthid can lead to many proposals, so I want the last one
      if (messageType === WaciMessageTypes.ProposeCredential) {
        // Object.values(waciStorage).forEach((thread) =>
        //   Logger.debug(`Thread: ${JSON.stringify(thread)}`),
        // );
        Logger.log(`Thread id: ${threadId}`, 'IssueCredentialService');
        const lastThread = Object.values(waciStorage).pop() as any[];
        const result = lastThread
          .filter(
            (message: any) =>
              message.type === WaciMessageTypes.ProposeCredential &&
              message.pthid === threadId,
          )
          .pop();
        return result;
      }
      Logger.log(
        `Message thread: ${waciStorage[messageType]} with threadId: ${threadId} in ${agentType}'s storage`,
        'IssueCredentialService',
      );
      // ThreadId is the id of the proposal
      const result = waciStorage[threadId].find(
        (message) => message.type === messageType,
      );
      return result;
    }
  }
}
