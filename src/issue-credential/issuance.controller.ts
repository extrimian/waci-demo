import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
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
  ApiTags,
} from '@nestjs/swagger';
import { OobInvitationDto } from './dto/oob.dto';
import { CreateOobInvitationDto } from './dto/create-oob.dto';
import { WaciGoalCodes } from './utils/issuance-utils';
@ApiTags('Credential issuance')
@Controller('issue-credential')
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  @Post('invitation')
  @ApiBadRequestResponse({ description: 'El tipo de invitación es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando la invitación',
  })
  @ApiCreatedResponse({ description: 'La invitación fue creada exitosamente' })
  createOobMessage(
    @Body() createOobMessageDto: CreateOobInvitationDto,
  ): OobInvitationDto {
    // We will deal with credential presentation in a different controller
    if (createOobMessageDto.goalCode !== WaciGoalCodes.Issuance) {
      throw new BadRequestException('Goal code not supported');
    }
    try {
      return this.issuanceService.createOobMessage(createOobMessageDto);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // After receiving the invitation, the holder will create a credential proposal to send back to the issuer
  @Post('proposal')
  async getProposal(@Body() oobInvitationDto: OobInvitationDto) {
    return this.issuanceService.proposeCredential(oobInvitationDto);
  }

  // After receiving the proposal, the issuer will create a credential offer to send back to the holder
  @Post('offer')
  async offerCredential(@Body() proposeCredentialDto: ProposeCredentialDto) {
    this.issuanceService.offerCredential(proposeCredentialDto);
  }

  // After receiving the offer, the holder will create a credential request to send back to the issuer
  @Post('request')
  async getRequest(@Body() offerCredentialDto: OfferCredentialDto) {
    this.issuanceService.requestCredential(offerCredentialDto);
  }

  @Post('credential')
  async issueCredential(@Body() requestCredentialDto: RequestCredentialDto) {
    this.issuanceService.issueCredential(requestCredentialDto);
  }

  @Post('ack')
  async acknowledgeCredential(@Body() issueCredentialDto: IssueCredentialDto) {
    this.issuanceService.acknowledgeCredential(issueCredentialDto);
  }
}
