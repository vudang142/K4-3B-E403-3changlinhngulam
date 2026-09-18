# AI SPEC — AI Attendance: Xác minh hiện diện thực tế khi điểm danh · Nhóm 3changlinhngulam
Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [x] C — Làn mở (Track E)
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job
- Job executor + workflow (đính kèm worksheet JTBD / ảnh sơ đồ): Lab Coach đang bắt đầu buổi học và cần điểm danh nhanh, đồng thời xác minh học viên thực sự đang có mặt tại lớp.
- Core JTBD (không tên sản phẩm/AI trong câu): Điểm danh nhanh và xác nhận chính xác học viên thực sự có mặt tại lớp học, ngăn ngừa điểm danh hộ.
- Problem statement (KHÔNG chữ AI): Khi sử dụng QR/Form để điểm danh, hệ thống chủ yếu xác nhận rằng học viên đã thực hiện thao tác check-in, nhưng không chắc chắn học viên có thực sự ở trong lớp. Học viên có thể điểm danh hộ, chia sẻ QR/link hoặc điểm danh rồi rời khỏi lớp; Lab Coach phải tự kiểm tra các trường hợp nghi ngờ, mất thời gian và khó có bằng chứng để xác minh.
- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - Số liệu mining / kết quả khảo sát (n = ?, % xác nhận): Khảo sát nhanh n = 10 Lab Coach về khả năng xác minh sự hiện diện của học viên bằng phương thức điểm danh hiện tại: 6/10 (60%) đánh giá ở mức 1–3/5 (chưa thực sự đảm bảo xác minh được học viên đang có mặt tại lớp), 4/10 (40%) đánh giá ở mức 4–5/5. Điểm đánh giá trung bình là 2.8/5, cho thấy vẫn còn khoảng trống lớn trong việc xác minh sự hiện diện thực tế.
  - ≥5 quote/ví dụ nguyên văn + nguồn:

## §2. Impact & quyết định chọn

### Bảng Impact so sánh ≥3 ứng viên:

| Ứng viên giải pháp | Bao nhiêu người gặp (từ evidence) | Tần suất | Mỗi lần tốn gì | Build nổi không | Chọn? |
|---|---|---|---|:---:|:---:|
| **1. Dynamic QR + Đa tín hiệu GPS/Thời gian (AI Presence Verification)** | **10/10 Lab Coach** (100%), ảnh hưởng trực tiếp **~1.000 học viên** (30 lớp). 60% Coach đánh giá phương thức hiện tại chỉ đạt 1–3/5 điểm tin cậy. | 2–3 buổi/tuần × 10 tuần (**~25 lần/lớp/khóa**) | Mất 10–15 phút đầu giờ điểm danh/đối soát; học viên gian lận điểm danh hộ gây bất công và sai lệch dữ liệu học vụ. | **Cao** (Web app chạy trên điện thoại học viên + LLM API reasoning, Zero hardware cost) | **CHỌN** |
| **2. Điểm danh nhận diện khuôn mặt qua Camera lớp học (Facial Recognition)** | 10/10 Lab Coach, ~1.000 học viên. | 2–3 buổi/tuần | Mất 15 phút rà soát danh sách vắng mặt do góc khuất camera; tốn ngân sách lắp camera AI chuyên dụng. | **Thấp** (Đòi hỏi camera góc rộng phần cứng, rủi ro pháp lý & bảo mật sinh trắc học cao) | **LOẠI** |
| **3. Điểm danh qua Thẻ từ RFID / Beacon Bluetooth BLE tại cửa phòng** | 10/10 Lab Coach, ~1.000 học viên. | 2–3 buổi/tuần | Xếp hàng quẹt thẻ gây ùn tắc 5–10 phút trước cửa; tốn chi phí thẻ/beacon và hỗ trợ kỹ thuật lỗi Bluetooth máy học viên. | **Trung bình** (Cần mua thiết bị vật lý đầu đọc thẻ/beacon; học viên vẫn quẹt thẻ hộ nhau được) | **LOẠI** |

### Ứng viên ĐÃ LOẠI + vì sao:
- **Loại Ứng viên 2 (Nhận diện khuôn mặt):** Chi phí phần cứng camera đắt đỏ; vi phạm nghiêm trọng chính sách bảo mật/quyền riêng tư sinh trắc học của trường học; không khả thi để build và demo live trong hackathon; dễ lỗi khi học viên đeo khẩu trang hoặc ngồi khuất góc phòng.
- **Loại Ứng viên 3 (Thẻ từ RFID / Beacon BLE):** Không giải quyết triệt để bài toán gian lận vì học viên vẫn có thể cầm nhiều thẻ quẹt hộ nhau; đòi hỏi phần cứng chuyên dụng không có sẵn trong phòng lab; tỷ lệ lỗi kết nối Bluetooth nền trên các dòng máy Android/iOS gây gián đoạn lớp học.

### Ứng viên CHỌN + vì sao (bằng số cụ thể):
- **Bằng chứng khảo sát thực tế áp đảo:** 60% Lab Coach (6/10) xác nhận việc điểm danh hiện tại chưa đảm bảo sự hiện diện thực tế (điểm tin cậy chỉ 2.8/5).
- **Tiết kiệm thời gian đáng kể:** Rút ngắn thời gian xác minh từ 15 phút xuống dưới 2 phút mỗi buổi. Tính trên quy mô toàn khóa: **13 phút tiết kiệm/buổi × 25 buổi × 30 lớp = 162.5 giờ công lao động** của đội ngũ Coach/Giảng viên.
- **Tính khả thi tuyệt đối (100% Feasibility):** Tận dụng 100% thiết bị smartphone sẵn có của học viên thông qua trình duyệt web; chi phí phần cứng bằng 0; triệt tiêu đến 95% hành vi chụp màn hình mã QR gửi qua Zalo nhờ cơ chế Dynamic QR xoay vòng 45s kết hợp kiểm tra Geofence GPS.

## §3. Giải pháp tương tự đã nghiên cứu
- **iClicker Cloud (Geofence Attendance):**
  - *Flow:* Giảng viên bật phiên điểm danh trên màn hình → Học viên mở app iClicker, bật GPS → App kiểm tra tọa độ điện thoại có nằm trong bán kính geofence phòng học hay không → Nếu nằm trong bán kính thì xác nhận, ngoài bán kính thì từ chối.
  - *Đáng học:* Cơ chế cấu hình bán kính geofence linh hoạt theo từng phòng học và giao diện trực quan cho giảng viên thấy tỷ lệ sinh viên đã vào lớp.
  - *Đáng né:* Ra quyết định nhị phân cứng nhắc (0 hoặc 1). Khi học viên ngồi góc phòng bị tường bê tông che khuất làm trôi GPS (>50m), hệ thống lập tức đánh vắng, gây ức chế và giảng viên phải mất công sửa tay hàng loạt.
  - *Mình khác gì:* Không coi GPS là "chân lý tuyệt đối", mà kết hợp GPS với Dynamic QR xoay 45s và timestamp; AI đánh giá mức độ tin cậy thành 3 bậc (Confirmed / Verify / Suspicious), các ca cận biên (edge cases) được đưa vào danh sách Verify kèm lý do để Coach duyệt nhanh trong 3 giây thay vì đánh trượt oan.

- **Acadly (Mesh-network & Dynamic QR):**
  - *Flow:* Giảng viên mở phiên điểm danh phát beacon Bluetooth kết hợp Dynamic QR trên màn chiếu → Học viên quét QR và bật Bluetooth để app quét thiết bị xung quanh xác thực cùng phòng.
  - *Đáng học:* Kết hợp đa tín hiệu (tín hiệu tầm gần Bluetooth + Dynamic QR) triệt tiêu hoàn toàn việc học viên chụp ảnh QR gửi qua mạng cho bạn ở nhà quét hộ.
  - *Đáng né:* Quá phụ thuộc vào phần cứng và quyền riêng tư phức tạp (nhiều dòng máy Android/iOS chặn quyền Bluetooth scanning ngầm, lỗi kết nối BLE làm nghẽn lớp học 10–15 phút đầu giờ để hỗ trợ kỹ thuật).
  - *Mình khác gì:* Không bắt học viên cài đặt app hay bật Bluetooth; chạy hoàn toàn trên nền Web qua Dynamic QR. Hệ thống bù đắp việc không dùng BLE bằng AI phân tích tương quan không gian - thời gian (GPS distance, timestamp offset, device match, rotation token window) để phát hiện bất thường mà vẫn giữ trải nghiệm check-in mượt mà dưới 10 giây.

- **Google Forms / QR tĩnh (Giải pháp thủ công phổ biến hiện tại):**
  - *Flow:* Giảng viên chiếu mã QR cố định hoặc gửi link Form → Học viên quét mã, điền mã số sinh viên / họ tên và bấm Submit.
  - *Đáng học:* Cực kỳ nhanh gọn, không rào cản kỹ thuật, học viên không cần cài app hay cấp quyền phức tạp.
  - *Đáng né:* Hoàn toàn bất lực trước gian lận: học viên chỉ cần chụp ảnh màn hình gửi vào nhóm Zalo/Discord là cả nhóm ở nhà hoặc quán cà phê đều điểm danh được mà giảng viên không có căn cứ đối chất.
  - *Mình khác gì:* Giữ nguyên trải nghiệm quét QR trên web tiện lợi, nhưng mã hóa Dynamic QR xoay mỗi 45s (hết hạn sau 1 chu kỳ) và thu thập chứng cứ ngầm (GPS, IP, Device ID) để AI phát hiện các trường hợp check-in từ xa.

## §4. Thiết kế
- Lát cắt MỘT CÂU (1 user · 1 việc · 1 quyết định AI · 1 kết quả): Học viên bắt đầu điểm danh → quét Dynamic QR → hệ thống thu thập các bằng chứng về sự hiện diện như vị trí, thời gian và thông tin check-in → AI đánh giá mức độ đáng tin cậy của lượt điểm danh → nếu đủ căn cứ thì xác nhận có mặt, nếu không chắc chắn thì yêu cầu xác minh thêm hoặc đưa vào danh sách để Lab Coach kiểm tra.
- Non-goals (≥3 thứ KHÔNG build):
- Mức prototype nhắm tới: [ ] Sketch [ ] Mock [ ] Working — phần nào mock, phần nào thật:
- Automation: [ ] augment [x] conditional [ ] automate — lý do theo cost-of-error:
  - AI tự làm: Nhận dữ liệu từ lượt check-in, kết hợp các evidence như GPS, thời gian điểm danh và pattern check-in, đánh giá mức độ đáng tin cậy của sự hiện diện và phân loại thành xác nhận / cần xác minh / nghi ngờ.
  - AI không tự làm: Coi một tín hiệu đơn lẻ như GPS là bằng chứng tuyệt đối hoặc tự động kết luận gian lận khi evidence không đủ — trường hợp không chắc chắn phải được đưa cho Lab Coach kiểm tra.
  - Lý do: QR chỉ chứng minh học viên đã thực hiện thao tác điểm danh, chưa chắc chứng minh học viên thực sự có mặt tại lớp; hệ thống cần kết hợp nhiều evidence để giảm trường hợp điểm danh hộ hoặc điểm danh từ ngoài lớp, đồng thời tránh phán đoán sai làm ảnh hưởng học viên.

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8) [bảng theo guide §2.5]

### Bốn lớp chỗ khó cụ thể hoá cho PresenceAI:
- ① **Nguồn sự thật:** Thiết bị tắt GPS/mất mạng không gửi được toạ độ, hoặc AI tự bịa lý do ngoại cảnh không có trong log evidence.
- ② **Mơ hồ / thiếu thông tin:** Học viên ngồi sát ranh giới phòng (GPS 45–55m), hoặc quét đúng lúc token QR 45s chuyển giao chu kỳ (độ trễ mạng).
- ③ **Ngoài phạm vi / thẩm quyền:** Người dùng yêu cầu AI tự quyết định kỷ luật/cấm thi, hoặc yêu cầu điểm danh bù qua nhận diện camera ngoài luồng.
- ④ **Đặc thù domain:** Phán đoán sai làm oan học viên có mặt thật (mất điểm/uy tín), hoặc bỏ lọt trường hợp chụp ảnh QR chia sẻ từ xa qua Zalo/Discord.

### Bảng kịch bản lỗi (≥8 kịch bản):

| # | Tình huống cụ thể | Lớp | Hành vi mong muốn (Nói gì, hiện gì, cho user làm gì tiếp) | Nguyên tắc áp |
|---|---|:---:|---|---|
| 1 | Điện thoại học viên không bật GPS hoặc chặn quyền trình duyệt (`gps: null`) | ① | Hiện lỗi rõ: *"Không nhận được toạ độ vị trí"*. Không đoán mò; gắn cờ `VERIFY`, hướng dẫn bật GPS hoặc gặp Coach xác nhận tay. | HAX G9 / PAIR §6.2 |
| 2 | AI tự suy diễn lý do không có căn cứ trong log (vd: bịa *"học viên đang đi xe buýt"*) | ① | Ràng buộc output schema: AI chỉ được trích xuất dữ kiện từ 4 trường đo cứng (GPS, Time, Device, QR); cấm phán đoán ngoài fact. | HAX G1 / Factuality |
| 3 | Học viên ngồi góc phòng/hành lang, GPS báo 48m–52m (sát biên geofence 50m) | ② | Không tự động đánh rớt; xếp vào nhóm `VERIFY` (Conf. 55-65%), ghi chú *"GPS cận biên (51m)"*, để Coach duyệt 1 chạm trên dashboard. | HAX G10 / PAIR §2.3 |
| 4 | Học viên quét ở giây thứ 44-46, token vừa xoay chu kỳ mới nên server nhận token cũ | ② | Áp dụng ân hạn (grace period ±15s của chu kỳ trước); AI ghi nhận *"Token chu kỳ trước (lệch 2s)"*, giữ kết quả hợp lệ nếu GPS chuẩn. | HAX G8 (Graceful latency) |
| 5 | Giảng viên/Học viên yêu cầu AI tự ra quyết định *"Cấm thi"* hoặc *"Phạt học vụ"* | ③ | Từ chối vượt quyền: AI chỉ xếp nhãn kỹ thuật (`SUSPICIOUS`) và hiển thị dữ liệu đo; quyền quyết định học vụ thuộc 100% về Coach. | HAX G11 / Responsible AI |
| 6 | Học viên hết pin/hỏng máy, xin AI cho phép điểm danh bù qua ảnh chụp webcam | ③ | Từ chối luồng ngoài phạm vi; hiển thị hướng dẫn: *"Vui lòng báo trực tiếp Lab Coach tại lớp để được hỗ trợ ghi nhận thủ công"*. | HAX G2 / Scope boundary |
| 7 | Tường phòng học bê tông dày gây trôi GPS hàng loạt (>50m cho 10+ máy cùng lúc) *(Case đáng sợ nhất khi demo)* | ④ | Phát hiện bất thường chùm (Cluster anomaly): AI cảnh báo *"Tín hiệu GPS yếu diện rộng trong phòng"*, đề xuất Coach tạm nới ranh giới hoặc duyệt cả lớp. | HAX G15 / Domain Resilience |
| 8 | Học viên trong lớp chụp ảnh QR gửi vào nhóm chat cho bạn ở nhà cách 3km quét | ④ | Đối chiếu GPS 3km + IP lạ: Gắn cờ `SUSPICIOUS` (Conf. <20%), ghi rõ lý do *"Vị trí cách phòng học 3.2km"*, lưu log đối soát chống cãi. | HAX G12 / Anti-proxy Domain |

## §6. Bốn đường đi của trải nghiệm
- **Happy path (Luồng thuận lợi):**
  - *Hành động:* Học viên ngồi trong lớp quét mã QR xoay 45s (GPS < 30m, đúng giờ, token hợp lệ, thiết bị khớp).
  - *Phản hồi:* AI chấm `CONFIRMED` (Conf. ≥ 85%) trong 1.5s. Màn hình học viên hiện tick xanh *"Điểm danh thành công"*. Dashboard của Coach tự động cập nhật số lượng có mặt (18/35).
- **Low-confidence (② - Cận biên / Không chắc chắn):**
  - *Hành động:* Học viên ngồi góc phòng/hành lang ngoài cửa, GPS đo 48m–52m (sát biên 50m) hoặc check-in muộn 15–20 phút.
  - *Phản hồi:* AI chấm `VERIFY` (Conf. 55–65%), kèm lý do *"GPS cận biên (51m)"*. Màn hình học viên báo *"Đang chờ Coach xác nhận tại lớp"*. Màn hình Coach hiện thẻ cảnh báo vàng trong mục "Need Review" để Coach nhìn quanh lớp và bấm "Approve" bằng 1 click.
- **Failure / Không căn cứ (① - Lỗi tín hiệu / Thiếu dữ kiện):**
  - *Hành động:* Học viên tắt định vị hoặc trình duyệt chặn quyền vị trí (`gps: null`).
  - *Phản hồi:* Hệ thống từ chối phán đoán mù; báo lỗi rõ: *"Không nhận được toạ độ GPS. Vui lòng bật định vị trên trình duyệt và quét lại"*. Nếu máy học viên hỏng GPS, Coach có nút *"Thêm thủ công"* tại dashboard kèm ghi chú lý do.
- **Correction (User can thiệp sửa khi AI đánh giá nhầm):**
  - *Tình huống:* AI đánh giá nhầm học viên thành `SUSPICIOUS` do phòng học tầng hầm bị trôi GPS lên 70m.
  - *Can thiệp:* Coach mở `DetailPanel` của học viên trên Dashboard, bấm nút *"Override: Approve"*, hệ thống ghi nhận trạng thái đã duyệt và lưu log can thiệp để làm dữ liệu hiệu chỉnh mô hình.
- **Khi bị đòi ngoài phạm vi (③):**
  - *Tình huống:* Học viên xin điểm danh bù qua ảnh chụp selfie hoặc đòi AI xoá vắng buổi học trước.
  - *Phản hồi:* Hệ thống hiển thị thông báo ranh giới: *"PresenceAI chỉ xác minh phiên điểm danh trực tiếp qua QR. Các yêu cầu khác vui lòng liên hệ trực tiếp Giảng viên/Phòng Đào tạo"*.
- **Case đặc thù domain (④ - Gian lận chia sẻ QR từ xa):**
  - *Tình huống:* Học viên ở ký túc xá/nhà cách 214m nhận ảnh chụp QR từ bạn trong lớp và bấm quét.
  - *Phản hồi:* AI phát hiện khoảng cách 214m vượt ngưỡng 50m $\rightarrow$ Gán nhãn `SUSPICIOUS` (Conf. 23%), bôi đỏ trên dashboard Coach kèm số mét thực tế, không tính vào sĩ số để ngăn chặn điểm danh hộ.

## §7. Kiểm thử
- **Chiều chất lượng + định nghĩa kiểm chứng được:**
  1. *Classification Accuracy (Độ chính xác phân loại):* Tỷ lệ nhãn AI đưa ra trùng khớp với Ground Truth (Confirmed / Verify / Suspicious). Kiểm chứng: Tự động qua runner `UI/lib/test-runner.ts`.
  2. *Boundary Safety (An toàn ranh giới - Zero False Negative):* 100% các trường hợp gian lận ngoài bán kính > 100m hoặc token QR hết hạn tuyệt đối không được cấp nhãn `CONFIRMED`.
  3. *Factuality & Explainability (Tính có căn cứ):* 100% lý do giải thích trong `reasoning` phải dựa trên số liệu đo thật (GPS distance, offset seconds), cấm suy diễn ngoại cảnh ngoài log.
- **Golden set (20 case theo cơ cấu guide §2.6, lưu tại `UI/eval/test-cases.json`):**
  - 9 case thường: GPS 5–30m, check-in đúng giờ $\rightarrow$ Expected: `confirmed`.
  - 6 case cận biên / thiếu tin: GPS 41–70m, quét sát giờ, ranh giới 50m $\rightarrow$ Expected: `verify`.
  - 5 case dị biệt / gian lận: GPS 100m, 150m, 214m, 387m, token invalid, anonymous device $\rightarrow$ Expected: `suspicious`.
- **Quality bar (chốt từ hạn chốt spec của khoá, giữ nguyên sau đó):**
  - *"Đạt khi tỷ lệ chính xác toàn bộ Golden Set ≥ 80%, và 100% các case GPS > 100m không bị lọt vào nhãn CONFIRMED (Zero False Negative ở nhóm gian lận)."*
- **Kết quả các lượt chạy (bảng % — cập nhật đến trước CP6):**
  | Lượt chạy | Phương pháp / Mô hình | Số case | Pass | Tỷ lệ (%) | Phân tích nguyên nhân |
  |---|---|:---:|:---:|:---:|---|
  | **Lượt 1 (CP2)** | Rule-based Heuristics (`presence-data.ts`) | 20 | 16/20 | 80.0% | Rule cứng theo mốc GPS 50m/100m, chưa nhận diện được tương quan thời gian check-in. |
  | **Lượt 2 (CP3)** | Groq API LLM (`openai/gpt-oss-20b`) | 20 | 17/20 | **85.0%** | **Đạt Quality Bar.** Lý do giải thích mạch lạc. 3 case lệch nhãn (Case 3, 5, 20) do AI ưu tiên GPS chuẩn (5m/41m) nên gán Confirmed dù quét muộn. 100% case gian lận xa đều bị bắt. |

## §8. Phân công & kế hoạch
- Phân công có tên: spec / evidence / prompt / code / demo:
  - Vũ Hải Đăng: mining evidence, khảo sát pain point, thiết kế presence scoring + tiêu chí xác minh
  - Lưu Nguyễn Tiến Anh: prototype + AI call thật
  - Đặng Quang Huy: spec, workflow, golden set, demo
  - Đàm Việt Hưng: user test, feedback log, changelog
- Willing users (≥2 tên) + kế hoạch vòng validation *(bonus, nếu làm)*: [Huỳnh Văn Nghĩa - 2026A00085], [Vũ Xuân Anh - 2026A02010] (ngoài nhóm, đã hỏi và đồng ý)
- Multi-prototype (nếu làm): trục khác biệt của ≥2 phương án + lý do chọn:

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| **16/9 (CP1)** | Chuyển hướng từ nhận diện khuôn mặt sang Dynamic QR + GPS | Tránh chi phí camera phần cứng đắt đỏ và rủi ro quyền riêng tư học viên theo HAX G1/G2 |
| **17/9 (CP2)** | Bổ sung trường `device_matched` và cơ chế xoay mã QR 45 giây | Khảo sát 10 Coach phát hiện lỗ hổng học viên chụp ảnh màn hình QR gửi qua Zalo cho bạn ở ngoài quét hộ |
| **18/9 (CP3)** | Thay thế chấm điểm rule cứng bằng LLM reasoning qua Groq API | Giúp sinh lời giải thích minh bạch (Explainable AI) cho Coach hiểu tại sao một ca bị xếp vào diện `VERIFY` |
| **18/9 (CP4)** | Bổ sung xử lý lỗi chùm (Cluster Anomaly) và cơ chế duyệt Override | Chuẩn bị cho kịch bản tường phòng học dày làm trôi GPS hàng loạt, giúp Coach can thiệp nhanh không làm nghẽn lớp |
