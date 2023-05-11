import { ApiProperty } from '@nestjs/swagger';
import { PresentationMessageTypes } from '../../agent/utils/waci-types';

export class PresentationRequestDto {
  @ApiProperty({
    type: String,
    description:
      'El tipo de mensaje, en este caso una solicitud de presentación',
    example: PresentationMessageTypes.RequestPresentation,
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'El id del mensaje',
    example: 'request-presentation-id',
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
    description: 'El DID de los provers',
    examples: ['did:quarkid:matic:prover'],
  })
  to: Array<string>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  @ApiProperty({
    type: Array<Object>,
    description: 'Las Credential Applications adjuntas al mensaje',
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
    this.type = PresentationMessageTypes.RequestPresentation;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
    this.attachments = attachments;
  }
}
