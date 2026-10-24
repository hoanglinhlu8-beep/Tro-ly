import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface StudentItem {
  id: number | string;
  level: string; // 'T' | 'H' | 'C'
  score?: number | null;
  specificSkills?: string;
  scoreBand?: string;
}

interface GenerateRequestBody {
  subject?: string;
  term?: string;
  gradeClass?: string;
  generalSkillsFocus?: string;
  items: StudentItem[];
  tone?: string;
  sampleExamples?: string[];
}

// API endpoint to generate comments for students based on score and skills
app.post('/api/generate-comments', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'Chung',
      term = 'Định kỳ',
      gradeClass = '',
      generalSkillsFocus = '',
      items = [],
      tone = 'khích lệ',
      sampleExamples = [],
    } = req.body as GenerateRequestBody;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Danh sách học sinh không được rỗng.' });
    }

    // Prepare system instructions and prompt adhering to Vietnamese Circular 27/2020/TT-BGDĐT
    const prompt = `Bạn là chuyên gia giáo dục tiểu học Việt Nam, nắm vững tinh thần và quy định Thông tư 27/2020/TT-BGDĐT của Bộ Giáo dục và Đào tạo về đánh giá học sinh tiểu học.
Nhiệm vụ: Viết nhận xét đánh giá thường xuyên/định kỳ cho danh sách học sinh dựa trên mức xếp loại (T/H/C), điểm số và kỹ năng của từng em.

THÔNG TIN ĐÁNH GIÁ:
- Môn học / Hoạt động: ${subject}
- Kỳ đánh giá: ${term}
${gradeClass ? `- Lớp: ${gradeClass}` : ''}
${generalSkillsFocus ? `- Trọng tâm kỹ năng môn học: ${generalSkillsFocus}` : ''}
- Phong cách nhận xét: ${tone}

QUY ĐỊNH MỨC XẾP LOẠI THEO THÔNG TƯ 27:
- Mức T (Hoàn thành tốt): Nắm chắc kiến thức, thao tác kỹ năng môn học thành thạo, chủ động, sáng tạo. Nhận xét ghi nhận thế mạnh, khen ngợi và động viên phát huy/mở rộng.
- Mức H (Hoàn thành): Đạt các chuẩn kiến thức - kỹ năng cơ bản của môn học. Nhận xét ghi nhận sự hoàn thành, đồng thời chỉ ra cụ thể kỹ năng cần rèn luyện thêm để tiến bộ.
- Mức C (Chưa hoàn thành): Chưa nắm vững một số yêu cầu hoặc còn lúng túng trong thực hiện kỹ năng. Nhận xét nhẹ nhàng, khích lệ, chỉ rõ nội dung/kỹ năng cần hỗ trợ kèm biện pháp cụ thể.

YÊU CẦU ĐẶC BIỆT VỀ ĐIỂM SỐ VÀ KỸ NĂNG:
1. ĐÁNH GIÁ DỰA TRÊN KỸ NĂNG:
   - Nếu học sinh có thông tin kỹ năng riêng biệt (specificSkills): Hãy bám sát vào kỹ năng đó để viết nhận xét chân thực, sâu sắc, đúng với năng lực thực tế của em.
   - Nếu chưa có kỹ năng riêng: Hãy tự động lồng ghép các kỹ năng cốt lõi đặc thù của môn ${subject} (ví dụ Toán: tính toán nhẩm/đặt tính, giải toán có lời văn, tư duy logic; Tiếng Việt: đọc hiểu, phát âm, diễn đạt câu, chữ viết; Tiếng Anh: nghe, nói, vốn từ; Khoa học/Lịch sử/Địa lý: quan sát, liên hệ thực tế; Tin học/Công nghệ: thực hành thao tác...).
2. ĐIỀU CHỈNH SẮC THÁI THEO ĐIỂM SỐ:
   - Điểm số (score) là căn cứ phụ giúp điều chỉnh độ sâu và sắc thái của nhận xét.
   - TUYỆT ĐỐI KHÔNG ghi trực tiếp con số điểm (như "đạt 9 điểm" hay "được 5 điểm") trong lời nhận xét.
   - Nếu điểm cao (từ 8 trở lên): Khẳng định kỹ năng vững vàng, xử lý tốt các bài tập.
   - Nếu điểm trung bình (6 - 7.5): Ghi nhận kỹ năng đạt chuẩn, cần trau dồi thêm độ tỉ mỉ hoặc kỹ năng nâng cao.
   - Nếu điểm dưới 6: Nêu rõ kỹ năng cần được thầy cô hướng dẫn và luyện tập thêm từng bước.
3. VĂN PHONG VÀ HÌNH THỨC:
   - Mỗi nhận xét từ 1 đến 2 câu ngắn gọn, súc tích (khoảng 15 đến 35 từ), bắt đầu bằng từ "Em...".
   - Ngôn từ chuẩn mực sư phạm tiểu học, gần gũi, khích lệ, không chê bai tiêu cực, không so sánh các học sinh với nhau.
   - Đa dạng hóa câu từ: Dù các học sinh có cùng mức xếp loại, nhận xét PHẢI ĐA DẠNG, không trùng lặp máy móc.

${sampleExamples.length > 0 ? `CÂU MẪU THAM KHẢO VỀ VĂN PHONG (không sao chép nguyên xi):\n${sampleExamples.map(s => `- ${s}`).join('\n')}\n` : ''}

DANH SÁCH DỮ LIỆU HỌC SINH CẦN NHẬN XÉT:
${JSON.stringify(
  items.map((it) => ({
    id: it.id,
    muc_xl: it.level,
    diem: it.score ?? 'không có',
    nhom_diem: it.scoreBand ?? 'chưa xác định',
    ky_nang: it.specificSkills || 'theo kỹ năng môn học',
  })),
  null,
  2
)}

HÃY TRẢ VỀ DUY NHẤT MỘT MẢNG JSON hợp lệ theo đúng cấu trúc:
[
  { "id": 1, "cmt": "Em ..." }
]
Không thêm bất kỳ lời dẫn, giải thích hay định dạng markdown nào khác ngoài chuỗi JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.85,
      },
    });

    const rawText = response.text || '';
    let parsedData: Array<{ id: number | string; cmt: string }> = [];

    try {
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini response:', rawText, parseErr);
      // Fallback: regex search for id and cmt pairs
      const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('AI không trả về đúng định dạng JSON.');
      }
    }

    return res.json({
      success: true,
      comments: parsedData,
    });
  } catch (error: any) {
    console.error('Generate comments error:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi gọi AI sinh nhận xét.',
    });
  }
});

// Single student comment generator for fast regeneration (🔄 button)
app.post('/api/generate-single-comment', async (req: Request, res: Response) => {
  try {
    const {
      subject = 'Chung',
      term = 'Định kỳ',
      level = 'T',
      score = null,
      specificSkills = '',
      tone = 'khích lệ',
    } = req.body;

    const prompt = `Bạn là giáo viên tiểu học Việt Nam, nắm vững Thông tư 27/2020/TT-BGDĐT.
Hãy viết 1 câu nhận xét (1-2 câu ngắn, 15-35 từ, bắt đầu bằng "Em...") cho 1 học sinh:
- Môn học: ${subject}
- Kỳ: ${term}
- Mức xếp loại: ${level} (T: Hoàn thành tốt, H: Hoàn thành, C: Chưa hoàn thành)
- Điểm kiểm tra (nếu có): ${score !== null && score !== undefined ? score : 'Không có'}
- Kỹ năng cụ thể của học sinh: ${specificSkills || 'Đặc thù kỹ năng môn ' + subject}
- Phong cách: ${tone}

Yêu cầu:
- Tự động liên hệ giữa điểm số và kỹ năng.
- Không nêu trực tiếp con số điểm, tập trung nhận xét vào sự thành thạo kỹ năng và năng lực vận dụng.
- Đúng chuẩn mực sư phạm, khích lệ học sinh.
Chỉ trả về 1 chuỗi văn bản nhận xét duy nhất, không có ngoặc kép ngoài cùng hay markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });

    const cmt = (response.text || '').replace(/^["']|["']$/g, '').trim();
    return res.json({ success: true, cmt });
  } catch (error: any) {
    console.error('Single comment generation error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi gọi AI.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend in dev (via Vite middleware) or prod (via dist)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
