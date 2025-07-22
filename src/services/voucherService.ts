import adminApi from './adminApi';
import api from './api';

// Types based on OpenAPI spec
export interface VoucherResponse {
	userVoucherStatusId: number;
	voucherCode: string;
	discount: number;
	description: string;
	startDate: string;
	endDate: string;
	usageLimit?: number;
	usageCount?: number;
	remainingCount?: number;
	createdAt?: string;
	status: string;
	isDeleted: boolean;
	isExpired: boolean;
	isActive: boolean;
	canUse: boolean;
	displayStatus: string;
}

export interface VoucherManageRequest {
	UserVoucherStatusId?: number;
	VoucherCode: string;
	Discount: number;
	Description: string;
	StartDate: string;
	EndDate: string;
	UsageLimit: number;
	RemainingCount: number;
	Status: string;
	IsDeleted?: boolean;
}

export interface VoucherStatsResponse {
	voucherCode: string;
	totalUsers: number;
	usedCount: number;
	remainingCount: number;
	usagePercentage: number;
	userStats: VoucherUserStats[];
}

export interface VoucherUserStats {
	userInfoId: number;
	userName: string;
	email: string;
	usageCount?: number;
	remainingCount?: number;
	status: string;
	hasUsed: boolean;
}

export const voucherService = {
	// Get all vouchers
	getAllVouchers: async (): Promise<VoucherResponse[]> => {
		const response = await adminApi.get('/admin/vouchers/all');
		return response.data.data;
	},

	// Get voucher by ID
	getVoucherById: async (id: number): Promise<VoucherResponse> => {
		const response = await adminApi.get(`/admin/vouchers/${id}`);
		return response.data.data;
	},

	// Get voucher by code
	getVoucherByCode: async (code: string): Promise<VoucherResponse> => {
		const response = await adminApi.get(`/admin/vouchers/code/${code}`);
		return response.data.data;
	},

	// Get voucher stats
	getVoucherStats: async (code: string): Promise<VoucherStatsResponse> => {
		const response = await adminApi.get(`/admin/vouchers/stats/${code}`);
		return response.data.data;
	},

	// Create or update voucher
	manageVoucher: async (
		data: VoucherManageRequest,
	): Promise<VoucherResponse> => {
		const formData = new FormData();

		if (data.UserVoucherStatusId) {
			formData.append(
				'UserVoucherStatusId',
				data.UserVoucherStatusId.toString(),
			);
		}
		formData.append('VoucherCode', data.VoucherCode);
		formData.append('Discount', data.Discount.toString());
		formData.append('Description', data.Description);
		formData.append('StartDate', data.StartDate);
		formData.append('EndDate', data.EndDate);
		formData.append('UsageLimit', data.UsageLimit.toString());
		formData.append('RemainingCount', data.RemainingCount.toString());
		formData.append('Status', data.Status);

		if (data.IsDeleted !== undefined) {
			formData.append('IsDeleted', data.IsDeleted.toString());
		}

		const response = await adminApi.post('/admin/vouchers/manage', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data.data;
	},

	// Get voucher by code
	getVoucherForUser: async (): Promise<VoucherResponse> => {
		const response = await api.get(`/user/vouchers`);
		console.log(response.data.data);
		return response.data.data;
	},

	// Validate voucher code
	validateVoucher: async (voucherCode: string): Promise<VoucherResponse> => {
		const response = await api.get(`/user/vouchers/validate/${voucherCode}`);
		return response.data.data;
	},
};

export default voucherService;

