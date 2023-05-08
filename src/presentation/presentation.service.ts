import { Injectable } from '@nestjs/common';
import { PresentationInvitationDto } from './dto/invitation.dto';
import { PresentationProposalDto } from './dto/propose-presentation.dto';
import { PresentationRequestDto } from './dto/request-presentation.dto';
import { PresentationProofDto } from './dto/presentation.dto';
import { PresentationAckDto } from './dto/ack.dto';
import { CreatePresentationInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class PresentationService {
  async createInvitation(
    createInvitationDto: CreatePresentationInvitationDto,
  ): Promise<PresentationInvitationDto> {
    throw new Error('Method not implemented.');
  }

  async createAck(
    presentationRequest: PresentationProposalDto,
  ): Promise<PresentationAckDto> {
    throw new Error('Method not implemented.');
  }

  async createPresentationProof(
    presentationRequest: PresentationProposalDto,
  ): Promise<PresentationProofDto> {
    throw new Error('Method not implemented.');
  }

  async createRequest(
    presentationProposal: PresentationProposalDto,
  ): Promise<PresentationRequestDto> {
    throw new Error('Method not implemented.');
  }

  async createProposal(
    presentationInvitation: PresentationInvitationDto,
  ): Promise<PresentationProposalDto> {
    throw new Error('Method not implemented.');
  }
}
