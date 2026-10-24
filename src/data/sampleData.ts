export interface StudentRow {
  r: number;
  stt: number | string;
  name: string;
  xl: string; // 'T' | 'H' | 'C' | ''
  sc: number | null;
  skills: string; // Kỹ năng cụ thể của học sinh
  cmt: string;
  auto: string;
  sel: boolean;
}

export const SAMPLE_STUDENTS: StudentRow[] = [
  {
    r: 1,
    stt: 1,
    name: 'Nguyễn Hoàng An',
    xl: 'T',
    sc: 9.5,
    skills: 'Tính nhẩm nhanh, tư duy giải toán mạch lạc, trình bày bài sạch sẽ',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 2,
    stt: 2,
    name: 'Trần Bảo Anh',
    xl: 'T',
    sc: 9.0,
    skills: 'Nắm chắc kiến thức, thao tác tính toán cẩn thận và chuẩn xác',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 3,
    stt: 3,
    name: 'Lê Gia Bảo',
    xl: 'H',
    sc: 7.5,
    skills: 'Tính toán đúng bài cơ bản, cần rèn thêm kỹ năng giải toán có lời văn',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 4,
    stt: 4,
    name: 'Phạm Minh Châu',
    xl: 'T',
    sc: 8.5,
    skills: 'Hăng hái xây dựng bài, có kỹ năng suy luận logic tốt',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 5,
    stt: 5,
    name: 'Đặng Tuấn Dũng',
    xl: 'H',
    sc: 6.5,
    skills: 'Thực hiện được phép tính, nhưng còn hay nhầm lẫn khi đặt tính nhân chia',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 6,
    stt: 6,
    name: 'Vũ Thùy Dương',
    xl: 'T',
    sc: 10,
    skills: 'Xuất sắc các dạng toán, có kỹ năng tìm tòi phương pháp giải nhanh sáng tạo',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 7,
    stt: 7,
    name: 'Hoàng Hải Đăng',
    xl: 'H',
    sc: 7.0,
    skills: 'Tiếp thu được bài học, cần chú ý kiểm tra lại các bước tính sau khi làm',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 8,
    stt: 8,
    name: 'Bùi Đức Huy',
    xl: 'C',
    sc: 5.0,
    skills: 'Chưa thuộc vững bảng nhân chia, tốc độ tính còn chậm và hay lúng túng',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 9,
    stt: 9,
    name: 'Đỗ Quỳnh Nga',
    xl: 'H',
    sc: 8.0,
    skills: 'Chăm chỉ, hoàn thành bài đúng hạn, cần rèn luyện thêm kỹ năng tính nhẩm',
    cmt: '',
    auto: '',
    sel: false,
  },
  {
    r: 10,
    stt: 10,
    name: 'Ngô Khánh Linh',
    xl: 'T',
    sc: 9.0,
    skills: 'Chữ viết và số rõ ràng, tư duy hình học và vẽ hình rất chuẩn',
    cmt: '',
    auto: '',
    sel: false,
  },
];
