import { OrdersService } from './orders.service';
export declare class DisplayController {
    private ordersService;
    constructor(ordersService: OrdersService);
    getBoard(): Promise<{
        food_village_name: string;
        vendors: {
            vendor_id: string;
            vendor_name: string;
            booth_color: string;
            logo_url: string | null;
            preparing: number[];
            ready: number[];
        }[];
        last_updated: string;
    }>;
}
