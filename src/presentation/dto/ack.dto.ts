import { ApiProperty } from '@nestjs/swagger';
import { PresentationMessageTypes } from '../../agent/utils/waci-types';

export class PresentationAckDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje WACI, en este caso un ACK',
    example: PresentationMessageTypes.Ack,
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
    description: 'El DID del verifier',
    example: 'did:quarkid:matic:verifier',
  })
  from: string;

  @ApiProperty({
    type: Array<String>,
    description: 'El DID del prover',
    examples: ['did:quarkid:matic:prover'],
  })
  to: Array<string>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  constructor(
    id: string,
    thid: string,
    from: string,
    to: Array<string>,
    body: any,
  ) {
    this.type = PresentationMessageTypes.Ack;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
  }
}
