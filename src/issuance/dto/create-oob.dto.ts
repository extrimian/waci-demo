import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaciGoalCodes } from 'src/agent/utils/waci-types';

export interface InvitationBody {
  goal_code: string;
  accept: string[];
  [key: string]: any;
}
export class CreateOobInvitationDto {
  @ApiProperty({
    type: WaciGoalCodes.Issuance,
    description: 'El goalCode WACI para la invitación',
    example: WaciGoalCodes.Issuance,
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
