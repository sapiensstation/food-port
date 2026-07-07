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
exports.DisplayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const orders_service_1 = require("./orders.service");
const Public = () => (0, common_1.SetMetadata)('isPublic', true);
let DisplayController = class DisplayController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    getBoard(vendorId) {
        return this.ordersService.getDisplayBoard(vendorId);
    }
};
exports.DisplayController = DisplayController;
__decorate([
    Public(),
    (0, common_1.Get)('board'),
    __param(0, (0, common_1.Query)('vendor_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisplayController.prototype, "getBoard", null);
exports.DisplayController = DisplayController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, swagger_1.ApiTags)('Display Board'),
    (0, common_1.Controller)('display'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], DisplayController);
//# sourceMappingURL=display.controller.js.map