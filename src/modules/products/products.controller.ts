import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Produtos')
@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Tenant() clientId: string) {
    return this.productsService.findAll(clientId);
  }
} 