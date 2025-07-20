import { FlowerCard } from '../components/FlowerCard';
import { useCart } from '../hooks/useCart';
import apiClient from '../services/api';
import { cartService } from '../services/cartService';
import { flowerService } from '../services/flowerService';
import { useUserNotification } from '../services/userNotification';
import type { Category, Flower } from '../types';
import { SearchOutlined } from '@ant-design/icons';
import {
	Alert,
	Card,
	Col,
	Input,
	Pagination,
	Row,
	Select,
	Space,
	Spin,
	Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export const FlowerList: React.FC = () => {
	const notification = useUserNotification();
	const { refreshCart } = useCart();
	const [flowers, setFlowers] = useState<Flower[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize] = useState(12);
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchInput, setSearchInput] = useState('');

	const searchQuery = searchParams.get('search') || '';
	const categoryFilter = searchParams.get('category') || '';

	// Sync search input with URL params
	useEffect(() => {
		setSearchInput(searchQuery);
	}, [searchQuery]);
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await apiClient.get('/categories');
				setCategories(response.data.data || []);
			} catch (err) {
				console.error('Error fetching categories:', err);
			}
		};

		fetchCategories();
	}, []);
	useEffect(() => {
		const fetchFlowers = async () => {
			setLoading(true);
			try {
				const flowerData = await flowerService.getFlowers();

				// Apply client-side filtering based on search and category
				let filteredFlowers = flowerData || [];

				// Filter by search query
				if (searchQuery) {
					filteredFlowers = filteredFlowers.filter(
						(flower) =>
							flower.flowerName
								.toLowerCase()
								.includes(searchQuery.toLowerCase()) ||
							flower.flowerDescription
								.toLowerCase()
								.includes(searchQuery.toLowerCase()) ||
							flower.categoryName
								?.toLowerCase()
								.includes(searchQuery.toLowerCase()),
					);
				}

				// Filter by category
				if (categoryFilter) {
					filteredFlowers = filteredFlowers.filter(
						(flower) => flower.categoryId === parseInt(categoryFilter),
					);
				}

				// Apply pagination
				const startIndex = (currentPage - 1) * pageSize;
				const endIndex = startIndex + pageSize;
				const paginatedFlowers = filteredFlowers.slice(startIndex, endIndex);

				setFlowers(paginatedFlowers);
				setTotal(filteredFlowers.length);
			} catch (err) {
				setError('Failed to load flowers. Please try again.');
				setFlowers([]);
				setTotal(0);
				console.error('Error fetching flowers:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchFlowers();
	}, [currentPage, searchQuery, categoryFilter, pageSize]);

	const handleSearch = (value: string) => {
		const newParams = new URLSearchParams(searchParams);
		if (value.trim()) {
			newParams.set('search', value.trim());
		} else {
			newParams.delete('search');
		}
		setSearchParams(newParams);
		setCurrentPage(1);
		setSearchInput(value);
	};

	const handleCategoryFilter = (value: string) => {
		const newParams = new URLSearchParams(searchParams);
		if (value) {
			newParams.set('category', value);
		} else {
			newParams.delete('category');
		}
		setSearchParams(newParams);
		setCurrentPage(1);
	};

	// Get category name from ID for display
	const getCategoryDisplayValue = () => {
		if (!categoryFilter) return undefined;
		const category = categories.find(
			(c) => c.categoryId === Number(categoryFilter),
		);
		return category ? category.categoryName : undefined;
	};

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

	if (error) {
		return (
			<div className="p-4">
				<Alert message="Error" description={error} type="error" showIcon />
			</div>
		);
	}
	return (
		<div className="max-w-7xl mx-auto px-4 py-8" style={{ paddingTop: '80px' }}>
			<div className="mb-8">
				<Title level={1} className="text-center mb-6">
					Our Flower Collection
				</Title>

				{/* Filters */}
				<Card className="mb-6">
					<Row gutter={[16, 16]} align="middle">
						<Col xs={24} sm={12} md={8}>
							<Search
								placeholder="Search flowers..."
								allowClear
								enterButton={<SearchOutlined />}
								size="large"
								value={searchInput}
								onSearch={handleSearch}
								onChange={(e) => setSearchInput(e.target.value)}
							/>
						</Col>
						<Col xs={24} sm={12} md={6}>
							<Select
								placeholder="Filter by category"
								allowClear
								size="large"
								style={{ width: '100%' }}
								value={getCategoryDisplayValue()}
								onChange={(value) => {
									// value will be the category name, we need to find the ID
									if (value) {
										const category = categories.find(
											(c) => c.categoryName === value,
										);
										if (category) {
											handleCategoryFilter(category.categoryId.toString());
										}
									} else {
										handleCategoryFilter('');
									}
								}}
							>
								{categories.map((category) => (
									<Option
										key={category.categoryId}
										value={category.categoryName}
									>
										{category.categoryName}
									</Option>
								))}
							</Select>
						</Col>{' '}
						<Col xs={24} sm={24} md={10}>
							<Space className="text-gray-600">
								<span>
									Showing {flowers?.length || 0} of {total} flowers
									{searchQuery && ` for "${searchQuery}"`}
									{categoryFilter &&
										categories.find(
											(c) => c.categoryId === Number(categoryFilter),
										) &&
										` in "${categories.find((c) => c.categoryId === Number(categoryFilter))?.categoryName}"`}
								</span>
							</Space>
						</Col>
					</Row>
				</Card>
			</div>

			{loading ? (
				<div className="flex justify-center items-center min-h-96">
					<Spin size="large" />
				</div>
			) : (
				<>
					<Row gutter={[24, 24]}>
						{flowers?.map((flower) => (
							<Col xs={24} sm={12} md={8} lg={6} key={flower.flowerId}>
								<FlowerCard flower={flower} onAddToCart={handleAddToCart} />
							</Col>
						))}
					</Row>

					{(!flowers || flowers.length === 0) && (
						<div className="text-center py-16">
							<Title level={3} className="text-gray-500">
								No flowers found
							</Title>
							<p className="text-gray-400">
								Try adjusting your search criteria or browse our categories.
							</p>
						</div>
					)}

					{total > pageSize && (
						<div className="flex justify-center mt-8">
							<Pagination
								current={currentPage}
								total={total}
								pageSize={pageSize}
								onChange={setCurrentPage}
								showSizeChanger={false}
								showQuickJumper
								showTotal={(total, range) =>
									`${range[0]}-${range[1]} of ${total} flowers`
								}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
};

