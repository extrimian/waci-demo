import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PresentationGoalCode } from '../utils/presentation-utils';

export interface PresentationInvitationBody {
  goal_code: string;
  accept: string[];
  [key: string]: any;
}

export class CreatePresentationInvitationDto {
  @ApiProperty({
    type: PresentationGoalCode,
    description: 'El goalCode WACI para la invitación',
    example: PresentationGoalCode,
  })
  goalCode: string;

  @ApiProperty({
    type: String,
    description: 'El DID del verifier',
    example: 'did:quarkid:matic:verifier',
  })
  senderDid: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: PresentationInvitationBody;
}
