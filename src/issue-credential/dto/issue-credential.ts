import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { DID } from '@extrimian/agent';

export class IssueCredentialDto {
  // "type":"https://didcomm.org/issue-credential/3.0/issue-credential",
  //  "id":"7a476bd8-cc3f-4d80-b784-caeb2ff265da",
  //  "thid":"7f62f655-9cac-4728-854a-775ba6944593",
  //  "from":"did:example:issuer",
  //  "to":[
  //     "did:example:holder"
  //  ],
  //  "body":{
  //  },
  //  "attachments":[

  @ApiProperty({
    type: IssuanceMessageTypes,
    description: 'El tipo de mensaje WACI, en este caso una credencial',
  })
  type: IssuanceMessageTypes.IssueCredential;

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
    description: 'Los attachments del mensaje',
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
    this.type = IssuanceMessageTypes.IssueCredential;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
    this.attachments = attachments;
  }
}
