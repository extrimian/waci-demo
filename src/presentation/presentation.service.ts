import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PresentationInvitationDto } from './dto/invitation.dto';
import { PresentationProposalDto } from './dto/propose-presentation.dto';
import { PresentationRequestDto } from './dto/request-presentation.dto';
import { PresentationProofDto } from './dto/presentation.dto';
import { PresentationAckDto } from './dto/ack.dto';
import { CreatePresentationInvitationDto } from './dto/create-invitation.dto';
import { AgentService } from 'src/agent/agent.service';
import { CredentialFlow } from '@extrimian/agent';
import { AgentTypes } from 'src/agent/utils/agent-types';
import { PresentationMessageTypes } from '../agent/utils/waci-types';
@Injectable()
export class PresentationService {
  constructor(private readonly agentService: AgentService) {}

  async createInvitation(
    createInvitationDto: CreatePresentationInvitationDto,
  ): Promise<PresentationInvitationDto> {
    Logger.log('Creating presentation invitation', 'PresentationService');
    const [verifierInfo] = await this.agentService.verifyInitialization([
      {
        agentType: AgentTypes.verifier,
        expectedDid: createInvitationDto.senderDid,
      },
    ]);
    const invitation = await verifierInfo.agent.vc.createInvitationMessage({
      flow: CredentialFlow.Presentation,
    });

    Logger.log(
      `Invitation created: ${JSON.stringify(invitation)}`,
      'PresentationService',
    );

    return PresentationInvitationDto.from(invitation);
  }

  async createProposal(
    presentationInvitation: PresentationInvitationDto,
  ): Promise<PresentationProposalDto> {
    const [verifierInfo, holderInfo] =
      await this.agentService.verifyInitialization([
        {
          agentType: AgentTypes.verifier,
          expectedDid: presentationInvitation.from,
        },
        { agentType: AgentTypes.holder },
      ]);

    const presentationMessage = PresentationInvitationDto.toInvitationMessage(
      presentationInvitation,
    );

    // Verify the VC and store it in memory
    await holderInfo.agent.vc.processMessage({
      message: presentationMessage,
    });

    await new Promise((resolve, reject) => {
      verifierInfo.agent.vc.credentialPresented.on((presentation) => {
        if (!presentation) {
          reject(
            new InternalServerErrorException(
              'Hubo un error presentando la credencial',
            ),
          );
        }
        //TODO: Validate the presentation
        if (!presentation.vcVerified || !presentation.presentationVerified) {
          reject(new ForbiddenException('La presentación no es válida'));
        }
        resolve(0);
      });
    });

    // Get the presentation proposal from memory
    const presentationProposal: PresentationProposalDto =
      await this.agentService.findMessageByType(
        PresentationMessageTypes.ProposePresentation,
        presentationInvitation.id,
      );

    return presentationProposal;
  }

  async createRequest(
    presentationProposal: PresentationProposalDto,
  ): Promise<PresentationRequestDto> {
    await this.agentService.verifyInitialization([
      {
        agentType: AgentTypes.verifier,
        expectedDid: presentationProposal.to[0],
      },
      { agentType: AgentTypes.holder, expectedDid: presentationProposal.from },
    ]);

    const presentationRequest: PresentationRequestDto =
      await this.agentService.findMessageByType(
        PresentationMessageTypes.RequestPresentation,
        presentationProposal.id,
      );

    Logger.log(
      `Presentation request found: ${JSON.stringify(presentationRequest)}`,
      'PresentationService',
    );

    return presentationRequest;
  }

  async createPresentationProof(
    presentationRequest: PresentationRequestDto,
  ): Promise<PresentationProofDto> {
    await this.agentService.verifyInitialization([
      {
        agentType: AgentTypes.verifier,
        expectedDid: presentationRequest.from,
      },
      { agentType: AgentTypes.holder, expectedDid: presentationRequest.to[0] },
    ]);

    const presentationProof: PresentationProofDto =
      await this.agentService.findMessageByType(
        PresentationMessageTypes.PresentProof,
        presentationRequest.thid,
      );

    Logger.log(
      `Presentation proof found: ${JSON.stringify(presentationProof)}`,
      'PresentationService',
    );

    return presentationProof;
  }

  async createAck(
    presentationProof: PresentationProofDto,
  ): Promise<PresentationAckDto> {
    await this.agentService.verifyInitialization([
      {
        agentType: AgentTypes.verifier,
        expectedDid: presentationProof.to[0],
      },
      { agentType: AgentTypes.holder, expectedDid: presentationProof.from },
    ]);

    const presentationAck: PresentationAckDto =
      await this.agentService.findMessageByType(
        PresentationMessageTypes.Ack,
        presentationProof.thid,
      );

    Logger.log(
      `Presentation acknowledgement found: ${JSON.stringify(presentationAck)}`,
      'PresentationService',
    );

    return presentationAck;
  }
}
