import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssuanceGoalCode } from '../utils/issuance-utils';

export interface InvitationBody {
  goal_code: string;
  accept: string[];
  [key: string]: any;
}
export class CreateOobInvitationDto {
  @ApiProperty({
    type: IssuanceGoalCode,
    description: 'El goalCode WACI para la invitación',
    example: IssuanceGoalCode,
  })
  goalCode: string;

  @ApiProperty({
    type: String,
    description: 'El DID del issuer',
    example: 'did:quarkid:matic:issuer',
  })
  senderDid: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: InvitationBody;
}
