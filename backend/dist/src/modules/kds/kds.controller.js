"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KdsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const kds_service_1 = require("./kds.service");
const reject_item_dto_1 = require("./dto/reject-item.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let KdsController = class KdsController {
    constructor(kdsService) {
        this.kdsService = kdsService;
    }
    getOrders(user) {
        return this.kdsService.getOrders(user);
    }
    accept(itemId, user) {
        return this.kdsService.updateItemStatus(itemId, 'accepted', user);
    }
    preparing(itemId, user) {
        return this.kdsService.updateItemStatus(itemId, 'preparing', user);
    }
    ready(itemId, user) {
        return this.kdsService.updateItemStatus(itemId, 'ready', user);
    }
    complete(itemId, user) {
        return this.kdsService.updateItemStatus(itemId, 'completed', user);
    }
    reject(itemId, dto, user) {
        return this.kdsService.updateItemStatus(itemId, 'rejected', user, dto);
    }
    queueStats(user) {
        return this.kdsService.getQueueStats(user);
    }
};
exports.KdsController = KdsController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Patch)('items/:itemId/accept'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)('items/:itemId/preparing'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "preparing", null);
__decorate([
    (0, common_1.Patch)('items/:itemId/ready'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "ready", null);
__decorate([
    (0, common_1.Patch)('items/:itemId/complete'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)('items/:itemId/reject'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_item_dto_1.RejectItemDto, Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('queue-stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "queueStats", null);
exports.KdsController = KdsController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, swagger_1.ApiTags)('KDS'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('vendor_kitchen', 'vendor_cashier', 'vendor_owner', 'admin'),
    (0, common_1.Controller)('kds'),
    __metadata("design:paramtypes", [kds_service_1.KdsService])
], KdsController);
//# sourceMappingURL=kds.controller.js.map