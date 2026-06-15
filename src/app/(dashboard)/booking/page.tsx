'use client';

import { useState, useEffect } from 'react';
import { getAppointments, createAppointment } from '@/app/actions/appointments';
import { getCustomers } from '@/app/actions/customers';
import { getServices } from '@/app/actions/services';
import { getDoctors } from '@/app/actions/employees';
import CustomerModal from '@/components/custom/CustomerModal';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Appointment State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time Slots generation (8:00 to 20:00, 30 mins)
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 19; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await getAppointments(selectedDate);
      setAppointments(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSvcAndDocs = async () => {
      try {
        const [resSvc, resDocs] = await Promise.all([
          getServices(1, 100, ''),
          getDoctors()
        ]);
        setServices(resSvc.services);
        setDoctors(resDocs);
      } catch (e) {}
    };
    fetchSvcAndDocs();
  }, []);

  useEffect(() => {
    const fetchCus = async () => {
      if (!customerSearch) {
        setCustomers([]);
        return;
      }
      try {
        const res = await getCustomers(1, 10, customerSearch);
        setCustomers(res.customers);
      } catch (err) {}
    };
    const timer = setTimeout(fetchCus, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const getAppointmentForSlot = (timeString: string) => {
    return appointments.find(app => {
      const d = new Date(app.appointment_time);
      const slotTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return slotTime === timeString;
    });
  };

  const handleCreateAppointment = async () => {
    if (!selectedCustomer) return alert("Vui lòng chọn khách hàng!");
    if (!selectedSlot) return alert("Vui lòng chọn khung giờ!");

    const [h, m] = selectedSlot.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(h, m, 0, 0);

    setIsSubmitting(true);
    try {
      const res = await createAppointment({
        customerId: selectedCustomer.id,
        serviceId: selectedServiceId ? Number(selectedServiceId) : undefined,
        employeeId: selectedDoctorId ? Number(selectedDoctorId) : undefined,
        appointmentTime: appointmentDate,
        notes
      });
      if (res.success) {
        alert("Lên lịch hẹn thành công!");
        setSelectedSlot(null);
        setSelectedCustomer(null);
        setSelectedServiceId('');
        setSelectedDoctorId('');
        setNotes('');
        fetchAppointments();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-4 lg:p-6 min-h-full flex flex-col lg:flex-row gap-6 pb-20 lg:pb-6">
      {/* Left: Calendar View */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px] lg:min-h-0 lg:h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => changeDate(-1)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
              {formatDate(selectedDate)}
            </h2>
            <button onClick={() => changeDate(1)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50">
            Hôm nay
          </button>
        </div>

        {/* Slots Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {loading ? (
             <div className="flex justify-center items-center h-40">
               <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timeSlots.map(slot => {
                const appt = getAppointmentForSlot(slot);
                const isSelected = selectedSlot === slot;
                
                if (appt) {
                  return (
                    <div key={slot} className="flex border border-primary/30 rounded-xl overflow-hidden bg-primary/5 cursor-not-allowed">
                      <div className="w-20 bg-primary/10 flex items-center justify-center font-bold text-primary border-r border-primary/20 shrink-0">
                        {slot}
                      </div>
                      <div className="p-3 flex-1">
                        <div className="font-semibold text-slate-800">{appt.customers?.full_name}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {appt.services?.item_name || 'Khám tổng quát'}
                          {appt.employees ? ` • BS. ${appt.employees.full_name}` : ''}
                        </div>
                      </div>
                      <div className="px-3 flex items-center justify-center text-xs font-bold text-primary border-l border-primary/10">
                        ĐÃ ĐẶT
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={slot} 
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-20 flex items-center justify-center font-bold border-r shrink-0 ${
                      isSelected ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {slot}
                    </div>
                    <div className="p-3 flex-1 flex items-center text-slate-400 font-medium">
                      {isSelected ? <span className="text-emerald-600">Đang chọn...</span> : 'Trống'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Booking Form */}
      <div className="w-full lg:w-[350px] xl:w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col shrink-0 min-h-[500px] lg:min-h-0 lg:h-full overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit_calendar</span>
          Tạo Lịch Hẹn Mới
        </h3>

        {!selectedSlot ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-6">
            <span className="material-symbols-outlined text-5xl mb-2">touch_app</span>
            <p className="text-center font-medium">Vui lòng chọn một khung giờ "Trống" ở lịch bên trái để bắt đầu tạo.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-5">
            {/* Slot Display */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Giờ đã chọn</p>
                <p className="font-bold text-emerald-800 text-lg">{selectedSlot}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Ngày</p>
                <p className="font-semibold text-emerald-800">{selectedDate.toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            {/* Customer Search */}
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block">Khách hàng <span className="text-red-500">*</span></label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="font-semibold text-slate-800">{selectedCustomer.full_name} - {selectedCustomer.phone_number}</div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 focus:border-primary outline-none"
                    placeholder="Tìm theo Tên hoặc SĐT..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                  <button 
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                    title="Thêm khách mới"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>

                  {/* Dropdown */}
                  {customerSearch && customers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {customers.map(cus => (
                        <div 
                          key={cus.id}
                          onClick={() => { setSelectedCustomer(cus); setCustomerSearch(''); setCustomers([]); }}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                        >
                          <div className="font-semibold">{cus.full_name}</div>
                          <div className="text-xs text-slate-500">{cus.phone_number}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block">Dịch vụ (Tùy chọn)</label>
              <select 
                className="w-full h-11 px-3 rounded-xl border border-slate-300 focus:border-primary outline-none"
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value as any)}
              >
                <option value="">-- Chưa xác định / Khám tổng quát --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.item_name}</option>
                ))}
              </select>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block">Bác sĩ phụ trách (Tùy chọn)</label>
              <select 
                className="w-full h-11 px-3 rounded-xl border border-slate-300 focus:border-primary outline-none"
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value as any)}
              >
                <option value="">-- Bất kỳ bác sĩ nào --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>BS. {d.full_name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-bold text-slate-600 mb-1 block">Ghi chú</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-primary outline-none resize-none h-24 text-sm"
                placeholder="Khách dặn dò gì thêm..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 mt-auto">
              <button 
                onClick={handleCreateAppointment}
                disabled={!selectedCustomer || isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">event_available</span>}
                Chốt Lịch Hẹn
              </button>
            </div>
          </div>
        )}
      </div>
      
      <CustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onSuccess={(cus?: any) => {
          if (cus) setSelectedCustomer(cus);
        }} 
      />
    </div>
  );
}
