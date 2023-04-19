import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentType, AgentTypes } from './utils/agent-types';

@ApiTags('Agent Management')
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiBadRequestResponse({ description: 'El tipo de agente es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando el agente',
  })
  @ApiCreatedResponse({ description: 'El agente fue creado exitosamente' })
  async create() {
    try {
      return await this.agentService.create();
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrió un error inseperado creando el DID',
        error,
      );
    }
  }

  @Get()
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':type')
  findOne(@Param('type') type: AgentType) {
    if (!AgentTypes[type])
      throw new BadRequestException(
        `El tipo de agente ${type} es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );

    return this.agentService.findOne(type);
  }

  @Delete(':type')
  remove(@Param('type') type: AgentType) {
    if (!AgentTypes[type])
      throw new BadRequestException(
        `El tipo de agente ${type} es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );
    return this.agentService.remove(type);
  }
}
