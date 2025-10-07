import { Link } from 'react-router-dom';
import { Coffee, ShoppingCart, Users, BarChart3, CreditCard, Smartphone, ArrowRight, CheckCircle, Star, Calculator, Settings, Zap, Shield, Clock, DollarSign } from 'lucide-react';

export function LandingPage() {

  const features = [
    {
      icon: Calculator,
      title: 'Point of Sale (POS)',
      description: 'Interface kasir yang intuitif dan cepat untuk semua jenis transaksi bisnis'
    },
    {
      icon: ShoppingCart,
      title: 'Manajemen Produk',
      description: 'Kelola inventori, kategori, harga, dan variasi produk dengan mudah'
    },
    {
      icon: CreditCard,
      title: 'Multi Payment',
      description: 'Terima berbagai metode pembayaran: Tunai, Transfer, QRIS, dan lainnya'
    },
    {
      icon: BarChart3,
      title: 'Laporan & Analytics',
      description: 'Pantau penjualan, laba, dan performa bisnis dengan laporan real-time'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Kelola data pelanggan, loyalty program, dan riwayat pembelian'
    },
    {
      icon: Settings,
      title: 'Kustomisasi Penuh',
      description: 'Sesuaikan sistem dengan kebutuhan bisnis Anda, mulai dari UI hingga workflow'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Akses dari desktop, tablet, maupun smartphone dengan performa optimal'
    },
    {
      icon: Clock,
      title: 'Real-time Sync',
      description: 'Data tersinkronisasi real-time di semua device dan lokasi'
    },
    {
      icon: Shield,
      title: 'Keamanan Data',
      description: 'Enkripsi end-to-end dan backup otomatis untuk keamanan data bisnis'
    },
    {
      icon: DollarSign,
      title: 'Multi Tenant',
      description: 'Kelola beberapa cabang/toko dalam satu sistem dengan mudah'
    },
    {
      icon: Zap,
      title: 'API Integration',
      description: 'Integrasi dengan sistem eksternal via REST API yang powerful'
    },
    {
      icon: Coffee,
      title: 'Industry Agnostic',
      description: 'Cocok untuk berbagai jenis bisnis: Retail, F&B, Service, dan lainnya'
    }
  ];

  const pricingPlans = [
    {
      name: 'COMPLETE',
      originalPrice: 500000,
      discountedPrice: 70000,
      period: 'per bulan',
      features: [
        'Point of Sale (POS) Lengkap',
        'Manajemen Produk & Inventori Unlimited',
        'Multi Payment: Tunai, Transfer, QRIS',
        'Laporan & Analytics Real-time',
        'Customer Management & Loyalty',
        'Kustomisasi UI & Workflow',
        'Mobile Responsive & Multi-device',
        'Real-time Sync Antar Lokasi',
        'Keamanan Data & Backup Otomatis',
        'Multi Tenant/Cabang Support',
        'API Integration untuk Developer',
        'Support 24/7 dengan SLA 99.9%'
      ],
      popular: true,
      description: 'Paket lengkap dengan semua fitur untuk bisnis modern'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmad Santoso',
      business: 'Toko Elektronik "Sumber Rejeki"',
      content: 'Sistem POS ini sangat membantu operasional toko kami. Interface-nya mudah digunakan dan fitur pelaporannya sangat detail.',
      rating: 5
    },
    {
      name: 'Sari Dewi',
      business: 'Restoran "Dapur Ibu"',
      content: 'Dengan sistem ini, kami bisa monitor penjualan real-time dan mengelola inventori dengan lebih efisien.',
      rating: 5
    },
    {
      name: 'Budi Setiawan',
      business: 'Salon "Cantik Modern"',
      content: 'Kustomisasi sistem sesuai kebutuhan salon kami sangat membantu. Tim support juga responsif.',
      rating: 5
    }
  ];

  const businessTypes = [
    { icon: Coffee, name: 'Food & Beverage', desc: 'Kafe, Restoran, Warung' },
    { icon: ShoppingCart, name: 'Retail', desc: 'Toko, Minimarket, Butik' },
    { icon: Settings, name: 'Service', desc: 'Salon, Bengkel, Laundry' },
    { icon: BarChart3, name: 'Professional', desc: 'Klinik, Kantor, Konsultan' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Simple POS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/kopipendekar"
                className="text-slate-700 hover:text-green-600 transition-colors font-medium"
              >
                Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Sistem POS Modern untuk
              <span className="text-green-600 block">Semua Bisnis Anda</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Kelola bisnis Anda dengan mudah menggunakan sistem Point of Sale Simple POS yang canggih,
              terintegrasi dengan berbagai metode pembayaran dan analisis bisnis real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/kopipendekar"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Coba Demo Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
              >
                Mulai Kelola Bisnis
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Cocok untuk Berbagai Jenis Bisnis
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Sistem POS kami dirancang fleksibel untuk berbagai model bisnis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businessTypes.map((business, index) => {
              const IconComponent = business.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl bg-slate-50 hover:bg-green-50 hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{business.name}</h3>
                  <p className="text-slate-600">{business.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Fitur Lengkap untuk Kebutuhan Bisnis Anda
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Semua tools yang Anda butuhkan dalam satu platform terintegrasi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow duration-200 border border-slate-100">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Harga Terjangkau untuk Semua Fitur
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Satu paket lengkap dengan semua fitur premium, mulai dari Rp 70.000 per bulan
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="relative rounded-xl p-8 border-2 border-green-500 bg-green-50 shadow-xl">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Paket Lengkap
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 mb-4">{plan.description}</p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-slate-500 line-through">
                      Rp {plan.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-500">→</span>
                    <span className="text-3xl font-bold text-green-600">
                      Rp {plan.discountedPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">{plan.period}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20COMPLETE%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg font-semibold transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  Mulai Paket {plan.name}
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-medium">
              🎉 <strong>Promo Spesial:</strong> Diskon hingga 86% untuk 6 bulan pertama! Berlaku sampai 31 Desember 2024.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Apa Kata Pengguna Kami
            </h2>
            <p className="text-xl text-slate-600">
              Pengalaman nyata dari berbagai jenis bisnis yang sudah menggunakan sistem kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Siap Mengembangkan Bisnis Anda?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Bergabunglah dengan ribuan pemilik bisnis yang sudah mempercayai sistem POS kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/kopipendekar"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Coba Demo Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Mulai Kelola Bisnis
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Simple POS</span>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                Sistem Point of Sale modern dan terintegrasi untuk berbagai jenis bisnis di Indonesia.
                Solusi lengkap untuk manajemen penjualan dan operasional bisnis.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Terpercaya oleh 1000+ bisnis di Indonesia</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Fitur Utama</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Point of Sale (POS)</li>
                <li>• Manajemen Produk & Inventori</li>
                <li>• Multi Payment Methods</li>
                <li>• Laporan & Analytics</li>
                <li>• Customer Management</li>
                <li>• Mobile Responsive</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Kontak Kami</h4>
              <div className="space-y-2 text-slate-400">
                <p>📧 support@simplepos.id</p>
                <p>📱 +62 21 1234 5678</p>
                <p>📍 Jakarta, Indonesia</p>
                <p>💼 Business Hours: 08:00 - 17:00 WIB</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Simple POS Indonesia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
