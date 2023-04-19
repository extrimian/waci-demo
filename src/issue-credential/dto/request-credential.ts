import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { DID } from '@extrimian/agent';

export class RequestCredentialDto {
  // @ApiProperty({
  //   type: IssuanceMessageTypes,
  //   description:
  //     'El tipo de mensaje WACI, en este caso una solicitud de credencial',
  // })
  // type: string;

  // @ApiProperty({
  //   type: String,
  //   description: 'El ID del mensaje',
  // })
  // id: string;

  // @ApiProperty({
  //   type: String,
  //   description:
  //     'El ID del mensaje padre del hilo, la invitación generada en primer paso',
  // })
  // thid: string;

  // @ApiProperty({
  //   type: String,
  //   description: 'El DID del holder',
  //   example: 'did:quarkid:matic:holder',
  // })
  // from: string;

  // @ApiProperty({
  //   type: Array<DID>,
  //   description: 'El DID del issuer',
  //   examples: ['did:quarkid:matic:issuer'],
  // })
  // to: Array<DID>;

  // @ApiProperty({
  //   type: Object,
  //   description: 'El cuerpo del mensaje',
  // })
  // body: any;

  // @ApiProperty({
  //   type: Array<Object>,
  //   description: 'Las Credential Applications adjuntas al mensaje',
  // })
  // attachments: Array<any>;

  // constructor(
  //   id: string,
  //   thid: string,
  //   from: string,
  //   to: Array<DID>,
  //   body: any,
  //   attachments: Array<any>,
  // ) {
  //   this.type = IssuanceMessageTypes.RequestCredential;
  //   this.id = id;
  //   this.thid = thid;
  //   this.from = from;
  //   this.to = to;
  //   this.body = body;
  //   this.attachments = attachments;
  // }
}
