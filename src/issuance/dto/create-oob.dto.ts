import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaciGoalCodes } from '../utils/issuance-utils';

export interface OobInvitationBody {
  goal_code: WaciGoalCodes.Issuance;
  accept: string[];
  [key: string]: any;
}
export class CreateOobInvitationDto {
  @ApiProperty({
    type: WaciGoalCodes.Issuance,
    description: 'El goalCode WACI para la invitación',
    example: WaciGoalCodes.Issuance,
  })
  goalCode: WaciGoalCodes.Issuance;

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
  body: OobInvitationBody;
}
