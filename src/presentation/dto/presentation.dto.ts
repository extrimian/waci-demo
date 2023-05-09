import { ApiProperty } from '@nestjs/swagger';
import { PresentationMessageTypes } from '../../agent/utils/waci-types';

export class PresentationProofDto {
  @ApiProperty({
    type: String,
    description: 'El tipo de mensaje WACI, en este caso una presentación',
    example: PresentationMessageTypes.PresentProof,
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
      'El ID del mensaje padre, la propuesta de presentación generada en el primer paso',
  })
  thid: string;

  @ApiProperty({
    type: String,
    description: 'El DID del prover',
    example: 'did:quarkid:matic:prover',
  })
  from: string;

  @ApiProperty({
    type: Array<String>,
    description: 'El DID del verifier',
    examples: ['did:quarkid:matic:verifier'],
  })
  to: Array<string>;

  @ApiProperty({
    type: Object,
    description: 'El cuerpo del mensaje',
  })
  body: any;

  @ApiProperty({
    type: Array<Object>,
    description: 'Los adjuntos del mensaje',
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
    this.type = PresentationMessageTypes.PresentProof;
    this.id = id;
    this.thid = thid;
    this.from = from;
    this.to = to;
    this.body = body;
    this.attachments = attachments;
  }
}
