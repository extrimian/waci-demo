import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../../agent/utils/waci-types';
export class ProposeCredentialDto {
  @ApiProperty({
    type: String,
    description:
      'El tipo de mensaje WACI, en este caso una propuesta de credencial',
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
    type: String,
    description: 'El DID del holder',
    example: 'did:method:holder',
  })
  from: string;

  @ApiProperty({
    type: Array<String>,
    description: 'El DID de los issuers',
    examples: ['did:method:issuer'],
  })
  to: Array<string>;

  constructor(id: string, pthid: string, from: string, to: Array<string>) {
    this.type = IssuanceMessageTypes.ProposeCredential;
    this.id = id;
    this.pthid = pthid;
    this.from = from;
    this.to = to;
  }
}
