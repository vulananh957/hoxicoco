import React from 'react';

// --- Icons (Inline SVG for portability) ---

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

// --- Component Definition ---

const PrivacyPolicy: React.FC = () => {
  // Allow scrolling on this page (body has overflow:hidden globally)
  React.useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Styles based on design system
  const styles = {
    // Colors
    textHeading: "text-[#03045E]",
    textBody: "text-[#023E8A]",
    highlight: "text-[#00B4D8]",
    bgMain: "bg-[#CAF0F8]",
    bgCard: "bg-[#FFFFFF]",
    bgSection: "bg-[#90E0EF]",
    
    // UI Elements
    shadowSoft: "shadow-[0_10px_40px_-10px_rgba(0,180,216,0.3)]",
    cardBase: "bg-[#FFFFFF] rounded-2xl md:rounded-3xl p-6 md:p-10 mb-8 border border-white/50",
    sectionTitle: "text-xl md:text-2xl font-bold text-[#03045E] mb-4 flex items-center gap-3",
    subHeading: "font-semibold text-[#03045E] block mb-1",
  };

  return (
    <div className={`min-h-screen ${styles.bgMain} font-sans selection:bg-[#00B4D8] selection:text-white`}>
      
      {/* --- Navigation / Back Button --- */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button 
          onClick={() => window.history.back()}
          className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ease-out group
            bg-white/60 backdrop-blur-md border border-white/40 shadow-sm
            hover:bg-white/80 hover:border-[#00B4D8]/30 hover:shadow-md hover:scale-105
            active:scale-95 ${styles.textBody}`}
        >
          <ArrowLeftIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span>Quay lại</span>
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        
        {/* --- Header Section --- */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-white shadow-sm mb-6">
            <ShieldCheckIcon className="w-10 h-10 text-[#00B4D8]" />
          </div>
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold ${styles.textHeading} leading-tight mb-4`}>
            CHÍNH SÁCH QUYỀN RIÊNG TƯ <br className="hidden md:block"/> & ĐIỀU KHOẢN PHÁP LÝ
          </h1>
          <div className="space-y-2">
            <p className={`text-lg md:text-xl font-bold text-[#03045E]`}>
              Dự án: Hoxicoco – Giải pháp số hỗ trợ tiện ích đô thị
            </p>
            <p className={`text-sm ${styles.textBody} opacity-80`}>
              Cập nhật lần cuối: Ngày 01 tháng 02 năm 2026
            </p>
          </div>
        </header>

        {/* --- Intro Section --- */}
        <div className={`${styles.cardBase} ${styles.shadowSoft}`}>
          <div className="flex items-start gap-4">
            <InfoIcon className="w-6 h-6 text-[#00B4D8] flex-shrink-0 mt-1" />
            <p className={`${styles.textBody} text-lg leading-relaxed`}>
              <span className="font-bold">Chào mừng bạn đến với Hoxicoco.</span> Website này được vận hành nhằm mục đích cung cấp thông tin, hỗ trợ cộng đồng tìm kiếm các vị trí vệ sinh công cộng (NVSCC) và không gian chỉnh trang cá nhân. Khi bạn truy cập và sử dụng dịch vụ của chúng tôi, bạn được hiểu là đã đọc, hiểu và mặc nhiên chấp thuận toàn bộ các nội dung dưới đây.
            </p>
          </div>
        </div>

        {/* --- Main Content Sections --- */}
        <div className="space-y-6 md:space-y-8">

          {/* SECTION 1 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#1</span>
              TUYÊN BỐ BẢN CHẤT VÀ MỤC ĐÍCH DỰ ÁN
            </h2>
            <div className={`space-y-4 ${styles.textBody} leading-relaxed`}>
              <div>
                <span className={styles.subHeading}>Bản chất:</span>
                Hoxicoco là nền tảng bản đồ số phi lợi nhuận, hoạt động theo mô hình đóng góp cộng đồng (Crowdsourcing). Chúng tôi không sở hữu, không quản lý và không trực tiếp vận hành bất kỳ địa điểm vệ sinh nào được liệt kê trên hệ thống.
              </div>
              <div>
                <span className={styles.subHeading}>Mục tiêu:</span>
                Dự án hướng tới thúc đẩy văn minh đô thị và hỗ trợ du lịch. Hoxicoco không thay thế chức năng quản lý, vận hành các công trình công cộng của các cơ quan Nhà nước hay các đơn vị môi trường đô thị.
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#2</span>
              ĐIỀU KHOẢN MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)
            </h2>
            <p className={`${styles.textBody} mb-4 italic opacity-90`}>
              Ban quản trị (BQT) Hoxicoco miễn trừ toàn bộ trách nhiệm đối với các rủi ro phát sinh từ hành vi sử dụng dịch vụ của người dùng:
            </p>
            <ul className={`space-y-4 ${styles.textBody} leading-relaxed list-none pl-0`}>
              <li className="bg-[#CAF0F8]/30 p-4 rounded-xl border border-[#CAF0F8]">
                <span className={styles.subHeading}>Tính xác thực:</span>
                Toàn bộ dữ liệu (vị trí, hình ảnh, đánh giá) do người dùng cung cấp tự nguyện. BQT không cam kết về tính xác thực thời gian thực và miễn trừ trách nhiệm đối với các trường hợp địa điểm đóng cửa, ngưng hoạt động, thay đổi chi phí hoặc thay đổi công năng mà chưa kịp cập nhật.
              </li>
              <li className="bg-[#CAF0F8]/30 p-4 rounded-xl border border-[#CAF0F8]">
                <span className={styles.subHeading}>Quyền quản lý:</span>
                Hoxicoco tôn trọng tuyệt đối quyền quản lý và nội quy tại các điểm thuộc sở hữu Nhà nước, khu vực an ninh hoặc đơn vị tư nhân (Tòa nhà, Quán kinh doanh...). Việc hiển thị vị trí không đồng nghĩa với việc người dùng được quyền vi phạm nội quy của đơn vị quản lý tại điểm đó.
              </li>
              <li className="bg-[#CAF0F8]/30 p-4 rounded-xl border border-[#CAF0F8]">
                <span className={styles.subHeading}>An toàn và thiệt hại:</span>
                BQT miễn trừ mọi trách nhiệm đối với các tổn thất, thiệt hại (trực tiếp hoặc gián tiếp) liên quan đến sức khỏe, tài sản hoặc an toàn cá nhân của người dùng trong quá trình di chuyển đến hoặc sử dụng các địa điểm gợi ý.
              </li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#3</span>
              CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN
            </h2>
            <p className={`${styles.textBody} mb-4`}>
              Chúng tôi cam kết bảo vệ dữ liệu cá nhân theo các tiêu chuẩn hiện hành:
            </p>
            <div className={`grid md:grid-cols-1 gap-6 ${styles.textBody} leading-relaxed`}>
              <div>
                <span className={styles.subHeading}>Sự chấp thuận:</span>
                Bằng việc đăng nhập qua Google OAuth 2.0, người dùng đồng ý cho Hoxicoco xử lý các dữ liệu cơ bản (Tên hiển thị, Email) để xác thực danh tính. Chúng tôi không lưu trữ mật khẩu của người dùng.
              </div>
              <div>
                <span className={styles.subHeading}>Dữ liệu vị trí (GPS):</span>
                Website yêu cầu truy cập vị trí chỉ để hiển thị các điểm gần bạn nhất tại thời điểm sử dụng. Dữ liệu này không được lưu trữ vĩnh viễn trên máy chủ cho mục đích theo dõi cá nhân hay xây dựng hồ sơ di chuyển.
              </div>
              <div>
                <span className={styles.subHeading}>Sử dụng và Chia sẻ:</span>
                Thông tin chỉ dùng để cải thiện chất lượng dịch vụ và ngăn chặn hành vi phá hoại. Chúng tôi cam kết không bán hoặc chia sẻ dữ liệu của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.
              </div>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#4</span>
              QUY ĐỊNH VỀ NỘI DUNG VÀ ĐẠO ĐỨC
            </h2>
            <p className={`${styles.textBody} mb-4`}>
              Để bảo vệ trật tự công cộng và thuần phong mỹ tục, người dùng cam kết:
            </p>
            <div className={`space-y-4 ${styles.textBody} leading-relaxed`}>
              <div className="flex gap-3">
                <div className="min-w-[4px] bg-[#00B4D8] rounded-full"></div>
                <div>
                  <span className={styles.subHeading}>Cấm tuyệt đối:</span>
                  Đăng tải hình ảnh, video nhạy cảm, vi phạm quyền riêng tư cá nhân tại các khu vực nhạy cảm hoặc nội dung xuyên tạc, bôi nhọ uy tín của các tổ chức Nhà nước và đơn vị quản lý. Mọi hành vi vi phạm sẽ bị phối hợp với cơ quan chức năng xử lý theo pháp luật.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="min-w-[4px] bg-[#00B4D8] rounded-full"></div>
                <div>
                  <span className={styles.subHeading}>Tính trung thực:</span>
                  Người dùng chịu trách nhiệm trước pháp luật về tính khách quan và trung thực của các bài đánh giá. Nghiêm cấm hành vi gây rối trật tự công cộng hoặc xâm phạm lợi ích hợp pháp của tổ chức, cá nhân.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="min-w-[4px] bg-[#00B4D8] rounded-full"></div>
                <div>
                  <span className={styles.subHeading}>Quyền kiểm duyệt:</span>
                  BQT có toàn quyền xóa bỏ các nội dung bị báo cáo vi phạm hoặc gây ảnh hưởng xấu mà không cần thông báo trước.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#5</span>
              QUYỀN SỞ HỮU TRÍ TUỆ VÀ TRÍ TUỆ NHÂN TẠO
            </h2>
            <div className={`space-y-4 ${styles.textBody} leading-relaxed`}>
              <p>
                Thương hiệu, thiết kế, logo và cấu trúc mã nguồn thuộc quyền sở hữu độc quyền của dự án Hoxicoco. Nghiêm cấm hành vi sao chép, trích xuất dữ liệu cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.
              </p>
              <p>
                Các thuật toán đánh giá được thiết kế để phản ánh khách quan phản hồi cộng đồng, không can thiệp vào uy tín vốn có của các công trình quản lý bởi Nhà nước.
              </p>
            </div>
          </section>

          {/* SECTION 6 */}
          <section className={`${styles.cardBase} ${styles.shadowSoft}`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#6</span>
              QUAN HỆ VỚI CÁC TỔ CHỨC NHÀ NƯỚC VÀ CẬP NHẬT
            </h2>
            <div className={`space-y-4 ${styles.textBody} leading-relaxed`}>
              <div>
                <span className={styles.subHeading}>Hợp tác công ích:</span>
                Hoxicoco sẵn sàng kết nối và chia sẻ dữ liệu cộng đồng để hỗ trợ các cơ quan chức năng nâng cao chất lượng dịch vụ đô thị.
              </div>
              <div>
                <span className={styles.subHeading}>Điều chỉnh dữ liệu:</span>
                Chúng tôi cam kết tiếp nhận và thực hiện điều chỉnh hoặc gỡ bỏ thông tin ngay lập tức theo yêu cầu bằng văn bản của cơ quan Nhà nước nếu thông tin ảnh hưởng đến an ninh, trật tự hoặc cảnh quan.
              </div>
              <div>
                <span className={styles.subHeading}>Sửa đổi điều khoản:</span>
                BQT có quyền cập nhật các điều khoản này bất kỳ lúc nào để phù hợp với thay đổi pháp luật và thực tế vận hành.
              </div>
            </div>
          </section>

          {/* SECTION 7 - CONTACT */}
          <section className={`${styles.cardBase} ${styles.shadowSoft} border-2 border-[#00B4D8]/20`}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.highlight}>#7</span>
              THÔNG TIN LIÊN HỆ VÀ KHIẾU NẠI
            </h2>
            <p className={`${styles.textBody} leading-relaxed mb-6`}>
              Nếu bạn là chủ sở hữu địa điểm hoặc đại diện cơ quan chức năng có yêu cầu điều chỉnh thông tin, vui lòng liên hệ:
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-xl shadow-md border border-[#00B4D8]">
              <div className="bg-[#CAF0F8] p-3 rounded-full">
                <MailIcon className="w-6 h-6 text-[#00B4D8]" />
              </div>
              <div className="text-center sm:text-left">
                <p className={`text-sm ${styles.textHeading} font-bold mb-1`}>Email (Đội ngũ Phát triển)</p>
                <a 
                  href="mailto:al.squared.la@gmail.com" 
                  className={`text-lg md:text-xl font-medium ${styles.highlight} hover:underline decoration-2 underline-offset-4`}
                >
                  al.squared.la@gmail.com
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* --- Footer Note --- */}
        <footer className="mt-12 text-center">
          <p className={`${styles.textBody} text-sm md:text-base opacity-80 max-w-2xl mx-auto`}>
            Sử dụng Hoxicoco đồng nghĩa với việc bạn đã xác nhận và đồng ý với các chính sách trên.
          </p>
          <div className="mt-8 flex justify-center">
             <div className="w-16 h-1 bg-[#00B4D8] rounded-full opacity-50"></div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default PrivacyPolicy;