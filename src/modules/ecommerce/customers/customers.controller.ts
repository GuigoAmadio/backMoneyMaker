import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Ecommerce - Customers')
@Controller('ecommerce/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ========================================
  // ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO)
  // ========================================

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo customer no ecommerce' })
  @ApiResponse({ status: 201, description: 'Customer registrado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  async register(@Request() req, @Body() registerDto: any) {
    const clientId = req.clientId;
    return this.customersService.register(clientId, registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login de customer no ecommerce' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req, @Body() loginDto: any) {
    const clientId = req.clientId;
    return this.customersService.login(clientId, loginDto);
  }

  // ========================================
  // ENDPOINTS ADMINISTRATIVOS
  // ========================================

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os customers' })
  @ApiResponse({ status: 200, description: 'Lista de customers retornada com sucesso' })
  async findAll(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    const clientId = req.clientId;
    return this.customersService.findAll(clientId, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar customer por ID' })
  @ApiResponse({ status: 200, description: 'Customer encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Customer não encontrado' })
  async findOne(@Request() req, @Param('id') id: string) {
    const clientId = req.clientId;
    return this.customersService.findOne(clientId, id);
  }
}
