import { FlowerCard } from '../components/FlowerCard';
import { useCart } from '../hooks/useCart';
import { cartService } from '../services/cartService';
import { flowerService } from '../services/flowerService';
import { useUserNotification } from '../services/userNotification';
import type { Flower } from '../types';
import {
	HeartOutlined,
	HomeOutlined,
	MinusOutlined,
	PlusOutlined,
	ShareAltOutlined,
	ShoppingCartOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Breadcrumb,
	Button,
	Card,
	Col,
	Divider,
	InputNumber,
	Row,
	Space,
	Spin,
	Tag,
	Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const FlowerDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const notification = useUserNotification();
	const { refreshCart } = useCart();
	const [flower, setFlower] = useState<Flower | null>(null);
	const [suggestedFlowers, setSuggestedFlowers] = useState<Flower[]>([]);
	const [loading, setLoading] = useState(true);
	const [suggestedLoading, setSuggestedLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [addingToCart, setAddingToCart] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);

	useEffect(() => {
		const fetchFlower = async () => {
			if (!id) return;

			try {
				const flowerData = await flowerService.getFlowerById(Number(id));
				setFlower(flowerData);

				// Fetch suggested flowers after getting the main flower
				setSuggestedLoading(true);
				try {
					const allFlowers = await flowerService.getFlowers();
					// Filter out current flower and get random 4 flowers
					const filteredFlowers = allFlowers.filter(
						(f) => f.flowerId !== flowerData.flowerId && f.status === 'active',
					);
					const shuffled = filteredFlowers.sort(() => 0.5 - Math.random());
					setSuggestedFlowers(shuffled.slice(0, 4));
				} catch (suggestedError) {
					console.error('Error fetching suggested flowers:', suggestedError);
				} finally {
					setSuggestedLoading(false);
				}
			} catch (err) {
				setError('Failed to load flower details. Please try again.');
				console.error('Error fetching flower:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchFlower();
	}, [id]);

	const handleAddToCart = async () => {
		if (!flower) return;

		setAddingToCart(true);
		try {
			await cartService.addToCart(flower.flowerId?.toString() || '', quantity);
			// Refresh cart context after adding item
			await refreshCart();
			notification.addToCartSuccess(flower.flowerName);
		} catch (err) {
			console.error('Error adding to cart:', err);
			notification.actionFailed(
				'Add to cart',
				'Failed to add to cart. Please try again.',
			);
		} finally {
			setAddingToCart(false);
		}
	};

	const handleAddToFavorites = () => {
		setIsFavorite(!isFavorite);
		notification.success(
			isFavorite ? 'Removed from favorites' : 'Added to favorites',
		);
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: flower?.flowerName,
				text: flower?.flowerDescription,
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			notification.success('Link copied to clipboard!');
		}
	};

	const handleSuggestedAddToCart = async (flowerId: string) => {
		try {
			await cartService.addToCart(flowerId, 1);
			// Refresh cart context after adding item
			await refreshCart();
			notification.addToCartSuccess();
		} catch (err) {
			console.error('Error adding to cart:', err);
			notification.actionFailed(
				'Add to cart',
				'Failed to add to cart. Please try again.',
			);
		}
	};

	const handleIncrement = () => {
		setQuantity((prev) => prev + 1);
	};

	const handleDecrement = () => {
		setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
	};

	if (loading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '400px',
					padding: '24px',
				}}
			>
				<Spin size="large" />
			</div>
		);
	}

	if (error || !flower) {
		return (
			<div style={{ padding: '16px' }}>
				<Alert
					message="Error"
					description={error || 'Flower not found'}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	const isAvailable =
		flower.status === 'active' && flower.availableQuantity > 0;

	return (
		<div
			style={{
				minHeight: '100vh',
				backgroundColor: '#f5f5f5',
				padding: '24px 0',
			}}
		>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
				<Breadcrumb
					style={{
						marginTop: '32px',
						padding: '20px 0px',
						fontSize: '16px',
					}}
					items={[
						{
							title: (
								<Link to="/" style={{ color: '#1890ff', fontSize: '16px' }}>
									<HomeOutlined />
								</Link>
							),
						},
						{
							title: (
								<Link
									to="/flowers"
									style={{ color: '#1890ff', fontSize: '16px' }}
								>
									Flowers
								</Link>
							),
						},
						{
							title: (
								<Link
									to={`/flowers?category=${flower.categoryId || ''}`}
									style={{ color: '#1890ff', fontSize: '16px' }}
								>
									{flower.categoryName || 'Category'}
								</Link>
							),
						},
						{
							title: (
								<Link
									to={`/flowers/${flower.flowerId}`}
									style={{
										color: '#1890ff',
										fontSize: '16px',
										fontWeight: 'bold',
									}}
								>
									{flower.flowerName}
								</Link>
							),
						},
					]}
				/>

				<Row gutter={[32, 32]} style={{ marginBottom: '64px' }}>
					{/* Image Section */}
					<Col xs={24} lg={12}>
						<Card
							cover={
								<div
									style={{
										position: 'relative',
										height: '500px',
										overflow: 'hidden',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<img
										src={flower.imageUrl}
										style={{
											width: '100%',
											height: 'auto',
											objectFit: 'cover',
											objectPosition: 'center',
										}}
									/>
									{!isAvailable && (
										<div
											style={{
												position: 'absolute',
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
												backgroundColor: 'rgba(0,0,0,0.5)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<div
												style={{
													backgroundColor: '#ff4d4f',
													color: 'white',
													padding: '12px 24px',
													borderRadius: '8px',
													fontWeight: 'bold',
												}}
											>
												Out of Stock
											</div>
										</div>
									)}
								</div>
							}
							style={{ height: '100%' }}
						/>
					</Col>

					{/* Details Section */}
					<Col xs={24} lg={12}>
						<Card style={{ height: '100%' }}>
							<Space
								direction="vertical"
								size="large"
								style={{ width: '100%' }}
							>
								{/* Header Section */}
								<div>
									<Title level={2} style={{ marginBottom: '8px' }}>
										{flower.flowerName}
									</Title>

									{/* Price and Actions */}
									<div style={{ marginBottom: '16px' }}>
										<Title level={3} type="success" style={{ margin: 0 }}>
											{flower.price.toLocaleString('vi-VN')} ₫
										</Title>
									</div>

									{/* Tags for Category and Status */}
									<Space size="small" style={{ marginBottom: '16px' }}>
										<Tag
											color="blue"
											style={{ fontSize: '14px', padding: '4px 8px' }}
										>
											{flower.categoryName || 'N/A'}
										</Tag>
										<Tag
											color={flower.status === 'active' ? 'green' : 'red'}
											style={{ fontSize: '14px', padding: '4px 8px' }}
										>
											{flower.status === 'active' ? 'Available' : 'Unavailable'}
										</Tag>
										<Tag
											color={flower.availableQuantity > 0 ? 'cyan' : 'volcano'}
											style={{ fontSize: '14px', padding: '4px 8px' }}
										>
											{flower.availableQuantity > 0
												? `${flower.availableQuantity} in stock`
												: 'Out of stock'}
										</Tag>
									</Space>

									{/* Action Buttons - Heart and Share */}
									<Space style={{ marginBottom: '16px' }}>
										<Button
											icon={<HeartOutlined />}
											type={isFavorite ? 'primary' : 'default'}
											shape="circle"
											size="large"
											onClick={handleAddToFavorites}
										/>
										<Button
											icon={<ShareAltOutlined />}
											type="default"
											shape="circle"
											size="large"
											onClick={handleShare}
										/>
									</Space>

									{/* Description */}
									<Paragraph
										style={{
											fontSize: '16px',
											lineHeight: '1.6',
											marginBottom: '24px',
											color: '#666',
										}}
									>
										{flower.flowerDescription}
									</Paragraph>
								</div>

								<Divider style={{ margin: '16px 0' }} />

								{/* Quantity Selector */}
								<div>
									<Text
										strong
										style={{
											fontSize: '16px',
											display: 'block',
											marginBottom: '12px',
										}}
									>
										Select Quantity:
									</Text>
									<Space size="middle" style={{ marginBottom: '24px' }}>
										<Button
											icon={<MinusOutlined />}
											onClick={handleDecrement}
											disabled={!isAvailable}
											size="large"
										/>
										<InputNumber
											min={1}
											max={flower.availableQuantity}
											value={quantity}
											onChange={(value) => setQuantity(Number(value) || 1)}
											controls={false}
											style={{ width: '80px' }}
											size="large"
											disabled={!isAvailable}
										/>
										<Button
											icon={<PlusOutlined />}
											onClick={handleIncrement}
											disabled={
												!isAvailable || quantity >= flower.availableQuantity
											}
											size="large"
										/>
									</Space>
								</div>

								{/* Action Buttons */}
								<Space
									direction="vertical"
									size="middle"
									style={{ width: '100%' }}
								>
									<Row gutter={16}>
										{/* <Col span={12}> */}
										<Button
											type="primary"
											size="large"
											icon={<ShoppingCartOutlined />}
											onClick={handleAddToCart}
											loading={addingToCart}
											disabled={!isAvailable}
											style={{
												width: '100%',
												height: '48px',
												fontSize: '16px',
											}}
										>
											Add to Cart
										</Button>
										{/* </Col> */}
										{/* <Col span={12}>
											<Button
												type="primary"
												size="large"
												icon={<DollarOutlined />}
												disabled={!isAvailable}
												style={{
													width: '100%',
													height: '48px',
													fontSize: '16px',
													backgroundColor: '#52c41a',
													borderColor: '#52c41a',
												}}
											>
												Buy Now
											</Button>
										</Col> */}
									</Row>
								</Space>
							</Space>
						</Card>
					</Col>
				</Row>

				{/* Suggested Flowers Section */}
				<Card style={{ marginTop: '64px' }}>
					<div style={{ textAlign: 'center', marginBottom: '32px' }}>
						<Title level={2} style={{ marginBottom: '8px' }}>
							You might also like
						</Title>
						<Text type="secondary" style={{ fontSize: '16px' }}>
							Discover more beautiful flowers from our collection
						</Text>
					</div>

					{suggestedLoading ? (
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								minHeight: '256px',
							}}
						>
							<Spin size="large" />
						</div>
					) : (
						<Row gutter={[24, 24]}>
							{suggestedFlowers.map((suggestedFlower) => (
								<Col xs={24} sm={12} md={6} key={suggestedFlower.flowerId}>
									<FlowerCard
										flower={suggestedFlower}
										onAddToCart={handleSuggestedAddToCart}
									/>
								</Col>
							))}
						</Row>
					)}
				</Card>
			</div>
		</div>
	);
};

