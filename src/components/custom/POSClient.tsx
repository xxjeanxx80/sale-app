'use client';

import { useState, useEffect } from 'react';
import { getServices } from '@/app/actions/services';
import { getCustomers } from '@/app/actions/customers';
import { calculateInvoice, checkout } from '@/app/actions/pos';
import { getRecommendations, Recommendation } from '@/app/actions/recommendations';
import { getDoctors } from '@/app/actions/employees';
import CustomerModal from './CustomerModal';
import CheckoutModal from './CheckoutModal';

export default function POSClient() {
  // States for Left Panel (Catalog)
  const [catalogSearch, setCatalogSearch] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // States for Right Panel (Cart & Customer)
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  
  // Invoice state
  const [subTotal, setSubTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [appliedPromotions, setAppliedPromotions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] = useState(false);
  const [autoPromo, setAutoPromo] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Reset page when search changes
  useEffect(() => {
    setPage(1);
    setServices([]);
    setHasMore(true);
  }, [catalogSearch]);

  useEffect(() => {
    const fetchCatalogAndDocs = async () => {
      if (page === 1) setLoadingCatalog(true);
      else setIsLoadingMore(true);

      try {
        if (doctors.length === 0) {
          const docs = await getDoctors();
          setDoctors(docs);
        }
        
        const res = await getServices(page, 20, catalogSearch);
        setServices(prev => page === 1 ? res.services : [...prev, ...res.services]);
        setHasMore(res.services.length === 20);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCatalog(false);
        setIsLoadingMore(false);
      }
    };
    const timer = setTimeout(fetchCatalogAndDocs, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch, page]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loadingCatalog && !isLoadingMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    const fetchCus = async () => {
      if (!customerSearch) {
        setCustomers([]);
        return;
      }
      try {
        const res = await getCustomers(1, 10, customerSearch);
        setCustomers(res.customers);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchCus, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const addToCart = (item: any) => {
    const existing = cartItems.find(c => c.id === item.id);
    if (existing) {
      setCartItems(cartItems.map(c => 
        (c.id === item.id) 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCartItems([...cartItems, {
        type: 'SERVICE',
        id: item.id,
        name: item.item_name,
        price: item.service_prices?.[0]?.base_price || 0,
        quantity: 1,
        discount_amount: 0,
        final_price: item.service_prices?.[0]?.base_price || 0,
        doctor_id: null,
        category_id: item.category_id
      }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...cartItems];
    newItems[index].quantity += delta;
    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }
    setCartItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const updateItemDoctor = (index: number, doctorId: number | null) => {
    const newItems = [...cartItems];
    newItems[index].doctor_id = doctorId;
    setCartItems(newItems);
  };

  useEffect(() => {
    const doCalc = async () => {
      if (cartItems.length === 0) {
        setSubTotal(0);
        setTotalDiscount(0);
        setFinalTotal(0);
        setAppliedPromotions([]);
        setRecommendations([]);
        return;
      }
      try {
        const res = await calculateInvoice(cartItems, selectedCustomer?.id || null, autoPromo);
        setSubTotal(res.subTotal);
        setTotalDiscount(res.totalDiscount);
        setFinalTotal(res.finalTotal);
        setAppliedPromotions(res.appliedPromotions || []);
        
        const specificDiscount = res.evaluatedCartItems.reduce((sum: number, item: any) => sum + item.discount_amount, 0);
        const currentTotalAfterSpecific = res.subTotal - specificDiscount;
        
        const recs = autoPromo ? await getRecommendations(cartItems, currentTotalAfterSpecific) : [];
        setRecommendations(recs);
      } catch (err) {
        console.error("Calculate Error", err);
      }
    };
    doCalc();
  }, [cartItems, selectedCustomer, autoPromo]);

  const handleCheckoutClick = () => {
    if (!selectedCustomer) {
      alert("Vui lòng chọn khách hàng!");
      return;
    }
    if (cartItems.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = async (paymentMethod: string, customerTendered: number) => {
    setIsCheckingOut(true);
    try {
      const res = await checkout({
        customerId: selectedCustomer.id,
        cartItems,
        subTotal,
        totalDiscount,
        finalTotal,
        amountPaid: customerTendered,
        paymentMethod: paymentMethod
      });

      if (res.success) {
        alert("Lên đơn và thanh toán thành công!");
        setCartItems([]);
        setSelectedCustomer(null);
        setIsCheckoutModalOpen(false);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi thanh toán.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-4rem)] bg-slate-50 overflow-y-auto md:overflow-hidden font-sans p-3 md:p-6 pb-20 md:pb-0 gap-4 md:gap-6 w-full">
      
      {/* LEFT PANEL: CATALOG */}
      <div className="flex-1 flex flex-col min-h-[500px] md:min-h-0 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all outline-none"
              placeholder="Tìm dịch vụ..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30" onScroll={handleScroll}>
          {loadingCatalog && page === 1 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
              <p>Không tìm thấy dịch vụ nào</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      <span className="material-symbols-outlined">medical_services</span>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1 flex-1">
                      {item.item_name}
                    </h4>
                    <div className="text-primary font-bold text-[13px] sm:text-sm truncate mt-auto">
                      {formatCurrency(item.service_prices?.[0]?.base_price || 0)}
                    </div>
                  </div>
                ))}
              </div>
              
              {isLoadingMore && (
                <div className="flex justify-center items-center p-4 mt-2">
                   <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART / INVOICE */}
      <div className="w-full md:w-[320px] lg:w-[400px] xl:w-[450px] bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col shrink-0 min-h-[500px] md:h-full">
        {/* Customer Selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Khách Hàng</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold shadow-sm">
                  {selectedCustomer.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{selectedCustomer.full_name}</div>
                  <div className="text-xs text-slate-500">{selectedCustomer.phone_number || 'Chưa có SĐT'}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 rounded-full hover:bg-white text-slate-400 hover:text-error flex items-center justify-center transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
              <input
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all outline-none shadow-sm"
                placeholder="Tìm khách hàng..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              
              {customerSearch && customers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {customers.map(cus => (
                    <div 
                      key={cus.id}
                      onClick={() => {
                        setSelectedCustomer(cus);
                        setCustomerSearch('');
                        setCustomers([]);
                      }}
                      className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{cus.full_name}</div>
                        <div className="text-xs text-slate-500">{cus.phone_number || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Giỏ Hàng ({cartItems.length})</label>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
              <p className="text-sm">Chưa có dịch vụ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={`${item.type}-${item.id}`} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50 gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">{item.name}</div>
                    <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-error transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <div className="mt-1">
                    <select 
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:border-primary outline-none"
                      value={item.doctor_id || ''}
                      onChange={(e) => updateItemDoctor(index, e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">-- Chọn bác sĩ --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>BS. {d.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-primary font-bold text-sm">{formatCurrency(item.price)}</div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                      <button onClick={() => updateQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600">
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-3 bg-amber-50/50 border-t border-amber-100/50 shrink-0">
            <button 
              onClick={() => setIsRecommendationsExpanded(!isRecommendationsExpanded)}
              className="w-full flex items-center justify-between text-amber-600 font-semibold text-xs uppercase tracking-wider group outline-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-500 group-hover:scale-110 transition-transform">lightbulb</span>
                Lời khuyên ({recommendations.length})
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${isRecommendationsExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            
            {isRecommendationsExpanded && (
              <div className="space-y-2 mt-3 max-h-[160px] overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {recommendations.map(rec => (
                  <div key={rec.id} className="bg-white rounded-lg p-2.5 border border-amber-100 shadow-sm flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">
                      {rec.type === 'PROMO' ? 'local_offer' : 'swap_horiz'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{rec.title}</div>
                      <div className="text-xs text-slate-600 leading-snug">{rec.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Tạm tính</span>
              <span className="text-slate-700 font-semibold">{formatCurrency(subTotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm mt-1 mb-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium hover:text-primary transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoPromo} 
                  onChange={(e) => setAutoPromo(e.target.checked)} 
                  className="w-4 h-4 accent-primary rounded border-slate-300 focus:ring-primary"
                />
                Tự động áp dụng KM
              </label>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">loyalty</span>
                Giảm giá
              </span>
              <div className="text-right">
                <span className="text-emerald-600 font-semibold block">- {formatCurrency(totalDiscount)}</span>
                {appliedPromotions.length > 0 && appliedPromotions.map((p: any, i: number) => (
                  <div key={i} className="flex justify-end gap-3 text-emerald-500/90 text-[12px] italic mt-1.5 items-start">
                    <span className="text-right flex-1 leading-snug">{p.name} {p.giftText ? `(Tặng: ${p.giftText})` : ''}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {p.amount > 0 ? `- ${formatCurrency(p.amount)}` : p.amount < 0 ? `+ ${formatCurrency(Math.abs(p.amount))}` : 'Quà tặng'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-bold">Thành tiền</span>
              <span className="text-2xl font-black text-primary drop-shadow-sm">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
          
          <button 
            disabled={cartItems.length === 0 || !selectedCustomer || isCheckingOut}
            onClick={handleCheckoutClick}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">payments</span>
            )}
            Thanh Toán
          </button>
          
          {!selectedCustomer && cartItems.length > 0 && (
            <p className="text-xs text-error text-center mt-2 font-medium">Vui lòng chọn khách hàng để thanh toán!</p>
          )}
        </div>
      </div>

      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onSuccess={(cus?: any) => {
          if (cus) setSelectedCustomer(cus);
        }} 
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        finalTotal={finalTotal}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
}
