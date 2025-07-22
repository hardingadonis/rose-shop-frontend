import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { categoryService } from '../services/categoryService';
import { useUserNotification } from '../services/userNotification';
import type { Category } from '../types';
import {
	AppstoreOutlined,
	HomeOutlined,
	LogoutOutlined,
	MenuOutlined,
	ShoppingCartOutlined,
	UserOutlined,
} from '@ant-design/icons';
import {
	Avatar,
	Badge,
	Button,
	Col,
	Drawer,
	Dropdown,
	Input,
	Layout,
	Menu,
	Row,
	Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Search } = Input;

export const Navbar: React.FC = () => {
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	const [categories, setCategories] = useState<Category[]>([]);
	const { user, logout } = useAuth();
	const { cartCount, refreshCart } = useCart();
	const notification = useUserNotification();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const categoriesData = await categoryService.getPublicCategories();
				setCategories(categoriesData || []);
			} catch (error) {
				console.error('Error fetching categories:', error);
			}
		};

		fetchCategories();
	}, []);

	// Refresh cart khi user thay đổi (login/logout)
	useEffect(() => {
		if (user) {
			refreshCart();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const showDrawer = () => setDrawerVisible(true);
	const onClose = () => setDrawerVisible(false);

	const handleLogout = () => {
		logout();
		notification.logoutSuccess();
		navigate('/login');
	};

	const handleNavbarSearch = (value: string) => {
		if (value.trim()) {
			navigate(`/flowers?search=${encodeURIComponent(value.trim())}`);
		} else {
			navigate('/flowers');
		}
		setSearchValue('');
	};

	// Function to get selected keys for menu
	const getSelectedKeys = () => {
		const path = location.pathname;
		const search = location.search;

		if (path === '/') {
			return ['/'];
		}

		if (path === '/flowers') {
			if (search) {
				// If there's a category parameter, find matching category
				const urlParams = new URLSearchParams(search);
				const categoryId = urlParams.get('category');
				if (categoryId) {
					return [`/flowers?category=${categoryId}`];
				}
			}
			return ['/flowers'];
		}

		return [path];
	};

	const userMenu = (
		<Menu>
			<Menu.Item key="profile" icon={<UserOutlined />}>
				<Link to="/profile">Profile</Link>
			</Menu.Item>
			<Menu.Item key="orders" icon={<AppstoreOutlined />}>
				<Link to="/orders">My Orders</Link>
			</Menu.Item>
			<Menu.Divider />
			<Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
				Logout
			</Menu.Item>
		</Menu>
	);

	const guestMenu = (
		<Menu>
			<Menu.Item key="login">
				<Link to="/login">Login</Link>
			</Menu.Item>
			<Menu.Item key="register">
				<Link to="/register">Register</Link>
			</Menu.Item>
		</Menu>
	);

	const navigationMenu = (
		<Menu
			mode="horizontal"
			selectedKeys={getSelectedKeys()}
			style={{ backgroundColor: COLORS.background }}
		>
			<Menu.Item key="/" icon={<HomeOutlined />}>
				<Link to="/">Home</Link>
			</Menu.Item>
			<Menu.Item key="/flowers" icon={<AppstoreOutlined />}>
				<Link to="/flowers">All Flowers</Link>
			</Menu.Item>
			{categories.map((category) => (
				<Menu.Item
					key={`/flowers?category=${category.categoryId}`}
					icon={<AppstoreOutlined />}
				>
					<Link to={`/flowers?category=${category.categoryId}`}>
						{category.categoryName}
					</Link>
				</Menu.Item>
			))}
		</Menu>
	);

	return (
		<AntHeader
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				zIndex: 1000,
				backgroundColor: COLORS.background,
				padding: '0 20px',
			}}
			className="shadow-md"
		>
			<Row justify="space-between" align="middle">
				{' '}
				<Col xs={6} sm={4} md={4} className="text-center">
					<Link to="/">
						<img
							src="/favicon.ico"
							alt="Rose Shop"
							className="h-10 w-auto mx-auto"
							style={{ maxHeight: 40 }}
						/>
					</Link>
				</Col>
				<Col xs={0} sm={0} md={12} className="flex justify-center">
					{navigationMenu}
				</Col>
				<Col xs={0} sm={0} md={8} className="text-center">
					<Space size="middle" direction="horizontal">
						<div className="flex justify-center">
							<Search
								placeholder="Search..."
								value={searchValue}
								onSearch={handleNavbarSearch}
								onChange={(e) => setSearchValue(e.target.value)}
								style={{ width: 200 }}
							/>
						</div>{' '}
						<div className="flex justify-center">
							<Dropdown
								overlay={user ? userMenu : guestMenu}
								placement="bottomRight"
							>
								<Avatar
									src={user?.userInfo?.avatar || user?.avatar}
									icon={<UserOutlined />}
									style={{ cursor: 'pointer' }}
								>
									{!user?.userInfo?.avatar &&
									!user?.avatar &&
									(user?.userInfo?.fullName || user?.fullName)
										? (user?.userInfo?.fullName || user?.fullName)
												?.charAt(0)
												.toUpperCase()
										: undefined}
								</Avatar>
							</Dropdown>
						</div>
						<div className="flex justify-center">
							<Link to="/cart">
								<Badge count={cartCount} offset={[0, 0]}>
									<ShoppingCartOutlined
										style={{ fontSize: '1.5em', cursor: 'pointer' }}
									/>
								</Badge>
							</Link>
						</div>
					</Space>
				</Col>
				<Col xs={6} sm={4} md={0} style={{ textAlign: 'right' }}>
					<Button type="text" icon={<MenuOutlined />} onClick={showDrawer} />
				</Col>
			</Row>
			<Drawer
				title="Menu"
				placement="right"
				onClose={onClose}
				open={drawerVisible}
			>
				<div style={{ marginBottom: 20 }}>
					<Menu mode="vertical" selectedKeys={getSelectedKeys()}>
						<Menu.Item key="/" icon={<HomeOutlined />}>
							<Link to="/" onClick={onClose}>
								Home
							</Link>
						</Menu.Item>
						<Menu.Item key="/flowers" icon={<AppstoreOutlined />}>
							<Link to="/flowers" onClick={onClose}>
								All Flowers
							</Link>
						</Menu.Item>
						{categories.map((category) => (
							<Menu.Item
								key={`/flowers?category=${category.categoryId}`}
								icon={<AppstoreOutlined />}
							>
								<Link
									to={`/flowers?category=${category.categoryId}`}
									onClick={onClose}
								>
									{category.categoryName}
								</Link>
							</Menu.Item>
						))}
					</Menu>
				</div>
				<div style={{ marginTop: 20 }}>
					<Search
						placeholder="Search..."
						onSearch={(value) => {
							handleNavbarSearch(value);
							onClose();
						}}
						onChange={(e) => setSearchValue(e.target.value)}
						value={searchValue}
					/>
				</div>
				<div style={{ marginTop: 20 }}>
					{user ? (
						<>
							<div style={{ marginBottom: 10 }}>
								<span>
									Welcome,{' '}
									{user?.userInfo?.fullName || user?.fullName || user?.username}
									!
								</span>
							</div>
							<Button
								icon={<UserOutlined />}
								block
								style={{ marginBottom: 10 }}
								onClick={() => {
									navigate('/profile');
									onClose();
								}}
							>
								Profile
							</Button>
							<Button icon={<LogoutOutlined />} block onClick={handleLogout}>
								Logout
							</Button>
						</>
					) : (
						<Dropdown overlay={guestMenu} placement="bottomLeft">
							<Button icon={<UserOutlined />}>Account</Button>
						</Dropdown>
					)}
				</div>
				<div style={{ marginTop: 20 }}>
					<Link to="/cart" onClick={onClose}>
						<Badge count={cartCount} offset={[0, 0]}>
							<ShoppingCartOutlined
								style={{ fontSize: '1.5em', cursor: 'pointer' }}
							/>
						</Badge>
					</Link>
				</div>
			</Drawer>
		</AntHeader>
	);
};

