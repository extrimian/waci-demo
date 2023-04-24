import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  BadRequestException,
  InternalServerErrorException,
  Body,
  Logger,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentType, AgentTypes } from './utils/agent-types';
import { CreateByTypeDto } from './dto/create-agents.dto';

function validateAgentTypes(types: AgentType[]) {
  types.forEach((type) => {
    if (!AgentTypes[type])
      throw new BadRequestException(
        `El tipo de agente ${type} es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );
  });
}

@ApiTags('Agent Management')
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiBadRequestResponse({ description: 'El tipo de agente es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando los agentes',
  })
  @ApiCreatedResponse({
    description: 'Los agentes fueron creados exitosamente',
  })
  async create(@Body() createByTypeDto: CreateByTypeDto): Promise<any> {
    validateAgentTypes(createByTypeDto.types);

    try {
      return await this.agentService.create(createByTypeDto.types);
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrió un error inseperado creando el DID',
        error,
      );
    }
  }

  @Get(':type')
  async findByType(@Param('type') type: AgentType) {
    validateAgentTypes([type]);

    return this.agentService.findByType(type);
  }

  @Get()
  async findAll() {
    const resolvedAgents = await this.agentService.findAll();

    return resolvedAgents;
  }
  @Delete(':type')
  async remove(@Param('type') type: AgentType) {
    validateAgentTypes([type]);

    await this.agentService.remove(type);
  }

  @Delete()
  async removeAll() {
    await this.agentService.removeAll();
  }
}
