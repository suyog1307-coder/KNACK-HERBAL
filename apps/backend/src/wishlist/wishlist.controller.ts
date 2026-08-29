import {
  Controller, Get, Post, Delete, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @ApiOperation({ summary: 'Get my wishlist' })
  @Get()
  getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @ApiOperation({ summary: 'Add a product to wishlist' })
  @ApiParam({ name: 'productId' })
  @Post(':productId')
  add(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.addToWishlist(req.user.id, productId);
  }

  @ApiOperation({ summary: 'Remove a product from wishlist' })
  @ApiParam({ name: 'productId' })
  @Delete(':productId')
  remove(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.removeFromWishlist(req.user.id, productId);
  }

  @ApiOperation({ summary: 'Clear entire wishlist' })
  @Delete()
  clear(@Request() req) {
    return this.wishlistService.clearWishlist(req.user.id);
  }
}
