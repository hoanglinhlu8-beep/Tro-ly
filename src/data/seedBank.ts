export interface BankItem {
  id: number;
  lvl: 'T' | 'H' | 'C';
  band: '' | 'cao' | 'tb' | 'thap';
  text: string;
  subj: string;
  term: string;
  skill?: string;
}

let uid = Date.now();

export const INITIAL_BANK: BankItem[] = [
  // --- MỨC T (Hoàn thành tốt) - Chung ---
  { id: ++uid, lvl: 'T', band: '', text: 'Em nắm vững nội dung đã học, thực hiện thành thạo các kỹ năng và hoàn thành tốt nhiệm vụ học tập.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: '', text: 'Em hoàn thành tốt các nhiệm vụ học tập, có tinh thần tự giác cao và vận dụng linh hoạt kỹ năng đã học.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: '', text: 'Kết quả học tập của em rất tốt, tư duy nhanh nhẹn; em nên tiếp tục phát huy và mở rộng thêm kiến thức.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: '', text: 'Em đáp ứng tốt yêu cầu cần đạt của môn học, thao tác nhanh nhẹn và chính xác, hãy duy trì phong độ này nhé.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: '', text: 'Em có năng lực tự học tốt, tiếp thu bài nhanh và giải quyết các bài tập tự tin, đáng khen ngợi.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: 'cao', text: 'Em đạt kết quả kiểm tra xuất sắc, nắm chắc kiến thức và rèn luyện kỹ năng rất bài bản; cần tiếp tục phát huy.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: 'cao', text: 'Em hoàn thành xuất sắc các yêu cầu đánh giá, có kỹ năng tư duy độc lập; em có thể thử sức với bài tập nâng cao.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'T', band: 'tb', text: 'Em hoàn thành tốt các nội dung trọng tâm, kỹ năng vận dụng khá vững, nên rèn luyện thêm để đạt kết quả xuất sắc.', subj: '*', term: '*' },

  // --- MỨC H (Hoàn thành) - Chung ---
  { id: ++uid, lvl: 'H', band: '', text: 'Em hoàn thành các yêu cầu cơ bản của môn học, cần rèn luyện thêm kỹ năng vận dụng để bài làm tiến bộ hơn.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em nắm được các kiến thức trọng tâm, thực hiện được nhiệm vụ được giao, nên tích cực phát biểu xây dựng bài hơn.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em thực hiện tốt các yêu cầu học tập cơ bản, cần chú ý tính cẩn thận và kiên trì trong các bước giải quyết vấn đề.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em đã đạt yêu cầu cần đạt trong giai đoạn này, cố gắng ôn luyện thường xuyên để nâng cao kỹ năng hơn nữa.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: 'cao', text: 'Em cơ bản nắm vững bài học, có kỹ năng tiếp thu tốt, cần phát huy hơn nữa tính sáng tạo để đạt mức tốt.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: 'thap', text: 'Em đã đạt yêu cầu ở mức cơ bản, cần củng cố thêm kỹ năng còn lúng túng và chịu khó luyện tập thường xuyên.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'H', band: 'thap', text: 'Em hoàn thành yêu cầu ở mức tối thiểu, cần được thầy cô hỗ trợ thêm ở các dạng bài tập rèn kỹ năng.', subj: '*', term: '*' },

  // --- MỨC C (Chưa hoàn thành) - Chung ---
  { id: ++uid, lvl: 'C', band: '', text: 'Em cần được hỗ trợ củng cố kiến thức cơ bản và thường xuyên luyện tập các kỹ năng nền tảng của môn học.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em cần thực hành thêm theo từng bước hướng dẫn của thầy cô để tự tin hoàn thành tốt các yêu cầu học tập.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em còn lúng túng khi thực hiện bài tập, cần thầy cô và bạn bè đồng hành hỗ trợ, em sẽ tiến bộ nếu kiên trì.', subj: '*', term: '*' },
  { id: ++uid, lvl: 'C', band: 'thap', text: 'Em chưa đạt chuẩn kỹ năng của bài đánh giá, cần được giáo viên kèm cặp ôn luyện kiến thức cơ bản từng bước.', subj: '*', term: '*' },

  // --- MÔN TOÁN (Kỹ năng tính toán, giải toán có lời văn, tư duy hình học) ---
  { id: ++uid, lvl: 'T', band: '', text: 'Em có kỹ năng tính toán chuẩn xác, tư duy giải toán mạch lạc và trình bày bài khoa học, cần tiếp tục phát huy.', subj: 'Toán', term: '*' },
  { id: ++uid, lvl: 'T', band: 'cao', text: 'Em tính toán nhanh nhẹn, nắm chắc phương pháp giải toán có lời văn và có khả năng phát triển các dạng bài khó.', subj: 'Toán', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em thực hiện được các phép tính cơ bản, cần rèn thêm kỹ năng phân tích đề toán có lời văn và cẩn thận khi đặt tính.', subj: 'Toán', term: '*' },
  { id: ++uid, lvl: 'H', band: 'thap', text: 'Em nắm được quy tắc tính nhưng tốc độ tính còn chậm, cần rèn luyện bảng nhân chia và chú ý kiểm tra lại kết quả.', subj: 'Toán', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em còn nhầm lẫn trong các phép tính cơ bản, cần giáo viên hướng dẫn lại các bước tính và rèn luyện mỗi ngày.', subj: 'Toán', term: '*' },

  // --- MÔN TIẾNG VIỆT (Kỹ năng đọc hiểu, diễn đạt, viết chính tả, ngữ pháp) ---
  { id: ++uid, lvl: 'T', band: '', text: 'Em đọc to rõ ràng, diễn cảm tốt, viết câu gãy gọn giàu hình ảnh và chữ viết sạch đẹp, đáng biểu dương.', subj: 'Tiếng Việt', term: '*' },
  { id: ++uid, lvl: 'T', band: 'cao', text: 'Em có vốn từ vựng phong phú, kỹ năng đọc hiểu và cảm thụ văn học rất tốt, diễn đạt tự tin, lưu loát.', subj: 'Tiếng Việt', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em đọc lưu loát, trả lời được câu hỏi đọc hiểu cơ bản; cần chú ý rèn chữ viết và viết câu đầy đủ dấu câu.', subj: 'Tiếng Việt', term: '*' },
  { id: ++uid, lvl: 'H', band: 'thap', text: 'Em đọc bài còn chậm, còn mắc một số lỗi chính tả; cần tăng cường đọc thêm sách báo và rèn viết chữ cẩn thận.', subj: 'Tiếng Việt', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em còn lúng túng khi phát âm và viết câu, cần được thầy cô hỗ trợ rèn kỹ năng đọc đúng và sửa lỗi chính tả.', subj: 'Tiếng Việt', term: '*' },

  // --- MÔN TIẾNG ANH (Kỹ năng nghe nói, phát âm, từ vựng) ---
  { id: ++uid, lvl: 'T', band: '', text: 'Em phát âm chuẩn, ghi nhớ từ vựng tốt và tự tin giao tiếp các đoạn hội thoại tiếng Anh ngắn, rất đáng khen.', subj: 'Tiếng Anh', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em nắm được các từ vựng và mẫu câu cơ bản, cần chủ động luyện tập nghe và nói tiếng Anh nhiều hơn.', subj: 'Tiếng Anh', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em còn nhút nhát khi nói tiếng Anh và chưa nhớ từ vựng, cần được hướng dẫn luyện đọc và tương tác thêm.', subj: 'Tiếng Anh', term: '*' },

  // --- MÔN TIN HỌC & CÔNG NGHỆ ---
  { id: ++uid, lvl: 'T', band: '', text: 'Em thao tác máy tính thành thạo, thực hành đúng kỹ thuật và biết tự khám phá các tính năng của phần mềm học tập.', subj: 'Tin học', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em thực hiện được các thao tác thực hành cơ bản trên máy tính, cần rèn luyện thêm kỹ năng gõ phím nhanh và chuẩn.', subj: 'Tin học', term: '*' },
  { id: ++uid, lvl: 'C', band: '', text: 'Em còn lúng túng khi sử dụng chuột và bàn phím, cần được thầy cô hướng dẫn từng thao tác thực hành cụ thể.', subj: 'Tin học', term: '*' },
  { id: ++uid, lvl: 'T', band: '', text: 'Em hiểu rõ kiến thức môn Công nghệ, khéo léo trong các bài thực hành và có ý thức giữ gìn an toàn học đường.', subj: 'Công nghệ', term: '*' },
  { id: ++uid, lvl: 'H', band: '', text: 'Em hoàn thành các sản phẩm thực hành công nghệ cơ bản, cần rèn thêm tính kiên nhẫn và thẩm mỹ khi thao tác.', subj: 'Công nghệ', term: '*' }
];
