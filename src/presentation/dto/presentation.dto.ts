import { ApiProperty } from '@nestjs/swagger';
import { PresentationMessageTypes } from '../utils/presentation-utils';

export class PresentationProofDto {
  // "type": "https://didcomm.org/present-proof/3.0/presentation",
  // "id": "f1ca8245-ab2d-4d9c-8d7d-94bf310314ef",
  // "thid": "95e63a5f-73e1-46ac-b269-48bb22591bfa",
  // "from": "did:example:prover",
  // "to": [
  //   "did:example:verifier"
  // ],
  // "body": {},
  // "attachments":

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
