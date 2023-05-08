import { InvitationBody } from './create-oob.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../utils/issuance-utils';
import base64url from 'base64url';
export class OobInvitationDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje WACI, en este caso una invitación',
    example: IssuanceMessageTypes.OobInvitation,
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'El ID del mensaje',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'El DID del issuer',
    example: 'did:quarkid:matic:issuer',
  })
  from: string;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: InvitationBody;

  constructor(id: string, from: string, body: InvitationBody) {
    this.type = IssuanceMessageTypes.OobInvitation;
    this.id = id;
    this.from = from;
    this.body = body;
  }

  static from(invitationMessage: string) {
    const invitationJson = JSON.parse(
      base64url.decode(invitationMessage.split('_oob=')[1]),
    );

    return new OobInvitationDto(
      invitationJson.id,
      invitationJson.from,
      invitationJson.body,
    );
  }

  static toInvitationMessage(oobInvitationDto: OobInvitationDto) {
    const protocol = 'didcomm://?_oob=';
    const invitationMessage =
      protocol + base64url.encode(JSON.stringify(oobInvitationDto));

    return invitationMessage;
  }
}
