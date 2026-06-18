# Báo cáo Tổng hợp Schema Database & Phân tích Cột thừa

Tài liệu này tổng hợp cấu trúc các bảng và cột đang có trong Database theo Prisma Schema (`schema.prisma`) và phân tích những cột hiện không được dùng hoặc rất hiếm khi được sử dụng trong codebase, có thể được coi là "thừa".

---

## 1. Tổng hợp Các bảng & Cột

### Khách hàng & Nhân viên
- **customers** (Khách hàng)
  - `id`, `full_name`, `phone_number`, `date_of_birth`, `gender`, `occupation`, `customer_type`, `created_at`
- **employees** (Nhân viên)
  - `id`, `employee_code`, `full_name`, `email`, `phone_number`, `role`, `branch_id`, `username`, `password_hash`, `status`, `created_at`

### Chi nhánh & Lịch hẹn
- **branches** (Chi nhánh)
  - `id`, `branch_code`, `branch_name`, `address`, `is_active`, `created_at`, `updated_at`
- **appointments** (Lịch hẹn)
  - `id`, `customer_id`, `service_id`, `branch_id`, `employee_id`, `appointment_time`, `status`, `notes`, `created_at`

### Dịch vụ & Danh mục
- **service_categories** (Danh mục dịch vụ)
  - `id`, `parent_id`, `category_code`, `category_name`, `category_level`, `display_order`, `created_at`
- **services** (Dịch vụ)
  - `id`, `category_id`, `service_group_code`, `item_code`, `item_name`, `unit`, `tags`, `duration_minutes`, `is_active`, `created_at`, `updated_at`
- **service_prices** (Giá dịch vụ)
  - `id`, `service_id`, `branch_id`, `price_type`, `base_price`, `effective_date`, `end_date`, `is_current`

### Hóa đơn & Thanh toán
- **invoices** (Hóa đơn)
  - `id`, `customer_id`, `branch_id`, `consultant_id`, `total_original_price`, `total_discount`, `final_price`, `amount_paid`, `status`, `created_at`
- **invoice_items** (Chi tiết hóa đơn)
  - `id`, `invoice_id`, `service_id`, `doctor_id`, `quantity`, `base_price`, `discount_amount`, `final_price`, `applied_rule_id`, `created_at`
- **invoice_payments** (Thanh toán hóa đơn)
  - `id`, `invoice_id`, `amount`, `payment_method`, `payment_date`, `cashier_id`

### Khuyến mãi & Combo (Promotions)
- **promotions** (Chương trình khuyến mãi)
  - `id`, `promotion_name`, `promotion_type`, `start_date`, `end_date`, `applicable_days`, `max_discount_percent_cap`, `is_stackable`, `description`, `is_active`, `created_at`, `updated_at`
- **promotion_branches** (Khuyến mãi - Chi nhánh)
  - `promotion_id`, `branch_id`
- **promotion_categories** (Khuyến mãi - Danh mục)
  - `promotion_id`, `category_id`
- **voucher_tiers** (Mốc nhận Voucher)
  - `id`, `promotion_id`, `min_bill_amount`, `voucher_value`, `voucher_duration_days`
- **combos** (Combo Dịch vụ)
  - `id`, `promotion_id`, `combo_name`, `original_total_price`, `combo_price`, `allow_extra_rules`, `max_slots`, `is_active`, `created_at`
- **combo_items** (Chi tiết Combo)
  - `id`, `combo_id`, `service_id`, `quantity`, `allocated_price`, `item_description`

### Quy tắc & Điều kiện (Rules)
- **promo_rules** (Quy tắc khuyến mãi)
  - `id`, `promotion_id`, `rule_name`, `is_exclusive_rule`, `is_stackable_with_others`, `max_applications`, `created_at`
- **rule_conditions** (Điều kiện áp dụng)
  - `id`, `rule_id`, `condition_group`, `criteria_type`, `operator`, `value_num`, `value_num_max`, `value_text`, `target_service_id`, `target_category_id`
- **rule_rewards** (Phần thưởng)
  - `id`, `rule_id`, `reward_type`, `reward_value`, `target_service_id`, `gift_description`, `voucher_duration_days`, `installment_months`, `installment_rate`, `recurring_interval_months`

---

## 2. Phân tích Các cột Bị Thừa (Không/Ít được sử dụng)

Dựa trên việc kiểm tra toàn bộ mã nguồn React (`src/`), một số trường được định nghĩa trong Database tuy nhiên lại không xuất hiện (hoặc xuất hiện nhưng chưa được gắn logic xử lý hoàn chỉnh) trong giao diện và logic hiện tại. Đây là các cột có thể được coi là "bị thừa":

> [!WARNING]
> Những cột dưới đây đang tồn tại trong Database nhưng không có tính năng thực sự trên UI hoặc Logic tính toán POS. Nếu không có định hướng dùng trong tương lai, bạn có thể xóa để làm gọn cấu trúc Database.

### Bảng `services` (Dịch vụ)
1. **`tags`** (Json)
   - Hoàn toàn không được sử dụng để phân tích, tìm kiếm hay hiển thị ở bảng Dịch Vụ.
2. **`duration_minutes`** (Int)
   - Thời gian thực hiện dịch vụ. UI hoàn toàn không lấy trường này ra và cũng chưa có tính năng nào như tính toán lịch hẹn sử dụng cột này.
3. **`service_group_code`** (String)
   - Chỉ được dùng rất hy hữu để thay thế `category_name` nếu thiếu, nhưng phần lớn danh mục đã có tên, vì vậy `group_code` là thừa và gây lặp dữ liệu với `categories`.

### Bảng `service_categories` (Danh mục)
4. **`display_order`** (Int)
   - Không được dùng trong bất cứ câu query `orderBy` nào trong mã nguồn để sắp xếp hiển thị các danh mục.

### Bảng `combos` & `combo_items` (Combo)
5. **`combos.allow_extra_rules`** (Boolean)
   - Hiện tại logic POS không cho phép cộng dồn khuyến mãi vào combo hoặc nó đã được quản lý bằng `is_stackable`, nên cột này trong combos không dùng tới.
6. **`combos.max_slots`** (Int)
   - Giới hạn lượt mua combo, không thấy logic ràng buộc đếm số lần sử dụng trong giỏ hàng (`pos.ts`).
7. **`combo_items.allocated_price`** (Decimal) & **`combo_items.item_description`** (String)
   - Giá được phân bổ trên mỗi chi tiết combo và mô tả ngắn. POS UI chỉ hiển thị tổng giá combo và không dùng các thông tin này ở các item riêng lẻ trong combo.

### Bảng `rule_rewards` (Phần thưởng khuyến mãi)
8. Các cấu hình trả góp & trả dần: **`installment_months`**, **`installment_rate`**, **`recurring_interval_months`**
   - Đã được định nghĩa trong schema và action nhưng trên UI Modal Quản lý Quy Tắc Khuyến Mãi không có trường để nhập thông tin về trả góp.
9. **`gift_description`** (String) & **`voucher_duration_days`** (Int)
   - Không được nhập liệu hay tính toán hiển thị cụ thể khi trả về POS. Khuyến mãi kiểu `FREE_SERVICE` hay Voucher hiện chỉ dùng `target_service_id` và `reward_value`.

### Bảng `employees` (Nhân viên)
10. **`username`** & **`password_hash`** (String)
    - Nếu dự án dự kiến không tự build hệ thống login riêng cho nhân viên hoặc đang dùng nền tảng ngoài (NextAuth qua email/phone), thì các cột lưu thông tin user/pass này có thể không cần thiết. Trừ khi hệ thống có module Login riêng đang được lên kế hoạch.
