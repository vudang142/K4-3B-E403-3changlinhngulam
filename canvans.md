1. **Track + đề:** E · AI Attendance — xác minh học viên thực sự có mặt tại lớp khi điểm danh.

2. **Job executor:** Lab Coach đang bắt đầu buổi học và cần điểm danh nhanh, đồng thời xác minh học viên thực sự đang có mặt tại lớp.

3. **Pain:** Khi sử dụng QR/Form để điểm danh, hệ thống chủ yếu xác nhận rằng học viên đã thực hiện thao tác check-in, nhưng không chắc chắn học viên có thực sự ở trong lớp. Học viên có thể điểm danh hộ, chia sẻ QR/link hoặc điểm danh rồi rời khỏi lớp; Lab Coach phải tự kiểm tra các trường hợp nghi ngờ, mất thời gian và khó có bằng chứng để xác minh.

4. **Bằng chứng đầu:** 
   - Khảo sát nhanh `10` Lab Coach về khả năng xác minh sự hiện diện của học viên bằng phương thức điểm danh hiện tại: `6/10 (60%)` đánh giá ở mức `1–3/5`, cho thấy việc điểm danh hiện tại chưa thực sự đảm bảo xác minh được học viên đang có mặt tại lớp. `4/10 (40%)` đánh giá ở mức `4–5/5`.
   - Điểm đánh giá trung bình là `2.8/5`, cho thấy vẫn còn khoảng trống trong việc xác minh sự hiện diện thực tế của học viên.

5. **Lát cắt:** Học viên bắt đầu điểm danh → quét Dynamic QR → hệ thống thu thập các bằng chứng về sự hiện diện như vị trí, thời gian và thông tin check-in → AI đánh giá mức độ đáng tin cậy của lượt điểm danh → nếu đủ căn cứ thì xác nhận có mặt, nếu không chắc chắn thì yêu cầu xác minh thêm hoặc đưa vào danh sách để Lab Coach kiểm tra.

6. **AI tự làm đến đâu:** *Tự:* nhận dữ liệu từ lượt check-in, kết hợp các evidence như GPS, thời gian điểm danh và pattern check-in, đánh giá mức độ đáng tin cậy của sự hiện diện và phân loại thành xác nhận / cần xác minh / nghi ngờ. *Không tự:* coi một tín hiệu đơn lẻ như GPS là bằng chứng tuyệt đối hoặc tự động kết luận gian lận khi evidence không đủ — trường hợp không chắc chắn phải được đưa cho Lab Coach kiểm tra. *Lý do:* QR chỉ chứng minh học viên đã thực hiện thao tác điểm danh, chưa chắc chứng minh học viên thực sự có mặt tại lớp; hệ thống cần kết hợp nhiều evidence để giảm trường hợp điểm danh hộ hoặc điểm danh từ ngoài lớp. **Willing users (ngoài nhóm, đã hỏi và đồng ý):** `[Tên 1]`, `[Tên 2]`, `[Tên 3]`.

7. **Phân công:** `[Vũ Hải Đăng]` — mining evidence, khảo sát pain point · `[Vũ Hải Đăng]` — thiết kế presence scoring + tiêu chí xác minh · `[Lưu Nguyễn Tiến Anh]` — prototype + AI call thật · `[Đặng Quang Huy]` — spec, workflow, golden set, demo · `[Đàm Việt Hưng]` — user test, feedback log, changelog.