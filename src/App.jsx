import React, { useState } from 'react';
import ProductGrid from './ProductGrid';
import AIChatAssistant from './AIChatAssistant';
import { LayoutDashboard, ShoppingBag, Settings, Store, Cpu } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    // ... products array remains same ...
    {
      title: 'Running Shoe',
      price: '$89.99',
      rating: 4.5,
      reviews: 120,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      description: 'High-performance running shoes.'
    },
    {
      title: 'Wireless Headphones',
      price: null,
      rating: null,
      reviews: 0,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      description: ''
    },
    {
      title: 'Yoga Mat',
      price: '$29.99',
      rating: 4.8,
      reviews: 85,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
      description: 'Premium non-slip yoga mat.'
    },
    {
      title: 'Coffee Maker',
      price: '$129.00',
      rating: 4.2,
      reviews: 210,
      image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80',
      description: 'Brews the perfect cup every time.'
    },
    {
      title: 'Smart Watch',
      price: '$199.99',
      rating: null,
      reviews: 0,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      description: 'Track your fitness and stay connected.'
    },
    {
      title: 'Gaming Mouse',
      price: '$59.99',
      rating: 4.9,
      reviews: 500,
      image: 'https://images.unsplash.com/photo-1628832307345-7404b47f1751?q=80&w=800&auto=format&fit=crop',
      description: 'Precision gaming mouse with RGB.'
    }
  ];

  const gaps = [
    { product: 'Running Shoe', detail: 'Missing specific style descriptor' },
    { product: 'Wireless Headphones', detail: 'Missing battery life information' },
    { product: 'Wireless Headphones', detail: 'No warranty stated' },
    { product: 'Smart Watch', detail: 'Missing compatibility information' },
    { product: 'Gaming Mouse', detail: 'DPI resolution not specified' },
    { product: 'Yoga Mat', detail: 'Product image not provided' }
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <Store size={28} color="#6366f1" />
          SalesIQ
        </div>
        <div className="nav-menu">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <ShoppingBag size={20} />
            Products
          </div>
          <div className={`nav-item ${activeTab === 'ai-insights' ? 'active' : ''}`} onClick={() => setActiveTab('ai-insights')}>
            <Cpu size={20} />
            AI Insights
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} style={{ marginTop: 'auto' }} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1 className="header-title">
            {activeTab === 'dashboard' && 'Product Intelligence'}
            {activeTab === 'products' && 'Products Management'}
            {activeTab === 'ai-insights' && 'AI Analysis & Insights'}
            {activeTab === 'settings' && 'System Settings'}
          </h1>
          <p className="header-subtitle">
            {activeTab === 'dashboard' && 'Analyze, optimize, and generate high-converting product listings with AI.'}
            {activeTab === 'products' && 'Manage your store catalog and product inventory.'}
            {activeTab === 'ai-insights' && 'Deep dive into AI recommendations for your store.'}
            {activeTab === 'settings' && 'Configure AI agents and store preferences.'}
          </p>
        </div>

        {activeTab === 'dashboard' && <ProductGrid products={products} gaps={gaps} onProductSelect={setSelectedProduct} />}

        {activeTab !== 'dashboard' && (
          <div className="animate-fade-in" style={{
            padding: '60px 40px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <h2 style={{ marginBottom: '16px', color: '#fff', fontSize: '24px' }}>
              {activeTab === 'products' && 'Products View'}
              {activeTab === 'ai-insights' && 'AI Insights Dashboard'}
              {activeTab === 'settings' && 'Settings Panel'}
            </h2>
            <p style={{ fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              This module is currently under development.
            </p>
          </div>
        )}
      </div>

      {/* Global AI Chat Assistant */}
      <AIChatAssistant 
        currentProduct={selectedProduct} 
        allProducts={products}
        onClearContext={() => setSelectedProduct(null)} 
        onProductSelect={setSelectedProduct}
      />
    </div>
  );
}

export default App;
