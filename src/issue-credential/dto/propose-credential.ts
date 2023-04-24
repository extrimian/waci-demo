import { DID } from '@extrimian/agent';
import { ApiProperty } from '@nestjs/swagger';
import { WaciMessageTypes } from '../utils/issuance-utils';
export class ProposeCredentialDto {
  @ApiProperty({
    type: String,
    description:
      'El tipo de mensaje WACI, en este caso una propuesta de credencial',
    example: WaciMessageTypes.ProposeCredential,
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
    this.type = WaciMessageTypes.ProposeCredential;
    this.id = id;
    this.pthid = pthid;
    this.from = from;
    this.to = to;
  }
}
