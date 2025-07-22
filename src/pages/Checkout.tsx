import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { addressService } from '../services/addressService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { useUserNotification } from '../services/userNotification';
import voucherService from '../services/voucherService';
import type {
	AddressResponse,
	CartItem,
	CreateOrderRequest,
	OrderResponse,
	VoucherResponse,
} from '../types';
import {
	CreditCardOutlined,
	DeleteOutlined,
	EnvironmentOutlined,
	GiftOutlined,
	PhoneOutlined,
	ShoppingCartOutlined,
	TruckOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Button,
	Card,
	Col,
	Divider,
	Form,
	Image,
	Input,
	Modal,
	Radio,
	Row,
	Select,
	Space,
	Spin,
	Steps,
	Table,
	Tooltip,
	Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CheckoutFormValues {
	phoneNumber: string;
	paymentMethod: string;
	deliveryMethod: string;
	addressId?: number;
	newAddress?: string;
	voucherCode?: string;
}

export const Checkout: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const notification = useUserNotification();
	const { user } = useAuth();
	const { refreshCart } = useCart();
	const [form] = Form.useForm();
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [addresses, setAddresses] = useState<AddressResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);
	const [deleteAddressModalVisible, setDeleteAddressModalVisible] =
		useState(false);
	const [selectedAddressToDelete, setSelectedAddressToDelete] =
		useState<AddressResponse | null>(null);
	const [deletingAddress, setDeletingAddress] = useState(false);
	const [newAddressForm] = Form.useForm();
	const [isBuyNow, setIsBuyNow] = useState(false);
	const [shippingFee, setShippingFee] = useState(30000); // Default to standard
	const [voucherData, setVoucherData] = useState<VoucherResponse | null>(null);
	const [availableVouchers, setAvailableVouchers] = useState<VoucherResponse[]>(
		[],
	);
	const [applyingVoucher, setApplyingVoucher] = useState(false);

	// Check if user has complete profile information
	useEffect(() => {
		if (user) {
			// Check if user has userInfo and required fields
			const hasCompleteInfo =
				user.userInfo &&
				user.userInfo.fullName &&
				user.userInfo.fullName.trim() !== '' &&
				user.userInfo.address &&
				user.userInfo.address.trim() !== '';

			if (!hasCompleteInfo) {
				notification.warning(
					'Complete Profile Required',
					'Please update your full name and address in your profile before checkout',
				);
				navigate('/profile', {
					replace: true,
					state: { from: location.pathname },
				});
				return;
			}
		}
	}, [user, navigate, notification, location.pathname]);

	// Set default delivery method to 'standard' and payment method to 'COD' on mount
	useEffect(() => {
		// Fetch voucher data
		fetchVoucherData();

		form.setFieldsValue({ deliveryMethod: 'standard', paymentMethod: 'COD' });
		setShippingFee(30000);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchData = async () => {
		try {
			// Check if this is a "Buy Now" flow
			const urlParams = new URLSearchParams(location.search);
			const buyNowFlag = urlParams.get('buyNow') === 'true';

			if (buyNowFlag) {
				// Handle Buy Now flow
				console.log('Buy now flow detected'); // Debug log
				const buyNowItemData = localStorage.getItem('buyNowItem');
				console.log('Buy now item data:', buyNowItemData); // Debug log

				if (buyNowItemData) {
					try {
						const buyNowItem = JSON.parse(buyNowItemData);
						console.log('Parsed buy now item:', buyNowItem); // Debug log
						setCartItems([buyNowItem]);
						setIsBuyNow(true);

						// Clear the buy now item from localStorage
						localStorage.removeItem('buyNowItem');
					} catch (parseError) {
						console.error('Error parsing buy now item:', parseError);
						notification.error('Invalid purchase data');
						navigate('/flowers');
						return;
					}
				} else {
					console.log('No buy now item found in localStorage'); // Debug log
					notification.error('No item found for purchase');
					navigate('/flowers');
					return;
				}
			} else {
				// Handle normal cart checkout flow
				const cartResponse = await cartService.getMyCart();

				if (cartResponse.items.length === 0) {
					notification.warning('Your cart is empty');
					navigate('/cart');
					return;
				}

				setCartItems(cartResponse.items);
				setIsBuyNow(false);
			}

			// Fetch addresses for both flows
			const addressData = await addressService.getAddresses();
			setAddresses(addressData);
		} catch (err) {
			setError('Failed to load checkout data. Please try again.');
			console.error('Error fetching checkout data:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCreateAddress = async (values: { description: string }) => {
		try {
			const newAddress = await addressService.manageAddress({
				Description: values.description,
			});
			setAddresses([...addresses, newAddress]);
			form.setFieldsValue({ addressId: newAddress.addressId });
			setNewAddressModalVisible(false);
			newAddressForm.resetFields();
			notification.success('Address added successfully');
		} catch (err) {
			console.error('Error creating address:', err);
			notification.actionFailed('Create address', 'Failed to create address');
		}
	};

	const handleDeleteAddress = async () => {
		if (!selectedAddressToDelete) return;

		setDeletingAddress(true);
		try {
			await addressService.manageAddress({
				AddressId: selectedAddressToDelete.addressId,
				Description: selectedAddressToDelete.description || '',
				IsDeleted: true,
			});

			// Remove the deleted address from the list
			const updatedAddresses = addresses.filter(
				(addr) => addr.addressId !== selectedAddressToDelete.addressId,
			);
			setAddresses(updatedAddresses);

			// Clear the form field if the deleted address was selected
			const currentAddressId = form.getFieldValue('addressId');
			if (currentAddressId === selectedAddressToDelete.addressId) {
				form.setFieldsValue({ addressId: undefined });
			}

			setDeleteAddressModalVisible(false);
			setSelectedAddressToDelete(null);
			notification.success('Address deleted successfully');
		} catch (err) {
			console.error('Error deleting address:', err);
			notification.actionFailed('Delete address', 'Failed to delete address');
		} finally {
			setDeletingAddress(false);
		}
	};

	const handleShowDeleteConfirm = (address: AddressResponse) => {
		if (addresses.length === 1) {
			notification.warning(
				'Cannot delete address',
				'You must have at least one address for delivery',
			);
			return;
		}
		setSelectedAddressToDelete(address);
		setDeleteAddressModalVisible(true);
	};

	const handleApplyVoucher = async () => {
		const voucherCode = form.getFieldValue('voucherCode');
		console.log(voucherCode);
		if (!voucherCode || !voucherCode.trim()) {
			notification.warning(
				'Enter a voucher code',
				'Please enter a voucher code',
			);
			return;
		}

		setApplyingVoucher(true);
		try {
			const response = await voucherService.validateVoucher(voucherCode);
			setVoucherData(response);
			notification.success(
				'Voucher applied',
				`Voucher ${voucherCode} has been applied`,
			);
		} catch (err) {
			console.error('Error applying voucher:', err);
			notification.actionFailed('Apply voucher', 'Failed to apply voucher');
		} finally {
			setApplyingVoucher(false);
		}
	};

	const handleRemoveVoucher = () => {
		setVoucherData(null);
		form.setFieldsValue({ voucherCode: '' });
		notification.success('Voucher removed', 'The voucher has been removed');
	};

	const handleSelectVoucher = (voucher: VoucherResponse) => {
		setVoucherData(voucher);
		form.setFieldsValue({ voucherCode: voucher.voucherCode });
		notification.success(
			'Voucher selected',
			`Voucher ${voucher.voucherCode} has been applied`,
		);
	};

	const handleSubmitOrder = async (values: CheckoutFormValues) => {
		if (cartItems.length === 0) {
			notification.error('No items to order');
			return;
		}

		setSubmitting(true);
		try {
			// If this is a "Buy Now" order, we need to add the item to cart first
			if (isBuyNow && cartItems.length > 0) {
				const buyNowItem = cartItems[0];
				try {
					await cartService.addToCart(
						buyNowItem.flowerId?.toString() || '',
						buyNowItem.quantity,
					);
				} catch (cartError) {
					console.error('Error adding buy now item to cart:', cartError);
					notification.actionFailed(
						'Process order',
						'Failed to process order. Please try again.',
					);
					return;
				}
			}
			const orderData: CreateOrderRequest = {
				phoneNumber: values.phoneNumber,
				paymentMethod: values.paymentMethod,
				deliveryMethod: values.deliveryMethod,
				addressId: values.addressId,
				userVoucherStatusId: voucherData?.userVoucherStatusId,
			};

			const order: OrderResponse = await orderService.createOrder(orderData);

			// Handle different payment methods
			if (values.paymentMethod === 'VNPAY' && order.paymentUrl) {
				// VNPay payment - redirect to payment URL
				// For Buy Now: cart will be cleared in PaymentSuccess page
				// For regular checkout: cart will be cleared in PaymentSuccess page
				window.location.href = order.paymentUrl;
			} else if (values.paymentMethod === 'COD') {
				// COD payment - clear cart immediately and show success message
				try {
					if (isBuyNow) {
						// For Buy Now, clear the temporarily added item
						await cartService.clearCart();
					} else {
						// For regular checkout, clear the cart
						await cartService.clearCart();
					}
					// Refresh cart context after clearing
					await refreshCart();
				} catch (clearError) {
					console.warn('Failed to clear cart after COD order:', clearError);
					// Don't throw error here as the order was already created successfully
				}

				notification.success(
					'Order Placed Successfully',
					'Your order has been placed. You will pay cash on delivery.',
				);
				navigate(`/orders/${order.orderId}`);
			} else {
				// Fallback for other cases - clear cart immediately
				try {
					await cartService.clearCart();
					// Refresh cart context after clearing
					await refreshCart();
				} catch (clearError) {
					console.warn('Failed to clear cart after order:', clearError);
				}

				notification.orderSuccess(order.orderId);
				navigate(`/orders/${order.orderId}`);
			}
		} catch (err) {
			console.error('Error creating order:', err);
			notification.actionFailed(
				'Create order',
				'Failed to create order. Please try again.',
			);
		} finally {
			setSubmitting(false);
		}
	};

	const fetchVoucherData = async () => {
		try {
			const response = await voucherService.getVoucherForUser();
			console.log(response);
			// Ensure response is an array
			if (Array.isArray(response)) {
				setAvailableVouchers(response);
			} else {
				setAvailableVouchers([]);
			}
		} catch (error) {
			console.error('Error fetching vouchers:', error);
			setAvailableVouchers([]);
		}
	};

	const subtotal = cartItems.reduce((sum, item) => {
		// Handle both cart items and buy now items
		const price = item.unitPrice || item.flower?.price || 0;
		return sum + price * item.quantity;
	}, 0);

	const voucherDiscountAmount = voucherData
		? (subtotal * voucherData.discount) / 100
		: 0;
	const total = subtotal + shippingFee - voucherDiscountAmount;

	const orderSummaryColumns: ColumnsType<CartItem> = [
		{
			title: 'Product',
			dataIndex: 'flower',
			key: 'flower',
			render: (flower, record) => {
				// Handle both cart items and buy now items
				const name = record.flowerName || flower?.flowerName;
				const imageUrl = record.imageUrl || flower?.imageUrl;
				const price = record.unitPrice || flower?.price || 0;

				return (
					<Space size={12}>
						<Image
							width={50}
							height={50}
							src={imageUrl}
							alt={name}
							style={{ borderRadius: '6px', objectFit: 'cover' }}
						/>
						<div>
							<Text strong style={{ fontSize: '14px' }}>
								{name}
							</Text>
							<div style={{ color: '#666', fontSize: '12px' }}>
								{price.toLocaleString('vi-VN')} ₫
							</div>
						</div>
					</Space>
				);
			},
		},
		{
			title: 'Qty',
			dataIndex: 'quantity',
			key: 'quantity',
			width: 60,
			render: (quantity) => <Text>×{quantity}</Text>,
		},
		{
			title: 'Total',
			key: 'total',
			width: 100,
			render: (_, record) => {
				// Handle both cart items and buy now items
				const price = record.unitPrice || record.flower?.price || 0;
				return (
					<Text strong style={{ color: '#52c41a' }}>
						{(price * record.quantity).toLocaleString('vi-VN')} ₫
					</Text>
				);
			},
		},
	];

	const steps = [
		{
			title: 'Shipping Info',
			icon: <EnvironmentOutlined />,
		},
		{
			title: 'Payment',
			icon: <CreditCardOutlined />,
		},
		{
			title: 'Review',
			icon: <ShoppingCartOutlined />,
		},
	];

	if (loading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '400px',
				}}
			>
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: '16px' }}>
				<Alert message="Error" description={error} type="error" showIcon />
			</div>
		);
	}

	return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '80px 16px 40px',
			}}
		>
			<Title level={2} style={{ marginBottom: '32px' }}>
				{isBuyNow ? 'Quick Purchase' : 'Checkout'}
			</Title>

			{isBuyNow && (
				<Alert
					message="Quick Purchase"
					description="You are purchasing this item directly. It will be temporarily added to your cart for processing."
					type="info"
					showIcon
					style={{ marginBottom: '24px' }}
				/>
			)}

			<Steps current={0} items={steps} style={{ marginBottom: '32px' }} />

			<Row gutter={[32, 32]}>
				<Col xs={24} lg={16}>
					<Form
						form={form}
						layout="vertical"
						onFinish={handleSubmitOrder}
						size="large"
					>
						{/* Shipping Information */}
						<Card
							title={
								<Space>
									<EnvironmentOutlined />
									<span>Shipping Information</span>
								</Space>
							}
							style={{ marginBottom: '24px' }}
						>
							<Form.Item
								name="phoneNumber"
								label="Phone Number"
								rules={[
									{ required: true, message: 'Please enter your phone number' },
									{
										pattern: /^[0-9+\-\s()]+$/,
										message: 'Please enter a valid phone number',
									},
								]}
							>
								<Input
									prefix={<PhoneOutlined />}
									placeholder="Enter your phone number"
								/>
							</Form.Item>

							<Form.Item
								name="addressId"
								label="Delivery Address"
								rules={[
									{
										required: true,
										message: 'Please select a delivery address',
									},
								]}
							>
								<Select
									placeholder="Select delivery address"
									dropdownRender={(menu) => (
										<>
											{menu}
											<Divider style={{ margin: '8px 0' }} />
											<Space style={{ padding: '0 8px 4px' }}>
												<Button
													type="text"
													icon={<EnvironmentOutlined />}
													onClick={() => setNewAddressModalVisible(true)}
												>
													Add new address
												</Button>
											</Space>
										</>
									)}
									optionLabelProp="label"
								>
									{addresses.map((address) => (
										<Option
											key={address.addressId}
											value={address.addressId}
											label={
												<span>
													{address.userFullName} - {address.description}
												</span>
											}
										>
											<div
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
												}}
											>
												<div style={{ flex: 1 }}>
													<Text strong>{address.userFullName}</Text>
													<div style={{ color: '#666', fontSize: '12px' }}>
														{address.description}
													</div>
												</div>{' '}
												<Tooltip
													title={
														addresses.length === 1
															? 'Cannot delete the last address'
															: 'Delete this address'
													}
												>
													<Button
														type="text"
														size="small"
														danger
														disabled={addresses.length === 1}
														icon={<DeleteOutlined />}
														onClick={(e) => {
															e.stopPropagation();
															handleShowDeleteConfirm(address);
														}}
														style={{ marginLeft: '8px' }}
													/>
												</Tooltip>
											</div>
										</Option>
									))}
								</Select>
							</Form.Item>

							<Form.Item
								name="deliveryMethod"
								label="Delivery Method"
								rules={[
									{
										required: true,
										message: 'Please select a delivery method',
									},
								]}
							>
								<Radio.Group
									onChange={() => {
										// Always set to standard delivery fee
										setShippingFee(30000);
									}}
								>
									<Radio value="standard">
										<Space>
											<TruckOutlined />
											<div>
												<Text strong>Standard Delivery</Text>
												<div style={{ color: '#666', fontSize: '12px' }}>
													3-5 business days - 30,000 ₫
												</div>
											</div>
										</Space>
									</Radio>
								</Radio.Group>
							</Form.Item>
						</Card>

						{/* Payment Information */}
						<Card
							title={
								<Space>
									<CreditCardOutlined />
									<span>Payment Method</span>
								</Space>
							}
							style={{ marginBottom: '24px' }}
						>
							<Form.Item
								name="paymentMethod"
								rules={[
									{ required: true, message: 'Please select a payment method' },
								]}
							>
								<Radio.Group>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '16px',
										}}
									>
										<Radio value="VNPAY">
											<Space>
												<CreditCardOutlined />
												<div>
													<Text strong>VNPay</Text>
													<div style={{ color: '#666', fontSize: '12px' }}>
														Pay online with VNPay
													</div>
												</div>
											</Space>
										</Radio>
										<Radio value="COD">
											<Space>
												<TruckOutlined />
												<div>
													<Text strong>Cash on Delivery (COD)</Text>
													<div style={{ color: '#666', fontSize: '12px' }}>
														Pay with cash when you receive your order
													</div>
												</div>
											</Space>
										</Radio>
									</div>
								</Radio.Group>
							</Form.Item>
						</Card>

						{/* Voucher Section */}
						<Card
							title={
								<Space>
									<GiftOutlined />
									<span>Discount Code</span>
								</Space>
							}
							style={{ marginBottom: '24px' }}
						>
							{voucherData ? (
								<Form.Item label="Applied Voucher">
									<div
										style={{
											padding: '12px',
											background: '#f6ffed',
											border: '1px solid #b7eb8f',
											borderRadius: '6px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<div>
											<Text strong style={{ color: '#52c41a' }}>
												{voucherData.voucherCode}
											</Text>
											<div style={{ fontSize: '12px', color: '#666' }}>
												{voucherData.description} - {voucherData.discount}% off
											</div>
										</div>
										<Button
											type="text"
											danger
											size="small"
											onClick={handleRemoveVoucher}
										>
											Remove
										</Button>
									</div>
								</Form.Item>
							) : (
								<>
									{/* Available Vouchers List */}
									{availableVouchers.length > 0 && (
										<div style={{ marginBottom: '16px' }}>
											<Text
												strong
												style={{ marginBottom: '12px', display: 'block' }}
											>
												Available Vouchers:
											</Text>
											<div style={{ maxHeight: '200px', overflowY: 'auto' }}>
												{availableVouchers.map((voucher) => (
													<div
														key={voucher.userVoucherStatusId}
														style={{
															padding: '12px',
															border: '1px solid #d9d9d9',
															borderRadius: '6px',
															marginBottom: '8px',
															cursor: voucher.canUse
																? 'pointer'
																: 'not-allowed',
															background: voucher.canUse ? '#fff' : '#f5f5f5',
															opacity: voucher.canUse ? 1 : 0.6,
															transition: 'all 0.3s ease',
														}}
														onClick={() =>
															voucher.canUse && handleSelectVoucher(voucher)
														}
														onMouseEnter={(e) => {
															if (voucher.canUse) {
																e.currentTarget.style.borderColor = '#1890ff';
																e.currentTarget.style.background = '#f0f8ff';
															}
														}}
														onMouseLeave={(e) => {
															if (voucher.canUse) {
																e.currentTarget.style.borderColor = '#d9d9d9';
																e.currentTarget.style.background = '#fff';
															}
														}}
													>
														<div
															style={{
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
															}}
														>
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: '8px',
																	}}
																>
																	<Text
																		strong
																		style={{
																			color: voucher.canUse
																				? '#1890ff'
																				: '#999',
																		}}
																	>
																		{voucher.voucherCode}
																	</Text>
																	<span
																		style={{
																			background: voucher.canUse
																				? '#52c41a'
																				: '#999',
																			color: 'white',
																			padding: '2px 8px',
																			borderRadius: '12px',
																			fontSize: '12px',
																			fontWeight: 'bold',
																		}}
																	>
																		-{voucher.discount}%
																	</span>
																</div>
																<div
																	style={{
																		fontSize: '12px',
																		color: '#666',
																		marginTop: '4px',
																	}}
																>
																	{voucher.description}
																</div>
																<div
																	style={{
																		fontSize: '11px',
																		color: '#999',
																		marginTop: '2px',
																	}}
																>
																	Valid until:{' '}
																	{new Date(voucher.endDate).toLocaleDateString(
																		'vi-VN',
																	)}
																	{voucher.usageLimit &&
																		voucher.usageCount !== undefined && (
																			<span style={{ marginLeft: '8px' }}>
																				• Used: {voucher.usageCount}/
																				{voucher.usageLimit}
																			</span>
																		)}
																</div>
															</div>
															{voucher.canUse && (
																<Button
																	type="primary"
																	size="small"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleSelectVoucher(voucher);
																	}}
																>
																	Select
																</Button>
															)}
														</div>
														{!voucher.canUse && (
															<div
																style={{
																	fontSize: '11px',
																	color: '#ff4d4f',
																	marginTop: '4px',
																}}
															>
																{voucher.isExpired
																	? 'Expired'
																	: voucher.usageCount !== undefined &&
																		  voucher.usageLimit !== undefined &&
																		  voucher.usageCount >= voucher.usageLimit
																		? 'Usage limit reached'
																		: 'Not available'}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Manual Voucher Input */}
									<Form.Item
										name="voucherCode"
										label="Or enter voucher code manually"
									>
										<Input.Group compact>
											<Form.Item
												name="voucherCode"
												noStyle
												getValueFromEvent={(e) => e.target.value}
											>
												<Input
													style={{ width: 'calc(100% - 100px)' }}
													placeholder="Enter voucher code"
												/>
											</Form.Item>
											<Button
												type="primary"
												loading={applyingVoucher}
												onClick={handleApplyVoucher}
											>
												Apply
											</Button>
										</Input.Group>
									</Form.Item>
								</>
							)}
						</Card>
					</Form>
				</Col>

				<Col xs={24} lg={8}>
					{/* Order Summary */}
					<Card
						title={isBuyNow ? 'Purchase Summary' : 'Order Summary'}
						style={{ position: 'sticky', top: '100px' }}
					>
						<Table
							columns={orderSummaryColumns}
							dataSource={cartItems}
							rowKey="id"
							pagination={false}
							showHeader={false}
							size="small"
						/>

						<Divider />

						<Space direction="vertical" size="small" style={{ width: '100%' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<Text>Subtotal:</Text>
								<Text>{subtotal.toLocaleString('vi-VN')} ₫</Text>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<Text>Shipping:</Text>
								<Text>{shippingFee.toLocaleString('vi-VN')} ₫</Text>
							</div>
							{voucherData && (
								<div
									style={{ display: 'flex', justifyContent: 'space-between' }}
								>
									<Text>Discount:</Text>
									<Text style={{ color: '#52c41a' }}>
										-{voucherDiscountAmount.toLocaleString('vi-VN')} ₫
									</Text>
								</div>
							)}
							<Divider style={{ margin: '12px 0' }} />
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<Text strong style={{ fontSize: '16px' }}>
									Total:
								</Text>
								<Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
									{total.toLocaleString('vi-VN')} ₫
								</Text>
							</div>
						</Space>

						<Button
							type="primary"
							size="large"
							loading={submitting}
							onClick={() => form.submit()}
							style={{ width: '100%', marginTop: '24px', height: '48px' }}
						>
							Place Order
						</Button>
					</Card>
				</Col>
			</Row>

			{/* New Address Modal */}
			<Modal
				title="Add New Address"
				open={newAddressModalVisible}
				onCancel={() => {
					setNewAddressModalVisible(false);
					newAddressForm.resetFields();
				}}
				footer={null}
			>
				<Form
					form={newAddressForm}
					layout="vertical"
					onFinish={handleCreateAddress}
				>
					<Form.Item
						name="description"
						label="Address"
						rules={[
							{ required: true, message: 'Please enter the address' },
							{ min: 10, message: 'Address must be at least 10 characters' },
						]}
					>
						<TextArea
							rows={3}
							placeholder="Enter full address (street, district, city, province)"
						/>
					</Form.Item>

					<div
						style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}
					>
						<Button
							onClick={() => {
								setNewAddressModalVisible(false);
								newAddressForm.resetFields();
							}}
						>
							Cancel
						</Button>
						<Button type="primary" htmlType="submit">
							Add Address
						</Button>
					</div>
				</Form>
			</Modal>

			{/* Delete Address Confirmation Modal */}
			<Modal
				title="Delete Address"
				open={deleteAddressModalVisible}
				onCancel={() => {
					setDeleteAddressModalVisible(false);
					setSelectedAddressToDelete(null);
				}}
				footer={null}
			>
				{selectedAddressToDelete && (
					<div>
						<p>Are you sure you want to delete this address?</p>
						<div
							style={{
								background: '#f5f5f5',
								padding: '12px',
								borderRadius: '6px',
								margin: '16px 0',
							}}
						>
							<Text strong>{selectedAddressToDelete.userFullName}</Text>
							<div style={{ color: '#666', fontSize: '14px' }}>
								{selectedAddressToDelete.description}
							</div>
						</div>
						<p style={{ color: '#ff4d4f', fontSize: '14px' }}>
							This action cannot be undone.
						</p>
						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '12px',
								marginTop: '24px',
							}}
						>
							<Button
								onClick={() => {
									setDeleteAddressModalVisible(false);
									setSelectedAddressToDelete(null);
								}}
							>
								Cancel
							</Button>
							<Button
								type="primary"
								danger
								loading={deletingAddress}
								onClick={handleDeleteAddress}
							>
								Delete Address
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};

