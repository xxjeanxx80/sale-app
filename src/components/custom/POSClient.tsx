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
  const [activeView, setActiveView] = useState<'customer' | 'catalog' | 'cart'>('customer');
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
    <div className="flex flex-col h-[calc(100vh-[60px])] md:h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden font-sans p-2 sm:p-4 md:p-6 gap-4 md:gap-6 w-full shrink-0">
      {activeView === 'customer' ? (
        <div className="flex-1 flex flex-col justify-center bg-white rounded-2xl shadow-xl border border-slate-100 p-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="w-full flex justify-center z-10">
            <div className="w-full min-w-[320px] sm:min-w-[400px] max-w-md bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.05)] border border-slate-100 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Chào Mừng Khách Hàng</h2>
                <p className="text-sm text-slate-500 mt-2">Vui lòng chọn khách hàng để bắt đầu tư vấn dịch vụ</p>
              </div>

              <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
                <input
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base transition-all outline-none"
                  placeholder="Tìm tên hoặc SĐT..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                
                {customerSearch && customers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {customers.map(cus => (
                      <div 
                        key={cus.id}
                        onClick={() => {
                          setSelectedCustomer(cus);
                          setCustomerSearch('');
                          setCustomers([]);
                          setActiveView('catalog');
                        }}
                        className="px-4 py-3 border-b border-slate-50 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 group-hover:text-primary transition-colors">{cus.full_name}</div>
                          <div className="text-xs text-slate-500">{cus.phone_number || 'Chưa có SĐT'}</div>
                        </div>
                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Khách mới
                </button>
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    setActiveView('catalog');
                  }}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">store</span>
                  Khách vãng lai
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'catalog' ? (
        <div className="flex-1 flex gap-4 h-full relative overflow-hidden">
          {/* Main Catalog Area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative min-w-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm">
                  {selectedCustomer ? selectedCustomer.full_name.charAt(0) : 'K'}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <span className="text-slate-500 font-normal">Khách hàng:</span>
                    <span className="text-primary">{selectedCustomer ? selectedCustomer.full_name : 'Khách vãng lai'}</span>
                  </div>
                  <div className="text-xs text-slate-500">{selectedCustomer ? selectedCustomer.phone_number || 'Chưa có SĐT' : 'Chưa nhập thông tin'}</div>
                </div>
                <button onClick={() => setActiveView('customer')} className="ml-2 text-xs font-medium text-slate-500 hover:text-primary transition-colors border border-slate-200 hover:border-primary/50 px-2.5 py-1.5 rounded-lg bg-white shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                  Đổi
                </button>
              </div>
              
              <div className="flex w-full sm:w-auto items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all outline-none"
                    placeholder="Tìm dịch vụ..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setActiveView('cart')}
                  className="relative h-10 px-4 rounded-xl bg-slate-800 text-white flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  <span className="font-semibold text-sm hidden sm:inline-block">Giỏ hàng</span>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-error text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cartItems.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 pb-24 md:pb-6" onScroll={handleScroll}>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {services.map(service => (
                      <div 
                        key={service.id}
                        onClick={() => addToCart(service)}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer active:scale-95 group flex flex-col p-3 md:p-4 min-h-[100px]"
                      >
                        <div className="flex-1 flex flex-col justify-between">
                          <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-3 leading-snug group-hover:text-primary transition-colors">{service.item_name}</h3>
                          <div className="mt-auto flex justify-between items-end gap-2">
                             <span className="font-bold text-primary text-sm md:text-base whitespace-nowrap">
                               {formatCurrency(service.service_prices?.[0]?.base_price || 0)}
                             </span>
                             <div className="w-7 h-7 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors border border-slate-100 group-hover:border-primary">
                               <span className="material-symbols-outlined text-[16px]">add</span>
                             </div>
                          </div>
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
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 animate-in slide-in-from-right-4 duration-300 h-full overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
          <div className="lg:flex-[2] bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col lg:h-full lg:overflow-hidden shrink-0">
            {/* Header Cart View */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveView('catalog')}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-primary transition-colors text-slate-600 shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-xl font-bold text-slate-800">Chi tiết Giỏ hàng</h2>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Customer Selected Card */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/30 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm text-lg">
                    {selectedCustomer ? selectedCustomer.full_name.charAt(0) : 'K'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Khách Hàng</div>
                    <div className="font-bold text-slate-800 text-base">{selectedCustomer ? selectedCustomer.full_name : 'Khách vãng lai'}</div>
                    <div className="text-xs text-slate-500">{selectedCustomer ? selectedCustomer.phone_number || 'Chưa có SĐT' : 'Yêu cầu nhập khách hàng trước khi thanh toán'}</div>
                  </div>
                </div>
                <button onClick={() => setActiveView('customer')} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-primary hover:border-primary/50 transition-colors flex items-center gap-1.5 text-sm font-medium shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Thay đổi
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 lg:overflow-y-auto p-4 bg-white relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Giỏ Hàng ({cartItems.length})</label>
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-300">
                    <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
                    <p className="text-sm">Chưa có dịch vụ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="bg-slate-50/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-slate-100 relative group transition-all hover:bg-slate-50 hover:shadow-sm">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-[15px] mb-2 pr-8">{item.name}</h4>
                          <div className="flex items-center">
                            <span className="material-symbols-outlined text-slate-400 text-[16px] mr-1.5">stethoscope</span>
                            <select
                              value={item.doctor_id || ''}
                              onChange={(e) => updateItemDoctor(index, e.target.value ? parseInt(e.target.value) : null)}
                              className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-700 w-full max-w-[200px]"
                            >
                              <option value="">-- Chỉ định Bác sĩ/KTV --</option>
                              {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex sm:flex-col justify-between items-end gap-3 sm:gap-2">
                          <div className="font-bold text-primary whitespace-nowrap text-[15px]">
                            {formatCurrency(item.price)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-9 shadow-sm">
                              <button onClick={() => updateQuantity(index, -1)} className="w-9 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 active:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                              </button>
                              <div className="w-10 text-center font-bold text-sm text-slate-800 border-x border-slate-200 h-full flex items-center justify-center bg-slate-50/50">
                                {item.quantity}
                              </div>
                              <button onClick={() => updateQuantity(index, 1)} className="w-9 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 active:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                              </button>
                            </div>
                            <button onClick={() => removeItem(index)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary */}
          <div className="w-full lg:w-[420px] bg-white lg:bg-slate-50 flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 rounded-2xl lg:rounded-none shadow-xl lg:shadow-none lg:rounded-r-2xl lg:h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                
                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="bg-orange-50 rounded-xl border border-orange-100 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setIsRecommendationsExpanded(!isRecommendationsExpanded)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-orange-100/50 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                        <span className="material-symbols-outlined">lightbulb</span>
                        LỜI KHUYÊN ({recommendations.length})
                      </div>
                      <span className={`material-symbols-outlined text-orange-500 transition-transform duration-300 ${isRecommendationsExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {isRecommendationsExpanded && (
                      <div className="p-3 space-y-2">
                        {recommendations.map((rec, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 text-sm border border-orange-100 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                            <div className="font-semibold text-slate-800 pr-2">{rec.message}</div>
                            {rec.suggestedServiceId && services.find(s => s.id === rec.suggestedServiceId) && (
                              <div className="flex gap-2 flex-wrap mt-1">
                                {(() => {
                                  const s = services.find(s => s.id === rec.suggestedServiceId);
                                  if (!s) return null;
                                  return (
                                    <button 
                                      key={s.id} 
                                      onClick={() => {
                                        addToCart(s);
                                        alert(`Đã thêm ${s.item_name} vào giỏ hàng!`);
                                      }}
                                      className="text-[11px] bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 border border-orange-200 hover:border-orange-500"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">add</span>
                                      {s.item_name}
                                    </button>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Tạm tính</span>
                    <span className="text-slate-800 font-semibold">{formatCurrency(subTotal)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-white shadow-sm">
                    <label className="flex items-center gap-2 text-slate-700 font-medium text-sm cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={autoPromo}
                        onChange={(e) => setAutoPromo(e.target.checked)}
                        className="w-4 h-4 text-primary focus:ring-primary rounded border-slate-300 cursor-pointer"
                      />
                      Tự động áp dụng KM
                    </label>
                  </div>
                  
                  <div className="flex justify-between items-start text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <span className="material-symbols-outlined text-[18px]">sell</span>
                      Giảm giá
                    </div>
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
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined">payments</span>
                  )}
                  Thanh Toán
                </button>
                
                {!selectedCustomer && cartItems.length > 0 && (
                  <p className="text-xs text-error text-center font-medium bg-error/10 py-2 rounded-lg mt-2">Vui lòng chọn khách hàng để thanh toán!</p>
                )}
              </div>
            </div>
          </div>
      )}

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
