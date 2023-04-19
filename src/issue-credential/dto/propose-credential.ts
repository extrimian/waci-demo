import { ApiProperty } from '@nestjs/swagger';
import { DID } from '@extrimian/agent';
import { IssuanceMessageTypes } from '../issue-credential.service';

export class ProposeCredentialDto {
  @ApiProperty({
    type: IssuanceMessageTypes.ProposeCredential,
    description: 'El tipo de mensaje WACI',
    example: IssuanceMessageTypes.ProposeCredential,
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'El ID del mensaje',
  })
  id: string;

  @ApiProperty({
    type: String,
    description:
      'El ID del mensaje padre, la invitación generada en el paso anterior',
  })
  pthid: string;

  @ApiProperty({
    type: DID,
    description: 'El DID del holder',
    example: 'did:quarkid:matic:holder',
  })
  from: DID;

  @ApiProperty({
    type: Array<DID>,
    description: 'El DID de los issuers',
    examples: ['did:quarkid:matic:issuer'],
  })
  to: Array<DID>;

  constructor(id: string, pthid: string, from: DID, to: Array<DID>) {
    this.type = IssuanceMessageTypes.ProposeCredential;
    this.id = id;
    this.pthid = pthid;
    this.from = from;
    this.to = to;
  }
}
