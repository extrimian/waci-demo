import { ApiProperty } from '@nestjs/swagger';
import { DID } from '@extrimian/agent';
import { IssuanceMessageTypes } from '../utils/issuance-utils';

export class OfferCredentialDto {
  @ApiProperty({
    type: String,
    description:
      'El tipo de mensaje WACI, en este caso una oferta de credencial',
    example: IssuanceMessageTypes.OfferCredential,
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
      'El ID del mensaje padre del hilo, la invitación generada en primer paso',
  })
  thid: string;

  @ApiProperty({
    type: DID,
    description: 'El DID del issuer',
    example: 'did:quarkid:matic:issuer',
  })
  from: DID;

  @ApiProperty({
    type: Array<DID>,
    description: 'El DID del holder',
    examples: ['did:quarkid:matic:holder'],
  })
  to: Array<DID>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  @ApiProperty({
    type: Array<Object>,
    description: 'Los Credential Manifest adjuntos al mensaje',
  })
  attachments: Array<any>;

  constructor(
    id: string,
    thid: string,
    from: DID,
    to: Array<DID>,
    body: any,
    attachments: Array<any>,
  ) {
    this.type = IssuanceMessageTypes.OfferCredential;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
    this.attachments = attachments;
  }
}
