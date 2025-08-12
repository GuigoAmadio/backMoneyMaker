import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { UserRole } from '@prisma/client';
import { AnnotationsService } from './annotations.service';

@ApiTags('Anotações')
@Controller({ path: 'annotations', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AnnotationsController {
  private readonly logger = new Logger(AnnotationsController.name);

  constructor(private readonly annotationsService: AnnotationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar anotações por usuário e/ou appointment' })
  async list(
    @Tenant() clientId: string,
    @Query('userId') userId: string,
    @Query('appointmentId') appointmentId: string | undefined,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Req() req: Request,
  ) {
    const user: any = (req as any)?.user;
    return this.annotationsService.list({
      clientId,
      userId,
      appointmentId,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      requester: user ? { userId: (user as any).id, role: (user as any).role } : undefined,
    });
  }

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar anotação' })
  async create(
    @Tenant() clientId: string,
    @Body()
    body: {
      userId: string;
      appointmentId?: string;
      content: string;
      visibility?: 'PRIVATE_TO_EMPLOYEE' | 'SHARED_WITH_CLIENT';
    },
    @Req() req: Request,
  ) {
    const user: any = (req as any)?.user;
    return this.annotationsService.create({
      clientId,
      userId: body.userId,
      appointmentId: body.appointmentId,
      content: body.content,
      visibility: body.visibility,
      requester: user ? { userId: (user as any).id, role: (user as any).role } : undefined,
    });
  }

  @Patch(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar anotação' })
  async update(
    @Tenant() clientId: string,
    @Param('id') id: string,
    @Body()
    body: {
      content?: string;
      visibility?: 'PRIVATE_TO_EMPLOYEE' | 'SHARED_WITH_CLIENT';
      isPinned?: boolean;
    },
    @Req() req: Request,
  ) {
    const user: any = (req as any)?.user;
    return this.annotationsService.update({
      id,
      clientId,
      content: body.content,
      visibility: body.visibility,
      isPinned: body.isPinned,
      requester: user ? { userId: (user as any).id, role: (user as any).role } : undefined,
    });
  }

  @Delete(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Excluir anotação' })
  async remove(@Tenant() clientId: string, @Param('id') id: string, @Req() req: Request) {
    const user: any = (req as any)?.user;
    return this.annotationsService.remove({
      id,
      clientId,
      requester: user ? { userId: (user as any).id, role: (user as any).role } : undefined,
    });
  }
}
