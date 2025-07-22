import { App as AntApp, ConfigProvider, Layout } from 'antd';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminSidebar } from './components/AdminSidebar';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { EnterResetToken } from './pages/EnterResetToken';
import { FlowerDetail } from './pages/FlowerDetail';
import { FlowerList } from './pages/FlowerList';
import { ForgotPassword } from './pages/ForgotPassword';
// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { OrderDetail } from './pages/OrderDetail';
import { Orders } from './pages/Orders';
import PaymentSuccess from './pages/PaymentSuccess';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { AdminCategory } from './pages/admin/AdminCategory';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminEnterResetToken } from './pages/admin/AdminEnterResetToken';
import { AdminFlower } from './pages/admin/AdminFlower';
import { AdminForgotPassword } from './pages/admin/AdminForgotPassword';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminResetPassword } from './pages/admin/AdminResetPassword';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVoucher } from './pages/admin/AdminVoucher';

const { Content } = Layout;

// Admin Layout Component
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Layout style={{ minHeight: '100vh' }}>
		<AdminSidebar />
		<Layout>
			<Content className="p-6 bg-gray-50">{children}</Content>
		</Layout>
	</Layout>
);

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Layout style={{ minHeight: '100vh' }}>
		<Navbar />
		<Content style={{ flex: 1 }}>{children}</Content>
		<Footer />
	</Layout>
);

function App() {
	return (
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: '#ff6b6b',
					borderRadius: 8,
				},
			}}
		>
			<AntApp>
				<Router>
					<Routes>
						{/* Admin Routes with separate context */}
						<Route
							path="/admin/login"
							element={
								<AdminAuthProvider>
									<AdminLogin />
								</AdminAuthProvider>
							}
						/>
						<Route
							path="/admin/forgot-password"
							element={
								<AdminAuthProvider>
									<AdminForgotPassword />
								</AdminAuthProvider>
							}
						/>
						<Route
							path="/admin/enter-reset-token"
							element={
								<AdminAuthProvider>
									<AdminEnterResetToken />
								</AdminAuthProvider>
							}
						/>
						<Route
							path="/admin/reset-password"
							element={
								<AdminAuthProvider>
									<AdminResetPassword />
								</AdminAuthProvider>
							}
						/>
						<Route
							path="/admin/*"
							element={
								<AdminAuthProvider>
									<AdminProtectedRoute>
										<AdminLayout>
											<Routes>
												<Route path="/" element={<AdminDashboard />} />
												<Route path="/dashboard" element={<AdminDashboard />} />
												<Route path="/flowers" element={<AdminFlower />} />
												<Route path="/categories" element={<AdminCategory />} />
												<Route path="/vouchers" element={<AdminVoucher />} />
												<Route
													path="/vouchers/stats/:code"
													element={<div>Voucher Stats - Coming Soon</div>}
												/>
												<Route path="/orders" element={<AdminOrders />} />
												<Route path="/users" element={<AdminUsers />} />
											</Routes>
										</AdminLayout>
									</AdminProtectedRoute>
								</AdminAuthProvider>
							}
						/>

						{/* User Routes with user context - ALL routes wrapped in AuthProvider */}
						<Route
							path="/*"
							element={
								<AuthProvider>
									<CartProvider>
										<Routes>
											{/* Public Routes */}
											<Route path="/login" element={<Login />} />
											<Route path="/register" element={<Register />} />
											<Route
												path="/forgot-password"
												element={<ForgotPassword />}
											/>
											<Route
												path="/enter-reset-token"
												element={<EnterResetToken />}
											/>
											<Route
												path="/reset-password/:token"
												element={<ResetPassword />}
											/>

											{/* Main Layout Routes */}
											<Route
												path="/"
												element={
													<MainLayout>
														<Home />
													</MainLayout>
												}
											/>
											<Route
												path="/flowers"
												element={
													<MainLayout>
														<FlowerList />
													</MainLayout>
												}
											/>
											<Route
												path="/flowers/:id"
												element={
													<MainLayout>
														<FlowerDetail />
													</MainLayout>
												}
											/>
											{/* Protected Routes */}
											<Route
												path="/cart"
												element={
													<ProtectedRoute>
														<MainLayout>
															<Cart />
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/checkout"
												element={
													<ProtectedRoute>
														<MainLayout>
															<Checkout />
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/orders"
												element={
													<ProtectedRoute>
														<MainLayout>
															<Orders />
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/orders/:orderId"
												element={
													<ProtectedRoute>
														<MainLayout>
															<OrderDetail />
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/profile"
												element={
													<ProtectedRoute>
														<MainLayout>
															<Profile />
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/addresses"
												element={
													<ProtectedRoute>
														<MainLayout>
															<div>Address Book Page - Coming Soon</div>
														</MainLayout>
													</ProtectedRoute>
												}
											/>
											<Route
												path="/payment/success"
												element={
													<MainLayout>
														<PaymentSuccess />
													</MainLayout>
												}
											/>
											{/* 404 Route */}
											<Route
												path="*"
												element={
													<MainLayout>
														<div className="text-center py-16">
															<h1 className="text-4xl font-bold text-gray-800 mb-4">
																404 - Page Not Found
															</h1>
															<p className="text-gray-600">
																The page you're looking for doesn't exist.
															</p>
														</div>
													</MainLayout>
												}
											/>
										</Routes>
									</CartProvider>
								</AuthProvider>
							}
						/>
					</Routes>
				</Router>
			</AntApp>
		</ConfigProvider>
	);
}

export default App;

