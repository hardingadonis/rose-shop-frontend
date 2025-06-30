import { cartService } from '../services/cartService';
import type { CartItem, CartResponse, CartSummary } from '../types';
import {
	ClearOutlined,
	DeleteOutlined,
	MinusOutlined,
	PlusOutlined,
	ShoppingOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Button,
	Card,
	Col,
	Divider,
	Empty,
	Image,
	InputNumber,
	Popconfirm,
	Row,
	Space,
	Spin,
	Table,
	Typography,
	message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const Cart: React.FC = () => {
	const [cartData, setCartData] = useState<CartResponse>({
		items: [],
		summary: {
			grandTotal: 0,
			totalItems: 0,
			totalTypes: 0,
			totalQuantity: 0,
			subtotal: 0,
			total: 0,
			tax: 0,
			discount: 0,
			shipping: 0,
		},
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updating, setUpdating] = useState<string | null>(null);

	useEffect(() => {
		fetchCartData();
	}, []);

	const fetchCartData = async () => {
		try {
			setLoading(true);
			const data = await cartService.getMyCart();
			setCartData(data);
			setError(null);
		} catch (err) {
			setError('Failed to load cart. Please try again.');
			console.error('Error fetching cart:', err);
			setCartData({
				items: [],
				summary: {
					grandTotal: 0,
					totalItems: 0,
					totalTypes: 0,
					totalQuantity: 0,
					subtotal: 0,
					total: 0,
					tax: 0,
					discount: 0,
					shipping: 0,
				},
			});
		} finally {
			setLoading(false);
		}
	};

	const handleQuantityChange = async (cartId: string, quantity: number) => {
		if (quantity < 1) return;

		setUpdating(cartId);
		try {
			await cartService.updateCartItem(cartId, quantity);
			await fetchCartData(); // Refresh cart data
			message.success('Cart updated successfully');
		} catch (err) {
			message.error('Failed to update cart item');
			console.error('Error updating cart item:', err);
		} finally {
			setUpdating(null);
		}
	};

	const handleRemoveItem = async (cartId: string) => {
		setUpdating(cartId);
		try {
			await cartService.removeFromCart(cartId);
			await fetchCartData(); // Refresh cart data
			message.success('Item removed from cart');
		} catch (err) {
			message.error('Failed to remove item from cart');
			console.error('Error removing cart item:', err);
		} finally {
			setUpdating(null);
		}
	};

	const handleClearCart = async () => {
		setLoading(true);
		try {
			await cartService.clearCart();
			await fetchCartData(); // Refresh cart data
			message.success('Cart cleared successfully');
		} catch (err) {
			message.error('Failed to clear cart');
			console.error('Error clearing cart:', err);
		} finally {
			setLoading(false);
		}
	};

	const columns: ColumnsType<CartItem> = [
		{
			title: 'Product',
			key: 'product',
			render: (_, record) => (
				<Space>
					<Image
						width={60}
						height={60}
						src={record.imageUrl || '/images/placeholder.jpg'}
						alt={record.flowerName || 'Product'}
						style={{ objectFit: 'cover', borderRadius: 4 }}
						fallback="/images/placeholder.jpg"
					/>
					<div>
						<Text strong>{record.flowerName || 'Unknown Product'}</Text>
						<br />
						<Text type="secondary">{record.flowerDescription || ''}</Text>
						<br />
						<Text type="secondary" style={{ fontSize: '12px' }}>
							{record.categoryName}
						</Text>
					</div>
				</Space>
			),
		},
		{
			title: 'Price',
			key: 'price',
			render: (_, record) => (
				<Text strong>{(record.unitPrice || 0).toLocaleString('vi-VN')} ₫</Text>
			),
		},
		{
			title: 'Quantity',
			key: 'quantity',
			render: (_, record) => (
				<Space.Compact style={{ display: 'flex', alignItems: 'center' }}>
					<Button
						icon={<MinusOutlined />}
						size="small"
						onClick={() =>
							handleQuantityChange(String(record.cartId), record.quantity - 1)
						}
						disabled={
							record.quantity <= 1 || updating === String(record.cartId)
						}
						style={{ height: '32px', minWidth: '32px' }}
					/>
					<InputNumber
						min={1}
						max={99}
						value={record.quantity}
						onChange={(value) =>
							value && handleQuantityChange(String(record.cartId), value)
						}
						disabled={updating === String(record.cartId)}
						style={{ width: 60, textAlign: 'center', height: '32px' }}
						controls={false}
					/>
					<Button
						icon={<PlusOutlined />}
						size="small"
						onClick={() =>
							handleQuantityChange(String(record.cartId), record.quantity + 1)
						}
						disabled={updating === String(record.cartId)}
						style={{ height: '32px', minWidth: '32px' }}
					/>
				</Space.Compact>
			),
		},
		{
			title: 'Subtotal',
			key: 'subtotal',
			render: (_, record) => {
				return (
					<Text strong>{record.totalPrice.toLocaleString('vi-VN')} ₫</Text>
				);
			},
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Popconfirm
					title="Remove Item"
					description="Are you sure you want to remove this item from your cart?"
					onConfirm={() => handleRemoveItem(String(record.cartId))}
					okText="Yes"
					cancelText="No"
				>
					<Button
						danger
						icon={<DeleteOutlined />}
						loading={updating === String(record.cartId)}
						size="small"
					>
						Remove
					</Button>
				</Popconfirm>
			),
		},
	];

	const CartSummaryCard: React.FC<{ summary: CartSummary }> = ({ summary }) => {
		// Calculate totals from cart items if summary doesn't have proper values
		const calculateTotals = () => {
			if (!Array.isArray(cartData.items) || cartData.items.length === 0) {
				return {
					totalQuantity: 0,
					subtotal: 0,
					tax: 0,
					discount: 0,
					shipping: 0,
					total: 0,
				};
			}

			const totalQuantity = cartData.items.reduce(
				(sum, item) => sum + item.quantity,
				0,
			);
			const subtotal = cartData.items.reduce((sum, item) => {
				return sum + item.totalPrice;
			}, 0);

			const tax = 0; // No tax from API
			const discount = 0; // No discount from API
			const shipping = 0; // No shipping from API
			const total = summary?.grandTotal || subtotal;

			return {
				totalQuantity,
				subtotal,
				tax,
				discount,
				shipping,
				total,
			};
		};

		const totals = calculateTotals();

		return (
			<Card
				title="Order Summary"
				style={{ marginTop: 0, height: 'fit-content' }}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<Text>Items ({totals.totalQuantity}):</Text>
						<Text>{totals.subtotal.toLocaleString('vi-VN')} ₫</Text>
					</div>

					{totals.discount > 0 && (
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<Text>Discount:</Text>
							<Text type="success">
								-{totals.discount.toLocaleString('vi-VN')} ₫
							</Text>
						</div>
					)}

					{totals.tax > 0 && (
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<Text>Tax:</Text>
							<Text>{totals.tax.toLocaleString('vi-VN')} ₫</Text>
						</div>
					)}

					{totals.shipping > 0 && (
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<Text>Shipping:</Text>
							<Text>{totals.shipping.toLocaleString('vi-VN')} ₫</Text>
						</div>
					)}

					<Divider style={{ margin: '12px 0' }} />

					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<Text strong style={{ fontSize: '16px' }}>
							Total:
						</Text>
						<Text strong style={{ fontSize: '16px' }} type="success">
							{totals.total.toLocaleString('vi-VN')} ₫
						</Text>
					</div>

					<Button
						type="primary"
						size="large"
						block
						style={{ marginTop: 16 }}
						disabled={cartData.items.length === 0}
					>
						Proceed to Checkout
					</Button>
				</Space>
			</Card>
		);
	};

	if (loading) {
		return (
			<div style={{ textAlign: 'center', padding: '50px 0' }}>
				<Spin size="large" />
				<div style={{ marginTop: 16 }}>
					<Text>Loading your cart...</Text>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: '20px 0' }}>
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
					action={
						<Button size="small" onClick={fetchCartData}>
							Retry
						</Button>
					}
				/>
			</div>
		);
	}

	if (!Array.isArray(cartData.items) || cartData.items.length === 0) {
		return (
			<div style={{ textAlign: 'center', padding: '50px 0' }}>
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description={
						<span>
							Your cart is empty
							<br />
							<Text type="secondary">
								Start shopping to add items to your cart
							</Text>
						</span>
					}
				>
					<Link to="/flowers">
						<Button type="primary" icon={<ShoppingOutlined />}>
							Start Shopping
						</Button>
					</Link>
				</Empty>
			</div>
		);
	}

	return (
		<div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
			<div style={{ marginBottom: 24 }}>
				<Title level={2}>
					<ShoppingOutlined /> Shopping Cart
				</Title>
				<Text type="secondary">
					You have{' '}
					{cartData.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
					in your cart
				</Text>
			</div>

			<Row gutter={24} style={{ alignItems: 'flex-start' }}>
				<Col xs={24} lg={16}>
					<Card
						title={
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<span>Cart Items</span>
								{cartData.items.length > 0 && (
									<Popconfirm
										title="Clear Cart"
										description="Are you sure you want to remove all items from your cart?"
										onConfirm={handleClearCart}
										okText="Yes"
										cancelText="No"
									>
										<Button danger icon={<ClearOutlined />} size="small">
											Clear Cart
										</Button>
									</Popconfirm>
								)}
							</div>
						}
						style={{ height: 'fit-content' }}
					>
						<Table
							columns={columns}
							dataSource={cartData.items}
							rowKey="cartId"
							pagination={false}
							loading={loading}
							scroll={{ x: 800 }}
						/>
					</Card>
				</Col>

				<Col xs={24} lg={8}>
					<CartSummaryCard summary={cartData.summary} />
				</Col>
			</Row>
		</div>
	);
};
