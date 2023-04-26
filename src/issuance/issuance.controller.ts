import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
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
@Controller('issuance')
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  @Post('invitation')
  @ApiBadRequestResponse({ description: 'El tipo de invitación es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando la invitación',
  })
  @ApiCreatedResponse({ description: 'La invitación fue creada exitosamente' })
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
  async getProposal(@Body() oobInvitationDto: OobInvitationDto) {
    return await this.issuanceService.proposeCredential(oobInvitationDto);
  }

  // After receiving the proposal, the issuer will create a credential offer to send back to the holder
  @Post('offer')
  async offerCredential(@Body() proposeCredentialDto: ProposeCredentialDto) {
    await this.issuanceService.offerCredential(proposeCredentialDto);
  }

  // After receiving the offer, the holder will create a credential request to send back to the issuer
  @Post('request')
  async getRequest(@Body() offerCredentialDto: OfferCredentialDto) {
    await this.issuanceService.requestCredential(offerCredentialDto);
  }

  @Post('credential')
  async issueCredential(@Body() requestCredentialDto: RequestCredentialDto) {
    await this.issuanceService.issueCredential(requestCredentialDto);
  }

  @Post('ack')
  async acknowledgeCredential(@Body() issueCredentialDto: IssueCredentialDto) {
    await this.issuanceService.acknowledgeCredential(issueCredentialDto);
  }
}
