import { DID } from '@extrimian/agent';
import { OobInvitationBody } from './create-oob.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';

// We need this to trigger
export class OobInvitationDto {
  @ApiProperty({
    type: IssuanceMessageTypes,
    description: 'El tipo de mensaje WACI, en este caso una invitación',
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'El ID del mensaje',
  })
  id: string;

  @ApiProperty({
    type: DID,
    description: 'El DID del issuer',
    example: 'did:quarkid:matic:issuer',
  })
  from: DID;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: OobInvitationBody;

  constructor(id: string, from: DID, body: OobInvitationBody) {
    this.type = IssuanceMessageTypes.OutOfBandInvitation;
    this.id = id;
    this.from = from;
    this.body = body;
  }
}
