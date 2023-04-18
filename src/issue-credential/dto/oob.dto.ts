import { DID } from '@extrimian/agent';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { OobInvitationBody } from './create-oob.dto';
import { ApiProperty } from '@nestjs/swagger';

// We need this to trigger
export class OobInvitationDto {
  @ApiProperty({
    type: IssuanceMessageTypes.OutOfBandInvitation,
    description: 'El tipo de mensaje WACI, en este caso una invitación',
    example: IssuanceMessageTypes.OutOfBandInvitation,
  })
  type: IssuanceMessageTypes.OutOfBandInvitation;

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

  constructor(
    type: IssuanceMessageTypes.OutOfBandInvitation,
    id: string,
    from: DID,
    body: OobInvitationBody,
  ) {
    this.type = type;
    this.id = id;
    this.from = from;
    this.body = body;
  }
}
