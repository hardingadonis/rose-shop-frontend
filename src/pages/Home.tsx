import { FlowerCard } from '../components/FlowerCard';
import { COLORS } from '../constants/colors';
import { useCart } from '../hooks/useCart';
import { cartService } from '../services/cartService';
import { categoryService } from '../services/categoryService';
import { flowerService } from '../services/flowerService';
import { useUserNotification } from '../services/userNotification';
import type { Category, Flower } from '../types';
import {
	ArrowRightOutlined,
	SafetyCertificateOutlined,
	ShoppingOutlined,
	StarOutlined,
	TruckOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Button,
	Card,
	Carousel,
	Col,
	Row,
	Spin,
	Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const features = [
	{
		icon: <TruckOutlined style={{ fontSize: 48, color: COLORS.primary }} />,
		title: 'Fast Delivery',
		description:
			'Extremely fast shipping times and available across all cities and provinces nationwide.',
	},
	{
		icon: (
			<SafetyCertificateOutlined
				style={{ fontSize: 48, color: COLORS.primary }}
			/>
		),
		title: 'Free Shipping',
		description: 'Free shipping for first-time buyers and V.I.P. members.',
	},
	{
		icon: <StarOutlined style={{ fontSize: 48, color: COLORS.primary }} />,
		title: 'High Quality',
		description:
			'Safe quality, no additives, suitable for newborns and pregnant women.',
	},
];

export const Home: React.FC = () => {
	const notification = useUserNotification();
	const { refreshCart } = useCart();
	const [topCategories, setTopCategories] = useState<Category[]>([]);
	const [featuredFlowers, setFeaturedFlowers] = useState<Flower[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch top popular categories
				const categoriesResponse =
					await categoryService.getTopPopularCategories();
				setTopCategories(categoriesResponse || []);

				// Fetch featured flowers (first 9 flowers from shop)
				const flowersResponse = await flowerService.getFlowers();
				setFeaturedFlowers(flowersResponse.slice(0, 9) || []);
			} catch (err) {
				setError('Failed to load data. Please try again later.');
				console.error('Error fetching home data:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleAddToCart = async (flowerId: string) => {
		try {
			await cartService.addToCart(flowerId, 1);
			// Refresh cart context after adding item
			await refreshCart();
			notification.addToCartSuccess();
		} catch (err) {
			console.error('Error adding to cart:', err);
			notification.actionFailed('Add to Cart');
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4">
				<Alert message="Error" description={error} type="error" showIcon />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Hero Carousel */}
			<section className="relative">
				<div className="w-full max-w-[100vw] overflow-hidden">
					{' '}
					<Carousel
						autoplay
						autoplaySpeed={3500}
						effect="fade"
						className="w-full h-[60vh]"
					>
						<div className="w-full h-full relative">
							{' '}
							<div
								className="h-[60vh] bg-cover bg-center relative"
								style={{
									backgroundImage: 'url(/images/image/camtucaujpg.jpg)',
								}}
							>
								<div className="absolute inset-0 bg-opacity-100 flex items-center justify-center">
									<div className="text-white text-center p-16 bg-gray-800/60">
										<h1 className="text-white !mb-4 text-4xl font-bold">
											Beautiful Flowers for Every Occasion
										</h1>
										<h6 className="text-lg mb-6 block">
											Discover our stunning collection of fresh flowers
										</h6>
										<Link to="/flowers">
											<Button
												type="primary"
												size="large"
												icon={<ShoppingOutlined />}
											>
												Shop Now
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</div>
						<div className="w-full h-full relative">
							{' '}
							<div
								className="h-[60vh] bg-cover bg-center relative"
								style={{
									backgroundImage: 'url(/images/image/hoatim.jpg)',
								}}
							>
								<div className="absolute inset-0 bg-opacity-20 flex items-center justify-center">
									<div className="text-white text-center p-16 bg-gray-800/60">
										<h1 className="text-white !mb-4 text-4xl font-bold">
											Wedding Flowers
										</h1>
										<h6 className="text-lg mb-6 block">
											Make your special day even more beautiful
										</h6>
										<Link to="/flowers?category=wedding">
											<Button
												type="primary"
												size="large"
												icon={<ShoppingOutlined />}
											>
												Explore Wedding Collection
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</div>
						<div className="w-full h-full relative">
							<div
								className="h-[60vh] bg-cover bg-center relative"
								style={{
									backgroundImage: 'url(/images/picture/2.jpg)',
								}}
							>
								<div className="absolute inset-0 bg-opacity-30 flex items-center justify-center">
									<div className="text-white text-center p-16 bg-gray-800/60">
										<h1 className="text-white !mb-4 text-4xl font-bold">
											Premium Quality
										</h1>
										<h6 className="text-lg mb-6 block">
											Handpicked flowers with guaranteed freshness
										</h6>
										<Link to="/flowers">
											<Button
												type="primary"
												size="large"
												icon={<ShoppingOutlined />}
											>
												Browse Collection
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</Carousel>
				</div>
			</section>

			{/* Top Popular Categories Section */}
			<section className="py-12 px-4">
				<div className="max-w-7xl mx-auto">
					<Title level={2} className="text-center mb-8 font-bold text-3xl">
						Popular Flower Categories
					</Title>
					{loading ? (
						<div className="flex justify-center items-center min-h-64">
							<Spin size="large" />
						</div>
					) : (
						<Row gutter={[24, 24]} justify="center">
							{topCategories.map((category) => (
								<Col key={category.categoryId} xs={12} sm={12} md={8} lg={6}>
									<Card
										className="rounded-xl hover:shadow-xl transition-all duration-300 h-full border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100"
										styles={{
											body: {
												padding: '24px',
												textAlign: 'center',
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												minHeight: '160px',
											},
										}}
									>
										<div className="text-4xl mb-3 text-rose-400">🌸</div>
										<Title
											level={4}
											className="text-center font-bold mb-2 text-gray-800"
										>
											{category.categoryName}
										</Title>
										<Text className="text-center text-gray-600 block mb-4 text-sm">
											{category.flowerCount} floral creations
										</Text>
										<Link to={`/flowers?category=${category.categoryId}`}>
											<Button
												type="primary"
												className="border-none rounded-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
												size="middle"
											>
												Explore Flowers
											</Button>
										</Link>
									</Card>
								</Col>
							))}
						</Row>
					)}
				</div>
			</section>

			{/* Featured Flowers */}
			<section className="py-8">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center mb-12">
						<Title level={2}>Top Floral Creations</Title>
					</div>

					{loading ? (
						<div className="flex justify-center items-center min-h-64">
							<Spin size="large" />
						</div>
					) : (
						<>
							<Row gutter={[24, 24]}>
								{featuredFlowers.map((flower) => (
									<Col xs={24} sm={12} md={8} lg={8} key={flower.flowerId}>
										<FlowerCard flower={flower} onAddToCart={handleAddToCart} />
									</Col>
								))}
							</Row>

							<div className="text-center mt-8">
								<Link to="/flowers">
									<Button
										type="primary"
										size="large"
										icon={<ArrowRightOutlined />}
									>
										View All Flowers
									</Button>
								</Link>
							</div>
						</>
					)}
				</div>
			</section>

			{/* About Section */}
			<section className="py-12 px-4 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					<Row align="middle" gutter={[32, 24]}>
						<Col xs={24} md={12}>
							<img
								src="/images/picture/xe.jpg"
								alt="About us"
								className="rounded-lg w-full h-auto object-cover"
							/>
						</Col>
						<Col xs={24} md={12}>
							<Title level={4} className="mb-2 font-bold">
								ROSE SHOP
							</Title>

							<Paragraph className="text-sm mb-4">
								Welcome to Rose Shop – where every bouquet tells a story. We are
								a trusted local florist offering premium floral arrangements and
								curated gift hampers, with same-day delivery available across
								the city. With years of experience in floral design, our team is
								dedicated to crafting elegant, fresh, and thoughtful creations
								that leave lasting impressions. For business clients, our
								Corporate & Event Floral Services bring style and freshness to
								offices, hotels, and events of all sizes. Whether it’s for a
								celebration, a heartfelt gesture, or an everyday touch of beauty
								– Rose Shop is here to help you express it perfectly, with
								flowers that speak from the heart.
							</Paragraph>
							<Button type="primary" className="mt-4 border-none">
								Learn More
							</Button>
						</Col>
					</Row>
				</div>
			</section>

			{/* Why Choose Us Section */}
			<section className="py-16">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center mb-12">
						<Title level={2} className="font-bold">
							Why Choose Our Products
						</Title>
					</div>
					<Row gutter={[32, 24]}>
						{features.map((feature, index) => (
							<Col xs={24} sm={24} md={8} key={index}>
								{' '}
								<Card
									className="text-center h-full hover:shadow-md transition-shadow border rounded-lg"
									styles={{
										body: {
											padding: '24px',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
										},
									}}
								>
									<div className="mb-4">{feature.icon}</div>
									<Title level={5} className="mb-2 font-semibold">
										{feature.title}
									</Title>
									<Paragraph className="text-center">
										{feature.description}
									</Paragraph>
								</Card>
							</Col>
						))}
					</Row>
				</div>
			</section>
		</div>
	);
};

