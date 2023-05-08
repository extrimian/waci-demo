import { ApiProperty } from '@nestjs/swagger';
import { PresentationInvitationBody } from './create-invitation.dto';
import { PresentationMessageTypes } from '../utils/presentation-utils';

export class PresentationInvitationDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje, en este caso una invitación',
    example: PresentationMessageTypes.Invitation,
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'El id del mensaje',
    example: 'invitation-id',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'El DID del verifier',
    example: 'did:quarkid:matic:verifier',
  })
  from: string;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: PresentationInvitationBody;

  constructor(id: string, from: string, body: PresentationInvitationBody) {
    this.type = PresentationMessageTypes.Invitation;
    this.id = id;
    this.from = from;
    this.body = body;
  }
}
