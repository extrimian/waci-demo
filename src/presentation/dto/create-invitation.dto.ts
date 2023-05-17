import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaciGoalCodes } from 'src/agent/utils/waci-types';

export interface PresentationInvitationBody {
  goal_code: string;
  accept: string[];
  [key: string]: any;
}

export class CreatePresentationInvitationDto {
  @ApiProperty({
    type: WaciGoalCodes.Presentation,
    description: 'El goalCode WACI para la invitación',
    example: WaciGoalCodes.Presentation,
  })
  goalCode: string;

  @ApiProperty({
    type: String,
    description: 'El DID del verifier',
    example: 'did:method:verifier',
  })
  senderDid: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: PresentationInvitationBody;
}
