import { ApiProperty } from '@nestjs/swagger';
import { PresentationMessageTypes } from '../../agent/utils/waci-types';

export class PresentationProposalDto {
  @ApiProperty({
    type: String,
    description:
      'El tipo de mensaje WACI, en este caso una propuesta de presentación',
    example: PresentationMessageTypes.ProposePresentation,
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
      'El ID del mensaje padre, la invitación generada en el paso anterior',
  })
  pthid: string;

  @ApiProperty({
    type: String,
    description: 'El DID del prover',
    example: 'did:quarkid:matic:prover',
  })
  from: string;

  @ApiProperty({
    type: Array<String>,
    description: 'El DID de los verifiers',
    examples: ['did:quarkid:matic:verifier'],
  })
  to: Array<string>;

  constructor(id: string, pthid: string, from: string, to: Array<string>) {
    this.type = PresentationMessageTypes.ProposePresentation;
    this.id = id;
    this.pthid = pthid;
    this.from = from;
    this.to = to;
  }
}
