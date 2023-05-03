import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { ProposeCredentialDto } from './dto/propose-credential';
import { OfferCredentialDto } from './dto/offer-credential.dto';
import { RequestCredentialDto } from './dto/request-credential';
import { IssueCredentialDto } from './dto/issue-credential';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OobInvitationDto } from './dto/oob.dto';
import { CreateOobInvitationDto } from './dto/create-oob.dto';
import { WaciGoalCodes, WaciMessageTypes } from './utils/issuance-utils';
@ApiTags('Credential issuance')
@Controller('issuance')
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  @Post('invitation')
  @ApiCreatedResponse({ description: 'La invitación fue creada exitosamente' })
  @ApiBadRequestResponse({ description: 'El tipo de invitación es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando la invitación',
  })
  async createOobMessage(
    @Body() createOobMessageDto: CreateOobInvitationDto,
  ): Promise<OobInvitationDto> {
    // We will deal with credential presentation in a different controller
    if (createOobMessageDto.goalCode !== WaciGoalCodes.Issuance) {
      throw new BadRequestException('Goal code not supported');
    }
    return await this.issuanceService.createOobMessage(createOobMessageDto);
  }

  // After receiving the invitation, the holder will create a credential proposal to send back to the issuer
  @Post('proposal')
  @ApiCreatedResponse({
    description: 'La propuesta de credencial fue creada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la propuesta de credencial',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  async getProposal(@Body() oobInvitationDto: OobInvitationDto) {
    if (oobInvitationDto.type != WaciMessageTypes.OobInvitation)
      throw new BadRequestException('La invitación provista es incorrecta');

    const credentialProposal = await this.issuanceService.proposeCredential(
      oobInvitationDto,
    );

    if (!credentialProposal)
      throw new NotFoundException('No se encontró la propuesta solicitada');

    return credentialProposal;
  }

  // After receiving the proposal, the issuer will create a credential offer to send back to the holder
  @Post('offer')
  @ApiCreatedResponse({
    description: 'La oferta de credencial fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la oferta de credencial',
  })
  async offerCredential(@Body() proposeCredentialDto: ProposeCredentialDto) {
    if (proposeCredentialDto.type != WaciMessageTypes.ProposeCredential)
      throw new BadRequestException('La propuesta provista es incorrecta');

    const credentialOffer = await this.issuanceService.offerCredential(
      proposeCredentialDto,
    );

    if (!credentialOffer)
      throw new NotFoundException('No se encontró la oferta solicitada');

    return credentialOffer;
  }

  // After receiving the offer, the holder will create a credential request to send back to the issuer
  @Post('request')
  @ApiCreatedResponse({
    description: 'La solicitud de credencial fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la solicitud de credencial',
  })
  async getRequest(@Body() offerCredentialDto: OfferCredentialDto) {
    if (offerCredentialDto.type != WaciMessageTypes.OfferCredential)
      throw new BadRequestException('La oferta provista es incorrecta');

    const credentialRequest = await this.issuanceService.requestCredential(
      offerCredentialDto,
    );

    if (!credentialRequest)
      throw new NotFoundException('No se encontró la solicitud solicitada');

    return credentialRequest;
  }

  @Post('credential')
  @ApiCreatedResponse({
    description: 'La credencial fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la credencial',
  })
  async issueCredential(@Body() requestCredentialDto: RequestCredentialDto) {
    if (requestCredentialDto.type != WaciMessageTypes.RequestCredential)
      throw new BadRequestException('La solicitud provista es incorrecta');

    const credentialIssuance = await this.issuanceService.issueCredential(
      requestCredentialDto,
    );

    if (!credentialIssuance)
      throw new NotFoundException('No se encontró la credencial solicitada');

    return credentialIssuance;
  }

  @Post('ack')
  @ApiCreatedResponse({
    description: 'La confirmación de credencial fue creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Hubo un problema con los parámetros ingresados',
  })
  @ApiNotFoundResponse({
    description: 'No pudimos encontrar la confirmación de credencial',
  })
  async acknowledgeCredential(@Body() issueCredentialDto: IssueCredentialDto) {
    if (issueCredentialDto.type != WaciMessageTypes.IssueCredential)
      throw new BadRequestException('La solicitud provista es incorrecta');

    const ack = await this.issuanceService.acknowledgeCredential(
      issueCredentialDto,
    );

    if (!ack)
      throw new NotFoundException('No se encontró la confirmación solicitada');
  }
}
