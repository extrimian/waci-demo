import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { IssueCredentialService } from './issue-credential.service';
import { CreateOobInvitationDto, WaciGoalCodes } from './dto/create-oob.dto';
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
@ApiTags('Credential issuance')
@Controller('issue-credential')
export class IssueCredentialController {
  constructor(
    private readonly issueCredentialService: IssueCredentialService,
  ) {}

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
      return this.issueCredentialService.createOobMessage(createOobMessageDto);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Post('proposal')
  async proposeCredential(@Body() oobInvitationDto: OobInvitationDto) {
    this.issueCredentialService.proposeCredential(oobInvitationDto);
  }

  @Post('offer')
  async offerCredential(@Body() proposeCredentialDto: ProposeCredentialDto) {
    this.issueCredentialService.offerCredential(proposeCredentialDto);
  }

  @Post('request')
  async requestCredential(@Body() offerCredentialDto: OfferCredentialDto) {
    this.issueCredentialService.requestCredential(offerCredentialDto);
  }

  @Post('credential')
  async issueCredential(@Body() requestCredentialDto: RequestCredentialDto) {
    this.issueCredentialService.issueCredential(requestCredentialDto);
  }

  @Post('ack')
  async acknowledgeCredential(@Body() issueCredentialDto: IssueCredentialDto) {
    this.issueCredentialService.acknowledgeCredential(issueCredentialDto);
  }
}
