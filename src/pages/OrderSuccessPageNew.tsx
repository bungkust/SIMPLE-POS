import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, ArrowLeft, ShoppingBag } from 'lucide-react';

interface OrderSuccessPageProps {
  orderCode: string;
  onViewInvoice: () => void;
  onBackToMenu: () => void;
}

export function OrderSuccessPage({ orderCode, onViewInvoice, onBackToMenu }: OrderSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Professional Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Pesanan Berhasil</h1>
              <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                Konfirmasi pesanan Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-2 sm:p-4 pb-40 sm:pb-8">
        <Card className="shadow-xl border-0">
          {/* Simple Mobile Header */}
          <div className="bg-primary text-primary-foreground p-3 sm:p-8 rounded-t-lg">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="w-6 h-6 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">Pesanan Berhasil Dibuat!</h1>
              <p className="text-sm sm:text-lg opacity-90">
                Pesanan Anda telah berhasil dibuat dan akan segera diproses
              </p>
            </div>
          </div>

          <CardHeader className="pb-3 sm:pb-6 pt-3 sm:pt-8">
            <div className="text-center">
              <h2 className="text-sm sm:text-xl font-semibold mb-1">Konfirmasi Pesanan</h2>
              <p className="text-muted-foreground text-xs sm:text-base">Detail pesanan Anda</p>
            </div>
          </CardHeader>
        
          <CardContent className="space-y-3 sm:space-y-8 p-3 sm:p-6">
            {/* Order Code Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-lg flex items-center justify-center gap-2">
                  <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                  Kode Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm sm:text-xl px-3 sm:px-6 py-2 sm:py-3 mb-3 sm:mb-4">
                  {orderCode}
                </Badge>
                <p className="text-muted-foreground text-xs sm:text-base">
                  Simpan kode pesanan ini untuk referensi dan tracking
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={onViewInvoice}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-base"
                size="sm"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Lihat Invoice
              </Button>
              
              <Button
                onClick={onBackToMenu}
                variant="outline"
                className="flex-1 text-xs sm:text-base"
                size="sm"
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Kembali ke Menu
              </Button>
            </div>

            {/* Professional Footer */}
            <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-0 mt-3 sm:mt-8">
              <CardContent className="text-center py-3 sm:py-6">
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground">Terima Kasih Atas Pesanan Anda!</h3>
                  <p className="text-muted-foreground text-xs sm:text-base">
                    Pesanan Anda akan segera diproses dan siap untuk diambil sesuai jadwal yang telah ditentukan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
