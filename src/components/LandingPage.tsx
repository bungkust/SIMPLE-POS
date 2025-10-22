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
import { typography, sizes, cn } from '@/lib/design-system';

export function LandingPage() {

  const features = [
    {
      icon: Shield,
      title: 'Keamanan Terjamin',
      description: 'Sistem keamanan berlapis untuk melindungi data bisnis Anda'
    },
    {
      icon: Users,
      title: 'Kelola Banyak Toko',
      description: 'Kelola beberapa toko dalam satu dashboard yang mudah'
    },
    {
      icon: ShoppingCart,
      title: 'Kelola Menu',
      description: 'Tambah, edit, dan atur menu dengan kategori yang rapi'
    },
    {
      icon: Calculator,
      title: 'Kasir Digital',
      description: 'Sistem kasir modern dengan keranjang belanja yang praktis'
    },
    {
      icon: CreditCard,
      title: 'Lacak Pembayaran',
      description: 'Pantau semua pembayaran dan buat faktur otomatis'
    },
    {
      icon: BarChart3,
      title: 'Laporan Penjualan',
      description: 'Lihat riwayat pesanan dan laporan penjualan harian'
    },
    {
      icon: Settings,
      title: 'Tampilan Modern',
      description: 'Desain yang cantik dan mudah digunakan di semua perangkat'
    },
    {
      icon: Smartphone,
      title: 'Akses Mobile',
      description: 'Bisa dipakai di HP, tablet, dan komputer dengan lancar'
    },
    {
      icon: Globe,
      title: 'Copy Link',
      description: 'Salin link toko dengan mudah untuk dibagikan ke pelanggan'
    },
    {
      icon: Zap,
      title: 'Notifikasi Error',
      description: 'Sistem akan memberitahu jika ada masalah dengan jelas'
    }
  ];

  const pricingPlans = [
    {
      name: 'LENGKAP',
      originalPrice: 500000,
      discountedPrice: 70000,
      period: 'per bulan',
      features: [
        'Sistem kasir digital dengan keranjang belanja',
        'Kelola menu dengan kategori dan item produk',
        'Proses pesanan dan lacak pembayaran',
        'Riwayat pesanan dan laporan penjualan',
        'Kelola banyak toko dalam satu sistem',
        'Dashboard Super Admin yang mudah',
        'Sistem keamanan berlapis untuk data',
        'Keamanan data yang terjamin',
        'Isolasi data antar toko yang aman',
        'Popup notifikasi yang profesional',
        'Desain responsif untuk semua perangkat',
        'Fungsi copy link untuk kemudahan',
        'Notifikasi error yang jelas dan detail',
        'Dukungan 24/7 dengan uptime 99.9%'
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
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <span className={cn(typography.mobile.h3, "sm:text-xl")}>Simple POS</span>
                <div className="text-xs text-muted-foreground hidden sm:block">Modern Point of Sale</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/kopipendekar"
                className={cn(
                  "text-muted-foreground hover:text-primary transition-colors font-medium",
                  "text-sm sm:text-base px-2 py-1 rounded-md hover:bg-muted/50"
                )}
              >
                Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className={cn(
              "mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Solusi POS Terdepan di Indonesia</span>
              <span className="sm:hidden">POS Terdepan</span>
            </Badge>
            <h1 className={cn(
              typography.mobile.h1,
              "sm:text-4xl lg:text-5xl xl:text-6xl mb-4 sm:mb-6 leading-tight"
            )}>
              Sistem POS Modern untuk
              <span className="text-primary block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Semua Bisnis Anda
              </span>
            </h1>
            <p className={cn(
              typography.mobile.body.large,
              "sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0"
            )}>
              Kelola bisnis Anda dengan mudah menggunakan sistem Point of Sale Simple POS yang canggih,
              terintegrasi dengan berbagai metode pembayaran dan analisis bisnis real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4 sm:px-0">
              <Button asChild size="lg" className={cn(
                sizes.mobile.button.lg,
                "sm:text-lg sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all duration-200",
                "w-full sm:w-auto"
              )}>
                <Link to="/kopipendekar" className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Coba Demo Gratis</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className={cn(
                sizes.mobile.button.lg,
                "sm:text-lg sm:px-8 sm:py-6 w-full sm:w-auto"
              )}>
                <a
                  href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Mulai Kelola Bisnis</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
              <div className="text-center">
                <div className={cn(typography.mobile.price.large, "sm:text-3xl text-primary mb-1 sm:mb-2")}>1000+</div>
                <div className={cn(typography.mobile.body.small, "text-muted-foreground")}>Bisnis Aktif</div>
              </div>
              <div className="text-center">
                <div className={cn(typography.mobile.price.large, "sm:text-3xl text-primary mb-1 sm:mb-2")}>99.9%</div>
                <div className={cn(typography.mobile.body.small, "text-muted-foreground")}>Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className={cn(typography.mobile.price.large, "sm:text-3xl text-primary mb-1 sm:mb-2")}>24/7</div>
                <div className={cn(typography.mobile.body.small, "text-muted-foreground")}>Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-12 sm:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge variant="outline" className={cn(
              "mb-3 sm:mb-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}>
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Multi-Industry Support</span>
              <span className="sm:hidden">Multi-Industry</span>
            </Badge>
            <h2 className={cn(
              typography.mobile.h2,
              "sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
            )}>
              Cocok untuk Berbagai Jenis Bisnis
            </h2>
            <p className={cn(
              typography.mobile.body.large,
              "sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0"
            )}>
              Sistem POS kami dirancang fleksibel untuk berbagai model bisnis
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {businessTypes?.map((business, index) => {
              const IconComponent = business.icon;
              return (
                <Card key={index} className={cn(
                  "text-center hover:shadow-lg transition-all duration-200 border-0 bg-card/50 backdrop-blur-sm",
                  sizes.mobile.card.md
                )}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h3 className={cn(typography.mobile.h4, "sm:text-xl mb-1 sm:mb-2")}>{business.name}</h3>
                    <p className={cn(typography.mobile.body.small, "text-muted-foreground")}>{business.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge variant="secondary" className={cn(
              "mb-3 sm:mb-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Powerful Features</span>
              <span className="sm:hidden">Features</span>
            </Badge>
            <h2 className={cn(
              typography.mobile.h2,
              "sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
            )}>
              Fitur Lengkap untuk Kebutuhan Bisnis Anda
            </h2>
            <p className={cn(
              typography.mobile.body.large,
              "sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0"
            )}>
              Semua tools yang Anda butuhkan dalam satu platform terintegrasi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {features?.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className={cn(
                  "hover:shadow-lg transition-all duration-200 border-0 bg-card/50 backdrop-blur-sm group",
                  sizes.mobile.card.lg
                )}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className={cn(typography.mobile.h4, "sm:text-xl mb-2 sm:mb-3")}>{feature.title}</h3>
                    <p className={cn(typography.mobile.body.medium, "text-muted-foreground leading-relaxed")}>{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge variant="outline" className={cn(
              "mb-3 sm:mb-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Affordable Pricing</span>
              <span className="sm:hidden">Pricing</span>
            </Badge>
            <h2 className={cn(
              typography.mobile.h2,
              "sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
            )}>
              Harga Terjangkau untuk Semua Fitur
            </h2>
            <p className={cn(
              typography.mobile.body.large,
              "sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0"
            )}>
              Satu paket lengkap dengan semua fitur premium, mulai dari Rp 70.000 per bulan
            </p>
          </div>

          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            {pricingPlans?.map((plan, index) => (
              <Card key={index} className={cn(
                "relative border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-2xl",
                sizes.mobile.card.lg
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={cn(
                      "bg-primary text-primary-foreground px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm font-medium",
                      "flex items-center gap-1 sm:gap-1.5"
                    )}>
                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Paket Lengkap</span>
                      <span className="sm:hidden">Lengkap</span>
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3 sm:pb-4">
                  <CardTitle className={cn(typography.mobile.h3, "sm:text-2xl mb-1 sm:mb-2")}>{plan.name}</CardTitle>
                  <CardDescription className={cn(typography.mobile.body.medium, "text-muted-foreground")}>{plan.description}</CardDescription>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2 mt-3 sm:mt-4">
                    <span className={cn(typography.mobile.price.medium, "sm:text-2xl text-muted-foreground line-through")}>
                      Rp {(plan.originalPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground">→</span>
                    <span className={cn(typography.mobile.price.large, "sm:text-4xl text-primary")}>
                      Rp {(plan.discountedPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className={cn(typography.mobile.body.small, "text-muted-foreground")}>{plan.period}</p>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4">
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features?.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className={cn(typography.mobile.body.medium, "text-foreground")}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className={cn(
                    "w-full mt-4 sm:mt-6",
                    sizes.mobile.button.lg
                  )}>
                    <a
                      href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20COMPLETE%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Mulai Paket {plan.name}</span>
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
      <section className="py-12 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge variant="secondary" className={cn(
              "mb-3 sm:mb-4 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
              "flex items-center justify-center gap-1.5 sm:gap-2"
            )}>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Customer Stories</span>
              <span className="sm:hidden">Stories</span>
            </Badge>
            <h2 className={cn(
              typography.mobile.h2,
              "sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
            )}>
              Apa Kata Pengguna Kami
            </h2>
            <p className={cn(
              typography.mobile.body.large,
              "sm:text-xl text-muted-foreground px-4 sm:px-0"
            )}>
              Pengalaman nyata dari berbagai jenis bisnis yang sudah menggunakan sistem kami
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials?.map((testimonial, index) => (
              <Card key={index} className={cn(
                "border-0 bg-card/50 backdrop-blur-sm",
                sizes.mobile.card.lg
              )}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    {Array.from({ length: testimonial.rating || 0 }, (_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className={cn(typography.mobile.body.medium, "text-foreground mb-3 sm:mb-4 italic leading-relaxed")}>"{testimonial.content}"</p>
                  <div>
                    <p className={cn(typography.mobile.label.large, "text-foreground")}>{testimonial.name}</p>
                    <p className={cn(typography.mobile.body.small, "text-muted-foreground")}>{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-primary via-primary/90 to-blue-600 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className={cn(
            "mb-4 sm:mb-6 bg-white/20 text-primary-foreground border-white/30",
            "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm",
            "flex items-center justify-center gap-1.5 sm:gap-2"
          )}>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Ready to Transform Your Business?</span>
            <span className="sm:hidden">Ready?</span>
          </Badge>
          <h2 className={cn(
            typography.mobile.h2,
            "sm:text-3xl lg:text-4xl mb-4 sm:mb-6"
          )}>
            Siap Mengembangkan Bisnis Anda?
          </h2>
          <p className={cn(
            typography.mobile.body.large,
            "sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4 sm:px-0"
          )}>
            Bergabunglah dengan ribuan pemilik bisnis yang sudah mempercayai sistem POS kami
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button asChild size="lg" variant="secondary" className={cn(
              sizes.mobile.button.lg,
              "sm:text-lg sm:px-8 sm:py-6 bg-white text-primary hover:bg-white/90",
              "w-full sm:w-auto"
            )}>
              <Link to="/kopipendekar" className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Coba Demo Gratis</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={cn(
              sizes.mobile.button.lg,
              "sm:text-lg sm:px-8 sm:py-6 border-white/30 text-white hover:bg-white hover:text-primary",
              "w-full sm:w-auto"
            )}>
              <a
                href="https://wa.me/628515534424?text=Halo%2C%20saya%20tertarik%20dengan%20Simple%20POS.%20Bisakah%20anda%20jelaskan%20lebih%20lanjut%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Mulai Kelola Bisnis</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className={cn(typography.mobile.h3, "sm:text-xl text-slate-100")}>Simple POS</span>
                  <div className="text-xs text-slate-400 hidden sm:block">Modern Point of Sale</div>
                </div>
              </div>
              <p className={cn(typography.mobile.body.medium, "text-slate-400 mb-4 sm:mb-6 max-w-md leading-relaxed")}>
                Sistem Point of Sale modern dan terintegrasi untuk berbagai jenis bisnis di Indonesia.
                Solusi lengkap untuk manajemen penjualan dan operasional bisnis.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Terpercaya oleh 1000+ bisnis di Indonesia</span>
              </div>
            </div>

            <div>
              <h4 className={cn(typography.mobile.label.large, "mb-3 sm:mb-4 text-slate-100")}>Fitur Utama</h4>
              <ul className="space-y-2 sm:space-y-3 text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Point of Sale (POS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Menu Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Order Processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Payment Tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Multi-Tenant Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span className={cn(typography.mobile.body.small)}>Security First</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className={cn(typography.mobile.label.large, "mb-3 sm:mb-4 text-slate-100")}>Kontak Kami</h4>
              <div className="space-y-2 sm:space-y-3 text-slate-400">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className={cn(typography.mobile.body.small)}>support@simplepos.id</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className={cn(typography.mobile.body.small)}>+62 21 1234 5678</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className={cn(typography.mobile.body.small)}>Jakarta, Indonesia</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className={cn(typography.mobile.body.small)}>08:00 - 17:00 WIB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400">
            <p className={cn(typography.mobile.body.small)}>&copy; 2024 Simple POS Indonesia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
