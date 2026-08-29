import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiTags,
} from '@nestjs/swagger';

import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Get the current user\'s cart' })
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @ApiOperation({ summary: 'Add a product to the cart (or set quantity if already present)' })
  @Post('items')
  addItem(@Request() req, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Update the quantity of a cart item' })
  @ApiParam({ name: 'itemId', description: 'CartItem UUID' })
  @Patch('items/:itemId')
  updateItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiParam({ name: 'itemId', description: 'CartItem UUID' })
  @Delete('items/:itemId')
  removeItem(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @ApiOperation({ summary: 'Clear all items from the cart' })
  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
