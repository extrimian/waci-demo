import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { DID } from '@extrimian/agent';

export class IssueCredentialDto {
  // @ApiProperty({
  //   type: IssuanceMessageTypes,
  //   description: 'El tipo de mensaje WACI, en este caso una credencial',
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
  //   type: DID,
  //   description: 'El DID del issuer',
  //   example: 'did:quarkid:matic:issuer',
  // })
  // from: DID;

  // @ApiProperty({
  //   type: Array<DID>,
  //   description: 'El DID del holder',
  //   examples: ['did:quarkid:matic:holder'],
  // })
  // to: Array<DID>;

  // @ApiProperty({
  //   type: Object,
  //   description: 'El cuerpo del mensaje',
  // })
  // body: any;

  // @ApiProperty({
  //   type: Object,
  //   description: 'Los attachments del mensaje',
  // })
  // attachments: Array<any>;

  // constructor(
  //   id: string,
  //   thid: string,
  //   from: DID,
  //   to: Array<DID>,
  //   body: any,
  //   attachments: Array<any>,
  // ) {
  //   this.type = IssuanceMessageTypes.IssueCredential;
  //   this.id = id;
  //   this.thid = thid;
  //   this.from = from;
  //   this.to = to;
  //   this.body = body;
  //   this.attachments = attachments;
  // }
}
