import { ApiProperty } from '@nestjs/swagger';
import { IssuanceMessageTypes } from '../issue-credential.service';
import { DID } from '@extrimian/agent';

class AckDto {
  //    "type":"https://didcomm.org/issue-credential/3.0/ack",
  //  "id":"d1fb78ad-c452-4c52-a7a0-b68b3e82cdd3",
  //  "thid":"7f62f655-9cac-4728-854a-775ba6944593",
  //  "from":"did:example:holder",
  //  "to":[
  //     "did:example:issuer"
  //  ],
  //  "body":{

  //  }

  @ApiProperty({
    type: IssuanceMessageTypes,
    description: 'El tipo de mensaje WACI, en este caso un ACK',
  })
  type: IssuanceMessageTypes.Ack;

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
    description: 'El DID del holder',
    example: 'did:quarkid:matic:holder',
  })
  from: DID;

  @ApiProperty({
    type: Array<DID>,
    description: 'El DID del issuer',
    examples: ['did:quarkid:matic:issuer'],
  })
  to: Array<DID>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  constructor(id: string, thid: string, from: DID, to: Array<DID>, body: any) {
    this.type = IssuanceMessageTypes.Acknowledgement;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
  }
}
