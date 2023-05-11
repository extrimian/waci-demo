import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { PresentationInvitationDto } from './dto/invitation.dto';
import { PresentationProposalDto } from './dto/propose-presentation.dto';
import { PresentationRequestDto } from './dto/request-presentation.dto';
import { PresentationProofDto } from './dto/presentation.dto';
import { PresentationAckDto } from './dto/ack.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePresentationInvitationDto } from './dto/create-invitation.dto';
import {
  PresentationMessageTypes,
  WaciGoalCodes,
} from 'src/agent/utils/waci-types';

@ApiTags('Presentación de credenciales')
@Controller('presentation')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post('invitation')
  @ApiCreatedResponse({ description: 'La invitación fue creada exitosamente' })
  @ApiBadRequestResponse({ description: 'El tipo de invitación es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando la invitación',
  })
  async createInvitation(
    @Body() createInvitationDto: CreatePresentationInvitationDto,
  ): Promise<PresentationInvitationDto> {
    if (createInvitationDto.goalCode !== WaciGoalCodes.Presentation)
      throw new BadRequestException(
        `El Goal Code provisto es incorrecto, usar ${WaciGoalCodes.Presentation}`,
      );

    return await this.presentationService.createInvitation(createInvitationDto);
  }

  @Post('proposal')
  @ApiCreatedResponse({
    description: 'La propuesta de presentación fue creada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la propuesta de presentación',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  async createProposal(
    @Body() presentationInvitation: PresentationInvitationDto,
  ): Promise<PresentationProposalDto> {
    if (presentationInvitation.type != PresentationMessageTypes.Invitation)
      throw new BadRequestException('La invitación provista es incorrecta');

    const presentationProposal = this.presentationService.createProposal(
      presentationInvitation,
    );

    if (!presentationProposal)
      throw new NotFoundException('No se encontró la propuesta solicitada');

    return presentationProposal;
  }

  @Post('request')
  @ApiCreatedResponse({
    description: 'La solicitud de presentación fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la solicitud de presentación',
  })
  async createRequest(
    @Body() presentationProposal: PresentationProposalDto,
  ): Promise<PresentationRequestDto> {
    if (
      presentationProposal.type != PresentationMessageTypes.ProposePresentation
    )
      throw new BadRequestException('La oferta provista es incorrecta');

    const presentationRequest = await this.presentationService.createRequest(
      presentationProposal,
    );

    if (!presentationRequest)
      throw new NotFoundException('No se encontró la solicitud solicitada');

    return presentationRequest;
  }

  @Post('proof')
  @ApiCreatedResponse({
    description: 'La credencial fue verificada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la presentación de credencial',
  })
  async createPresentation(
    @Body() presentationRequest: PresentationRequestDto,
  ): Promise<PresentationProofDto> {
    if (
      presentationRequest.type != PresentationMessageTypes.RequestPresentation
    )
      throw new BadRequestException('La solicitud provista es incorrecta');

    const presentationProof =
      await this.presentationService.createPresentationProof(
        presentationRequest,
      );

    if (!presentationProof)
      throw new NotFoundException('No se encontró la credencial solicitada');

    return presentationProof;
  }

  @Post('ack')
  @ApiCreatedResponse({
    description: 'La confirmación de verificación fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la confirmación de verificación',
  })
  async createAck(
    @Body() presentationProof: PresentationProofDto,
  ): Promise<PresentationAckDto> {
    if (presentationProof.type != PresentationMessageTypes.PresentProof)
      throw new BadRequestException('La solicitud provista es incorrecta');

    const ack = await this.presentationService.createAck(presentationProof);

    if (!ack)
      throw new NotFoundException('No se encontró la confirmación solicitada');

    return ack;
  }
}
