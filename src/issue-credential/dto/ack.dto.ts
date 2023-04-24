import { ApiProperty } from '@nestjs/swagger';
import { DID } from '@extrimian/agent';
import { WaciMessageTypes } from '../utils/issuance-utils';

class AckDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje WACI, en este caso un ACK',
    example: WaciMessageTypes.Ack,
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
    this.type = WaciMessageTypes.Ack;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
  }
}
