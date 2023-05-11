import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../../agent/utils/waci-types';

export class IssueCredentialDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje WACI, en este caso una credencial',
    example: IssuanceMessageTypes.IssueCredential,
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
    type: String,
    description: 'El DID del issuer',
    example: 'did:method:issuer',
  })
  from: string;

  @ApiProperty({
    type: Array<String>,
    description: 'El DID del holder',
    examples: ['did:method:holder'],
  })
  to: Array<string>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  @ApiProperty({
    type: Object,
    description: 'Los attachments del mensaje',
  })
  attachments: Array<any>;

  constructor(
    id: string,
    thid: string,
    from: string,
    to: Array<string>,
    body: any,
    attachments: Array<any>,
  ) {
    this.type = IssuanceMessageTypes.IssueCredential;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
    this.attachments = attachments;
  }
}
