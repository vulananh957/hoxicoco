import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  // Override body overflow:hidden (set in index.html for map pages)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50/50 font-sans relative">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none z-0 -top-1/2 -right-1/4"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0 -bottom-1/2 -left-1/4"></div>

      <div className="relative z-20 max-w-4xl mx-auto px-4 py-8 md:py-12 pb-16">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-primary font-bold hover:text-primary-light transition-colors bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm"
          >
            <i className="ri-arrow-left-line text-xl"></i>
            Quay lại Ứng dụng
          </Link>
          <div className="flex items-center gap-2 text-heading opacity-50">
            <i className="ri-shield-check-line text-xl"></i>
            <span className="font-bold text-sm uppercase tracking-wider hidden sm:block">Legal & Privacy</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-3xl p-6 md:p-10 lg:p-12 text-gray-700 leading-relaxed mb-8">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 border-b border-gray-100 pb-6 md:pb-8">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-heading mb-3 md:mb-4 uppercase leading-snug">
              Chính sách Quyền riêng tư<br/>và Điều khoản Pháp lý
            </h1>
            <p className="text-primary font-medium text-base md:text-lg mb-2">Dự án: Hoxicoco – Giải pháp số hỗ trợ tiện ích đô thị</p>
            <p className="text-xs md:text-sm text-gray-400 italic">Cập nhật lần cuối: Ngày 01 tháng 02 năm 2026</p>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="mb-4">
              Chào mừng bạn đến với <strong>Hoxicoco</strong>. Website này được vận hành nhằm mục đích cung cấp thông tin, hỗ trợ cộng đồng tìm kiếm các vị trí vệ sinh công cộng (NVSCC) và không gian chỉnh trang cá nhân. Khi bạn truy cập và sử dụng dịch vụ của chúng tôi, bạn được hiểu là đã đọc, hiểu và mặc nhiên chấp thuận toàn bộ các nội dung dưới đây.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">01</span>
                Tuyên bố bản chất và mục đích dự án
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p>
                  <strong className="text-body-text">Bản chất:</strong> Hoxicoco là nền tảng bản đồ số phi lợi nhuận, hoạt động theo mô hình đóng góp cộng đồng (Crowdsourcing). Chúng tôi không sở hữu, không quản lý và không trực tiếp vận hành bất kỳ địa điểm vệ sinh nào được liệt kê trên hệ thống.
                </p>
                <p>
                  <strong className="text-body-text">Mục tiêu:</strong> Dự án hướng tới thúc đẩy văn minh đô thị và hỗ trợ du lịch. Hoxicoco không thay thế chức năng quản lý, vận hành các công trình công cộng của các cơ quan Nhà nước hay các đơn vị môi trường đô thị.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">02</span>
                Điều khoản miễn trừ trách nhiệm (Disclaimer)
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p className="mb-2">Ban quản trị (BQT) Hoxicoco miễn trừ toàn bộ trách nhiệm đối với các rủi ro phát sinh từ hành vi sử dụng dịch vụ của người dùng:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                  <li>
                    <strong className="text-body-text">Tính xác thực:</strong> Toàn bộ dữ liệu (vị trí, hình ảnh, đánh giá) do người dùng cung cấp tự nguyện. BQT không cam kết về tính xác thực thời gian thực và miễn trừ trách nhiệm đối với các trường hợp địa điểm đóng cửa, ngưng hoạt động, thay đổi chi phí hoặc thay đổi công năng mà chưa kịp cập nhật.
                  </li>
                  <li>
                    <strong className="text-body-text">Quyền quản lý:</strong> Hoxicoco tôn trọng tuyệt đối quyền quản lý và nội quy tại các điểm thuộc sở hữu Nhà nước, khu vực an ninh hoặc đơn vị tư nhân (Tòa nhà, Quán kinh doanh...). Việc hiển thị vị trí không đồng nghĩa với việc người dùng được quyền vi phạm nội quy của đơn vị quản lý tại điểm đó.
                  </li>
                  <li>
                    <strong className="text-body-text">An toàn và thiệt hại:</strong> BQT miễn trừ mọi trách nhiệm đối với các tổn thất, thiệt hại (trực tiếp hoặc gián tiếp) liên quan đến sức khỏe, tài sản hoặc an toàn cá nhân của người dùng trong quá trình di chuyển đến hoặc sử dụng các địa điểm gợi ý.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">03</span>
                Chính sách bảo vệ dữ liệu cá nhân
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p className="mb-2">Chúng tôi cam kết bảo vệ dữ liệu cá nhân theo các tiêu chuẩn hiện hành:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                  <li>
                    <strong className="text-body-text">Sự chấp thuận:</strong> Bằng việc đăng nhập qua Google OAuth 2.0, người dùng đồng ý cho Hoxicoco xử lý các dữ liệu cơ bản (Tên hiển thị, Email) để xác thực danh tính. Chúng tôi không lưu trữ mật khẩu của người dùng.
                  </li>
                  <li>
                    <strong className="text-body-text">Dữ liệu vị trí (GPS):</strong> Website yêu cầu truy cập vị trí chỉ để hiển thị các điểm gần bạn nhất tại thời điểm sử dụng. Dữ liệu này không được lưu trữ vĩnh viễn trên máy chủ cho mục đích theo dõi cá nhân hay xây dựng hồ sơ di chuyển.
                  </li>
                  <li>
                    <strong className="text-body-text">Sử dụng và Chia sẻ:</strong> Thông tin chỉ dùng để cải thiện chất lượng dịch vụ và ngăn chặn hành vi phá hoại. Chúng tôi cam kết không bán hoặc chia sẻ dữ liệu của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.
                  </li>
                </ul>
              </div>
            </section>

             {/* Section 4 */}
             <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">04</span>
                Quy định về Nội dung và Đạo đức
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p className="mb-2">Để bảo vệ trật tự công cộng và thuần phong mỹ tục, người dùng cam kết:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                  <li>
                    <strong className="text-body-text">Cấm tuyệt đối:</strong> Đăng tải hình ảnh, video nhạy cảm, vi phạm quyền riêng tư cá nhân tại các khu vực nhạy cảm hoặc nội dung xuyên tạc, bôi nhọ uy tín của các tổ chức Nhà nước và đơn vị quản lý. Mọi hành vi vi phạm sẽ bị phối hợp với cơ quan chức năng xử lý theo pháp luật.
                  </li>
                  <li>
                    <strong className="text-body-text">Tính trung thực:</strong> Người dùng chịu trách nhiệm trước pháp luật về tính khách quan và trung thực của các bài đánh giá. Nghiêm cấm hành vi gây rối trật tự công cộng hoặc xâm phạm lợi ích hợp pháp của tổ chức, cá nhân.
                  </li>
                  <li>
                    <strong className="text-body-text">Quyền kiểm duyệt:</strong> BQT có toàn quyền xóa bỏ các nội dung bị báo cáo vi phạm hoặc gây ảnh hưởng xấu mà không cần thông báo trước.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">05</span>
                Quyền Sở hữu trí tuệ và Trí tuệ nhân tạo
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p>
                Thương hiệu, thiết kế, logo và cấu trúc mã nguồn thuộc quyền sở hữu độc quyền của dự án Hoxicoco. Nghiêm cấm hành vi sao chép, trích xuất dữ liệu cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.
                </p>
                <p>
                Các thuật toán đánh giá được thiết kế để phản ánh khách quan phản hồi cộng đồng, không can thiệp vào uy tín vốn có của các công trình quản lý bởi Nhà nước.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">06</span>
                Quan hệ với các tổ chức Nhà nước và Cập nhật
              </h2>
              <div className="pl-0 md:pl-10 space-y-2">
                <p>
                  <strong className="text-body-text">Hợp tác công ích:</strong> Hoxicoco sẵn sàng kết nối và chia sẻ dữ liệu cộng đồng để hỗ trợ các cơ quan chức năng nâng cao chất lượng dịch vụ đô thị.
                </p>
                <p>
                  <strong className="text-body-text">Điều chỉnh dữ liệu:</strong> Chúng tôi cam kết tiếp nhận và thực hiện điều chỉnh hoặc gỡ bỏ thông tin ngay lập tức theo yêu cầu bằng văn bản của cơ quan Nhà nước nếu thông tin ảnh hưởng đến an ninh, trật tự hoặc cảnh quan.
                </p>
                <p>
                  <strong className="text-body-text">Sửa đổi điều khoản:</strong> BQT có quyền cập nhật các điều khoản này bất kỳ lúc nào để phù hợp với thay đổi pháp luật và thực tế vận hành.
                </p>
              </div>
            </section>

             {/* Section 7 */}
             <section>
              <h2 className="text-xl font-bold text-heading mb-3 flex items-start gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">07</span>
                Thông tin liên hệ và Khiếu nại
              </h2>
              <div className="pl-0 md:pl-10 space-y-4">
                <p>
                  Nếu bạn là chủ sở hữu địa điểm hoặc đại diện cơ quan chức năng có yêu cầu điều chỉnh thông tin, vui lòng liên hệ:
                </p>
                <div className="bg-bg-main p-4 rounded-xl border border-primary/20 flex items-center gap-3 hover:border-primary/40 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                        <i className="ri-mail-send-line text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-bold">Email (Đội ngũ Phát triển)</p>
                        <a href="mailto:al.squared.la@gmail.com" className="text-primary font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded px-1" tabIndex={0}>al.squared.la@gmail.com</a>
                    </div>
                </div>
              </div>
            </section>

          </div>

          {/* Footer of the card */}
          <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 text-center text-xs md:text-sm text-gray-500">
            <p className="font-medium mb-2 text-heading">Sử dụng Hoxicoco đồng nghĩa với việc bạn đã xác nhận và đồng ý với các chính sách trên.</p>
            <p>&copy; 2026 Hoxicoco Project. All rights reserved.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;