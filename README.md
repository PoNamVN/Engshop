# Engshop - Interactive 3D Panoramic Storefront Clone

Một trang web thương mại điện tử kết hợp không gian 3D tương tác toàn cảnh (3D Panoramic Storefront), được lấy cảm hứng từ phong cách nghệ thuật độc đáo của KidSuper. Dự án sử dụng React, React Three Fiber (Three.js) và Framer Motion để mang lại trải nghiệm nhập vai cinematic mượt mà.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. Hiệu Ứng Chuyển Cảnh Cinematic (Cinematic Entry Transition)
* Khi nhấn vào cửa để bước vào cửa hàng, bức tranh vẽ phác thảo đen trắng (charcoal sketch) sẽ kích hoạt hiệu ứng tan biến và phóng to (zoom-in transition) cực kỳ mượt mà để lộ ra không gian cửa hàng 3D rực rỡ bên trong.

### 2. Không Gian Cửa Hàng 3D Toàn Cảnh (3D Panoramic Storefront)
* Sử dụng một ống xi lanh 3D (Cylindrical Panorama) để dựng không gian hiển thị cửa hàng 3D 360 độ, cho phép người dùng dùng chuột xoay và khám phá xung quanh.

### 3. Điểm Tương Tác Sản Phẩm 3D (Interactive 3D Hotspots)
* Các sản phẩm thời trang (Jacket, Hat, Shoes) được đặt trực tiếp trong không gian 3D.
* Khi di chuột (hover) vào sản phẩm: sản phẩm sẽ tự động phóng to nhẹ, hiển thị đường viền phát sáng (glowing outline) và con trỏ chuột đổi thành hình ngón tay chỉ trỏ thủ công.

### 4. Bảng Thông Tin Sản Phẩm Cổ Điển (Vintage Product Popup Card)
* Nhấp vào sản phẩm sẽ mở ra một bảng thông tin chi tiết được thiết kế theo phong cách giấy da cổ điển (vintage paper/parchment).
* Nền phía sau sản phẩm được làm mờ và tối đi tinh tế bằng hiệu ứng `backdrop-filter: blur()`.
* Hiệu ứng xuất hiện/biến mất của popup được tối ưu hóa mượt mà bằng `Framer Motion`.

### 5. Lối Thoát Bức Tranh Nghệ Thuật (Double-Click Exit Artwork)
* Bức tranh lớn ở trung tâm cửa hàng đóng vai trò là điểm quay lại. Người dùng cần **Double Click** (nhấp đúp chuột) vào bức tranh này để kích hoạt hiệu ứng thu nhỏ (zoom-out) kèm chớp trắng (white flash exit) để quay trở lại sảnh chờ ban đầu.

### 6. Trình Chỉnh Sửa Tọa Độ Hotspot (Built-in Hotspot Coordinate Editor)
* Nhấn phím **`E`** trên bàn phím để bật/tắt bảng điều khiển tọa độ trực quan ngay trên giao diện.
* Cho phép nhà phát triển tinh chỉnh góc xoay (`Angle`), chiều cao (`Height`) và khoảng cách (`Distance`) của từng sản phẩm trong không gian hình trụ.
* Các tọa độ sau khi chỉnh sửa sẽ tự động lưu lại vào `localStorage` giúp giữ nguyên vị trí khi tải lại trang.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend Framework**: React 19, Vite (cho tốc độ khởi động cực nhanh và HMR mượt mà).
* **3D Rendering**: Three.js, `@react-three/fiber` (R3F) & `@react-three/drei`.
* **Animations**: `framer-motion` cho các hiệu ứng chuyển động của UI và popup.
* **Styling**: Vanilla CSS cho độ linh hoạt và khả năng kiểm soát tối đa các hiệu ứng tùy biến cao.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Clone dự án về máy
```bash
git clone <URL_GITHUB_CUA_BAN>
cd engshop
```

### 2. Cài đặt các thư viện phụ thuộc (Dependencies)
```bash
npm install
```

### 3. Chạy dự án ở môi trường phát triển (Local Development)
```bash
npm run dev
```
Truy cập vào địa chỉ mặc định `http://localhost:5173` trên trình duyệt để trải nghiệm ứng dụng.

### 4. Build sản phẩm hoàn chỉnh (Production Build)
```bash
npm run build
```
Thư mục `dist` chứa các file tĩnh đã tối ưu hóa sẽ được tạo ra, sẵn sàng để deploy lên Vercel, Netlify hoặc GitHub Pages.
