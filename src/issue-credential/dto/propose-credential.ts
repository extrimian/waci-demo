import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { DID } from '@extrimian/agent';

export class ProposeCredentialDto {
  @ApiProperty({
    type: IssuanceMessageTypes,
    description: 'El tipo de mensaje WACI',
    example: IssuanceMessageTypes.ProposeCredential,
  })
  type: IssuanceMessageTypes;

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
    example: 'did:quarkid:matic:issuer',
  })
  to: Array<DID>;
}
