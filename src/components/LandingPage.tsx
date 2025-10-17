import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  CreditCard, 
  Smartphone, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Calculator, 
  Settings, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign,
  Sparkles,
  TrendingUp,
  Globe,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

export function LandingPage() {

  const features = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'Server-side authentication dengan RPC functions, Row Level Security (RLS), dan secure tenant isolation'
    },
    {
      icon: Users,
      title: 'Multi-Tenant Management',
      description: 'Super Admin Dashboard untuk manajemen tenant, simplified tenant creation dengan owner email setup'
    },
    {
      icon: ShoppingCart,
      title: 'Menu Management',
      description: 'Kelola menu dengan categories dan items, manajemen produk yang mudah dan intuitif'
    },
    {
      icon: Calculator,
      title: 'Order Processing',
      description: 'Interface kasir dengan cart functionality untuk memproses pesanan dengan cepat'
    },
    {
      icon: CreditCard,
      title: 'Payment Tracking',
      description: 'Tracking pembayaran dan invoice generation untuk semua transaksi bisnis'
    },
    {
      icon: BarChart3,
      title: 'Order History & Reporting',
      description: 'Riwayat pesanan dan laporan penjualan untuk analisis performa bisnis'
    },
    {
      icon: Settings,
      title: 'Modern UI/UX',
      description: 'Professional in-app popups, responsive design dengan TailwindCSS, dan error handling yang detail'
    },
    {
      icon: Smartphone,
      title: 'Responsive Design',
      description: 'Akses dari desktop, tablet, maupun smartphone dengan performa optimal'
    },
    {
      icon: Globe,
      title: 'Copy-to-Clipboard',
      description: 'Fungsi copy-to-clipboard untuk setup URLs dan kemudahan sharing'
    },
    {
      icon: Zap,
      title: 'Error Handling',
      description: 'Error handling dengan detailed user feedback untuk pengalaman yang lebih baik'
    }
  ];

  const pricingPlans = [
    {
      name: 'COMPLETE',
      originalPrice: 500000,
      discountedPrice: 70000,
      period: 'per bulan',
      features: [
        'Point of Sale (POS) dengan cart functionality',
        'Menu management dengan categories dan items',
        'Order processing dan payment tracking',
        'Order history dan reporting',
        'Multi-tenant management system',
        'Super Admin Dashboard',
        'Server-side authentication dengan RPC functions',
        'Row Level Security (RLS) policies',
        'Secure tenant isolation',
        'Professional in-app popups',
        'Responsive design dengan TailwindCSS',
        'Copy-to-clipboard functionality',
        'Error handling dengan detailed feedback',
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Simple POS</span>
                <div className="text-xs text-muted-foreground">Modern Point of Sale</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/kopipendekar"
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Demo
              </Link>
              <Button asChild>
                <Link to="/admin/login">
                  Masuk Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Solusi POS Terdepan di Indonesia
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Sistem POS Modern untuk
              <span className="text-primary block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Semua Bisnis Anda
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Kelola bisnis Anda dengan mudah menggunakan sistem Point of Sale Simple POS yang canggih,
              terintegrasi dengan berbagai metode pembayaran dan analisis bisnis real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200">
                <Link to="/kopipendekar" className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Coba Demo Gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <a
                  href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Mulai Kelola Bisnis
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                <div className="text-muted-foreground">Bisnis Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Globe className="w-4 h-4 mr-2" />
              Multi-Industry Support
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Cocok untuk Berbagai Jenis Bisnis
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistem POS kami dirancang fleksibel untuk berbagai model bisnis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessTypes.map((business, index) => {
              const IconComponent = business.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-200 border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{business.name}</h3>
                    <p className="text-muted-foreground">{business.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Fitur Lengkap untuk Kebutuhan Bisnis Anda
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Semua tools yang Anda butuhkan dalam satu platform terintegrasi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 bg-card/50 backdrop-blur-sm group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <TrendingUp className="w-4 h-4 mr-2" />
              Affordable Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Harga Terjangkau untuk Semua Fitur
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Satu paket lengkap dengan semua fitur premium, mulai dari Rp 70.000 per bulan
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className="relative border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-2xl">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-medium">
                      <Star className="w-4 h-4 mr-1" />
                      Paket Lengkap
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="flex items-center justify-center gap-3 mb-2 mt-4">
                    <span className="text-2xl font-bold text-muted-foreground line-through">
                      Rp {plan.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">→</span>
                    <span className="text-4xl font-bold text-primary">
                      Rp {plan.discountedPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.period}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full mt-6" size="lg">
                    <a
                      href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20COMPLETE%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Mulai Paket {plan.name}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-12 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <p className="text-amber-800 font-medium text-lg">
                🎉 <strong>Promo Spesial:</strong> Diskon hingga 86% untuk 6 bulan pertama! Berlaku sampai 31 Desember 2024.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Heart className="w-4 h-4 mr-2" />
              Customer Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Apa Kata Pengguna Kami
            </h2>
            <p className="text-xl text-muted-foreground">
              Pengalaman nyata dari berbagai jenis bisnis yang sudah menggunakan sistem kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-blue-600 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-primary-foreground border-white/30">
            <Sparkles className="w-4 h-4 mr-2" />
            Ready to Transform Your Business?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Siap Mengembangkan Bisnis Anda?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pemilik bisnis yang sudah mempercayai sistem POS kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90">
              <Link to="/kopipendekar" className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Coba Demo Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white hover:text-primary">
              <a
                href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Mulai Kelola Bisnis
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-100">Simple POS</span>
                  <div className="text-xs text-slate-400">Modern Point of Sale</div>
                </div>
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Sistem Point of Sale modern dan terintegrasi untuk berbagai jenis bisnis di Indonesia.
                Solusi lengkap untuk manajemen penjualan dan operasional bisnis.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Terpercaya oleh 1000+ bisnis di Indonesia</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-100">Fitur Utama</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Point of Sale (POS)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Menu Management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Order Processing
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Payment Tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Multi-Tenant Management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Security First
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-100">Kontak Kami</h4>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>support@simplepos.id</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+62 21 1234 5678</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Jakarta, Indonesia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>08:00 - 17:00 WIB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Simple POS Indonesia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
