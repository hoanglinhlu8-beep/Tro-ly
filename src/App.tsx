import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { INITIAL_BANK, BankItem } from './data/seedBank';
import { SAMPLE_STUDENTS, StudentRow } from './data/sampleData';
import {
  norm,
  colL,
  detectHeaders,
  buildStudentRows,
  exportWorkbook,
  DetectedMap,
  DetectedMeta,
} from './utils/excel';
import {
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Copy,
  BookmarkPlus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Filter,
  Search,
  Settings2,
} from 'lucide-react';

const TN: Record<string, string> = {
  GK1: 'Giữa kỳ I',
  CK1: 'Cuối kỳ I',
  GK2: 'Giữa kỳ II',
  CK2: 'Cuối kỳ II',
  '*': 'Mọi kỳ',
};

const BN: Record<string, string> = {
  '': 'Mọi điểm',
  cao: 'Điểm cao (≥ 8)',
  tb: 'Điểm trung bình (6 - 7.5)',
  thap: 'Điểm thấp (< 6)',
};

const QUICK_SKILL_SUGGESTIONS: Record<string, string[]> = {
  Toán: [
    'Tính nhẩm nhanh, trình bày khoa học',
    'Tư duy giải toán có lời văn tốt',
    'Nắm chắc bảng nhân chia, cẩn thận',
    'Tư duy hình học và vẽ hình chuẩn xác',
    'Cần rèn thêm kỹ năng đặt tính và tính nhẩm',
  ],
  'Tiếng Việt': [
    'Đọc to, rõ ràng, diễn cảm tốt',
    'Vốn từ phong phú, câu văn sinh động',
    'Chữ viết đều, nắn nót, giữ vở sạch',
    'Kỹ năng đọc hiểu và cảm thụ bài tốt',
    'Cần chú ý viết đúng chính tả và đặt dấu câu',
  ],
  'Tiếng Anh': [
    'Phát âm chuẩn, giao tiếp tự tin',
    'Ghi nhớ từ vựng tốt, phản xạ nhanh',
    'Chủ động tương tác hội thoại với bạn bè',
    'Cần rèn thêm kỹ năng nghe và ghi nhớ từ mới',
  ],
  'Tin học': [
    'Thao tác chuột và bàn phím thành thạo',
    'Thực hành đúng quy trình và biết tự khám phá',
    'Tư duy lập trình trực quan nhanh nhẹn',
    'Cần rèn thêm kỹ năng gõ 10 ngón đúng cách',
  ],
  'Công nghệ': [
    'Khéo léo trong các sản phẩm thực hành',
    'Hiểu nguyên lý và có ý thức an toàn',
    'Có khả năng sáng tạo mô hình đẹp mắt',
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'a' | 'b' | 'c'>('a');

  // Excel state
  const [wb, setWb] = useState<any | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [grid, setGrid] = useState<any[][]>([]);
  const [hdrRow, setHdrRow] = useState<number>(0);
  const [map, setMap] = useState<DetectedMap>({
    name: -1,
    cmt: -1,
    xl: -1,
    sc: -1,
    stt: -1,
    skills: -1,
  });
  const [offset, setOffset] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [rangeRef, setRangeRef] = useState<any>(null);

  // Meta information
  const [meta, setMeta] = useState<DetectedMeta>({
    subject: 'Toán',
    term: 'GK1',
    cls: '4A',
  });

  // Students list
  const [rows, setRows] = useState<StudentRow[]>([]);

  // Score config
  const [useSc, setUseSc] = useState<boolean>(true);
  const [hiScore, setHiScore] = useState<number>(8);
  const [loScore, setLoScore] = useState<number>(6);
  const [generalSkillsFocus, setGeneralSkillsFocus] = useState<string>(
    'Kỹ năng tính nhẩm, giải toán có lời văn, trình bày cẩn thận'
  );

  // Quick paste textareas
  const [pasteXl, setPasteXl] = useState<string>('');
  const [pasteSc, setPasteSc] = useState<string>('');
  const [pasteSkills, setPasteSkills] = useState<string>('');
  const [fillLevel, setFillLevel] = useState<'T' | 'H' | 'C'>('T');

  // Filter & Search
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [overrideExisting, setOverrideExisting] = useState<boolean>(false);
  const [aiTone, setAiTone] = useState<string>('khích lệ, động viên (chuẩn Thông tư 27)');

  // AI progress
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiProgressText, setAiProgressText] = useState<string>('');
  const [generatingRowIdx, setGeneratingRowIdx] = useState<number | null>(null);

  // Comment bank state
  const [bank, setBank] = useState<BankItem[]>(INITIAL_BANK);
  const [bankLvl, setBankLvl] = useState<'T' | 'H' | 'C'>('T');
  const [bankBand, setBankBand] = useState<'' | 'cao' | 'tb' | 'thap'>('');
  const [bankTerm, setBankTerm] = useState<string>('*');
  const [bankSubj, setBankSubj] = useState<string>('*');
  const [bankText, setBankText] = useState<string>('');
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [deleteArmId, setDeleteArmId] = useState<number | null>(null);

  // Filter bank tab
  const [filterBankLvl, setFilterBankLvl] = useState<string>('');
  const [filterBankTerm, setFilterBankTerm] = useState<string>('');
  const [filterBankSubj, setFilterBankSubj] = useState<string>('');
  const [filterBankSearch, setFilterBankSearch] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedBank = localStorage.getItem('tl_bank');
      if (savedBank) {
        const parsed = JSON.parse(savedBank);
        if (Array.isArray(parsed) && parsed.length > 0) setBank(parsed);
      }
      const savedSess = localStorage.getItem('tl_sess');
      if (savedSess) {
        const s = JSON.parse(savedSess);
        if (s && Array.isArray(s.rows) && s.rows.length > 0) {
          setRows(s.rows);
          if (s.meta) setMeta(s.meta);
          if (s.map) setMap(s.map);
          if (s.fileName) setFileName(s.fileName);
        }
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }, []);

  // Save to LocalStorage
  const persistSession = (currentRows: StudentRow[], currentMeta: DetectedMeta, currentMap: DetectedMap, fname: string) => {
    try {
      localStorage.setItem('tl_sess', JSON.stringify({
        rows: currentRows,
        meta: currentMeta,
        map: currentMap,
        fileName: fname,
      }));
    } catch (e) {}
  };

  const persistBank = (newBank: BankItem[]) => {
    try {
      localStorage.setItem('tl_bank', JSON.stringify(newBank));
    } catch (e) {}
  };

  // Load sample dataset
  const handleLoadSample = () => {
    setFileName('Mau_Bang_Diem_Toan_Lop_4A.xlsx');
    setSheetName('Toán_GK1');
    setSheetNames(['Toán_GK1']);
    setMeta({
      subject: 'Toán',
      term: 'GK1',
      cls: '4A',
    });
    setMap({
      stt: 0,
      name: 1,
      sc: 2,
      xl: 3,
      skills: 4,
      cmt: 5,
    });
    setGeneralSkillsFocus('Kỹ năng tính nhẩm, giải toán có lời văn, tư duy logic, trình bày sạch đẹp');
    setRows(SAMPLE_STUDENTS);
    persistSession(SAMPLE_STUDENTS, { subject: 'Toán', term: 'GK1', cls: '4A' }, {
      stt: 0,
      name: 1,
      sc: 2,
      xl: 3,
      skills: 4,
      cmt: 5,
    }, 'Mau_Bang_Diem_Toan_Lop_4A.xlsx');
    showToast('Đã nạp dữ liệu mẫu Lớp 4A kèm điểm số và kỹ năng học sinh!');
  };

  // Process uploaded Excel file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadExcelFile(file);
  };

  const loadExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        setWb(workbook);
        setFileName(file.name);
        setSheetNames(workbook.SheetNames);
        const initialSheet = workbook.SheetNames[0];
        setSheetName(initialSheet);
        parseWorkbookSheet(workbook, initialSheet, file.name);
      } catch (err) {
        showToast('Không đọc được file Excel. Vui lòng kiểm tra file .xls/.xlsx hợp lệ.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseWorkbookSheet = (workbook: any, sheet: string, currentFileName: string) => {
    const ws = workbook.Sheets[sheet];
    if (!ws) return;
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    setOffset(range.s);
    setRangeRef(range);

    const sheetGrid: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: true,
    });
    setGrid(sheetGrid);

    // Find header row: contains "ho va ten" or row with >= 3 non-empty cells
    let hIdx = sheetGrid.findIndex((r) => r.some((c) => norm(c) === 'ho va ten'));
    if (hIdx < 0) {
      hIdx = sheetGrid.findIndex((r) => r.filter((c) => String(c).trim() !== '').length >= 3);
    }
    const detectedHdr = Math.max(hIdx, 0);
    setHdrRow(detectedHdr);

    const { map: detectedMap, meta: detectedMeta } = detectHeaders(sheetGrid, detectedHdr);
    setMap(detectedMap);
    setMeta(detectedMeta);

    // Auto set general skills focus according to subject
    if (detectedMeta.subject && QUICK_SKILL_SUGGESTIONS[detectedMeta.subject]) {
      setGeneralSkillsFocus(QUICK_SKILL_SUGGESTIONS[detectedMeta.subject].slice(0, 3).join(', '));
    }

    const studentRows = buildStudentRows(sheetGrid, detectedHdr, detectedMap);
    setRows(studentRows);
    persistSession(studentRows, detectedMeta, detectedMap, currentFileName);
    showToast(`Đã đọc thành công ${studentRows.length} học sinh từ file!`);
  };

  // Re-build rows when header row or column mapping changes
  const handleHdrChange = (newHdrVal: number) => {
    const idx = Math.max(0, newHdrVal - 1);
    setHdrRow(idx);
    if (grid.length > 0) {
      const { map: newMap, meta: newMeta } = detectHeaders(grid, idx);
      setMap(newMap);
      setMeta(newMeta);
      const studentRows = buildStudentRows(grid, idx, newMap);
      setRows(studentRows);
      persistSession(studentRows, newMeta, newMap, fileName);
    }
  };

  const handleMapChange = (key: keyof DetectedMap, colIndex: number) => {
    const newMap = { ...map, [key]: colIndex };
    setMap(newMap);
    if (grid.length > 0) {
      const studentRows = buildStudentRows(grid, hdrRow, newMap);
      setRows(studentRows);
      persistSession(studentRows, meta, newMap, fileName);
    }
  };

  // Determine score band
  const getScoreBand = (score: number | null | undefined): '' | 'cao' | 'tb' | 'thap' => {
    if (!useSc || score === null || score === undefined || isNaN(score)) return '';
    if (score >= hiScore) return 'cao';
    if (score < loScore) return 'thap';
    return 'tb';
  };

  // Offline / Bank-based fallback generation for a student
  const generateFromBank = (r: StudentRow, usedCount: Record<number, number>): string => {
    if (!['T', 'H', 'C'].includes(r.xl)) return '';
    const sjNorm = norm(meta.subject);
    const tm = meta.term;
    const band = getScoreBand(r.sc);

    const candidates = bank.filter(
      (b) => b.lvl === r.xl && (b.term === '*' || b.term === tm)
    );

    const matchSubject = (b: BankItem) => b.subj === '*' || sjNorm.includes(norm(b.subj));

    const tiers: BankItem[][] = [];
    if (band) {
      tiers.push(candidates.filter((b) => b.band === band));
    }
    tiers.push(candidates.filter((b) => !b.band));

    let pool: BankItem[] = [];
    for (const t of tiers) {
      const specific = t.filter((b) => b.subj !== '*' && matchSubject(b));
      const general = t.filter((b) => b.subj === '*');
      pool = specific.length >= 2 ? specific : specific.concat(general);
      if (pool.length) break;
    }

    if (!pool.length) return '';
    pool = pool.slice().sort(() => Math.random() - 0.5);

    let best = pool[0];
    for (const b of pool) {
      if ((usedCount[b.id] || 0) < (usedCount[best.id] || 0)) {
        best = b;
      }
    }

    usedCount[best.id] = (usedCount[best.id] || 0) + 1;
    return best.text;
  };

  // AI-powered Comment Generation for Entire Class or Selected Students
  const handleGenerateAI = async (onlySelected: boolean) => {
    const targetIndices: number[] = [];
    let skippedCount = 0;

    rows.forEach((r, i) => {
      if (onlySelected && !r.sel) return;
      if (!['T', 'H', 'C'].includes(r.xl)) return;
      if (!onlySelected && r.cmt && r.cmt !== r.auto && !overrideExisting) {
        skippedCount++;
        return;
      }
      targetIndices.push(i);
    });

    if (targetIndices.length === 0) {
      if (skippedCount > 0) {
        showToast('Các nhận xét đã sửa được giữ nguyên. Hãy tick "Ghi đè" nếu muốn tạo lại tất cả.');
      } else {
        showToast('Vui lòng chọn hoặc nhập xếp loại T/H/C cho học sinh trước khi tạo nhận xét.');
      }
      return;
    }

    setIsAiGenerating(true);
    let aiSuccessCount = 0;
    let fallbackCount = 0;
    const bankUsageCount: Record<number, number> = {};
    const updatedRows = [...rows];

    // Gather sample bank comments for the AI to emulate teacher style
    const sampleEx = bank
      .filter((b) => b.term === '*' || b.term === meta.term)
      .slice(0, 5)
      .map((b) => b.text);

    // Process in batches of 10 to ensure responsive UX and avoid rate limits
    const BATCH_SIZE = 10;
    for (let start = 0; start < targetIndices.length; start += BATCH_SIZE) {
      const chunkIndices = targetIndices.slice(start, start + BATCH_SIZE);
      setAiProgressText(
        `AI đang nhận xét tự động dựa trên điểm số & kỹ năng... (${Math.min(
          start + BATCH_SIZE,
          targetIndices.length
        )}/${targetIndices.length} học sinh)`
      );

      const itemsPayload = chunkIndices.map((rowIdx) => {
        const student = updatedRows[rowIdx];
        return {
          id: rowIdx,
          level: student.xl,
          score: student.sc,
          specificSkills: student.skills,
          scoreBand: getScoreBand(student.sc),
        };
      });

      try {
        const response = await fetch('/api/generate-comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: meta.subject || 'Chung',
            term: TN[meta.term] || meta.term || 'Định kỳ',
            gradeClass: meta.cls,
            generalSkillsFocus,
            items: itemsPayload,
            tone: aiTone,
            sampleExamples: sampleEx,
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.comments)) {
          const mapById: Record<string, string> = {};
          data.comments.forEach((c: any) => {
            if (c.id !== undefined && c.cmt) {
              mapById[String(c.id)] = c.cmt;
            }
          });

          chunkIndices.forEach((rowIdx) => {
            const comment = mapById[String(rowIdx)];
            if (comment) {
              updatedRows[rowIdx].cmt = comment;
              updatedRows[rowIdx].auto = comment;
              aiSuccessCount++;
            } else {
              const fallback = generateFromBank(updatedRows[rowIdx], bankUsageCount);
              if (fallback) {
                updatedRows[rowIdx].cmt = fallback;
                updatedRows[rowIdx].auto = fallback;
                fallbackCount++;
              }
            }
          });
        } else {
          throw new Error(data.error || 'Lỗi xử lý phản hồi từ server');
        }
      } catch (err: any) {
        console.warn('AI call failed, falling back to local comment bank:', err);
        chunkIndices.forEach((rowIdx) => {
          const fallback = generateFromBank(updatedRows[rowIdx], bankUsageCount);
          if (fallback) {
            updatedRows[rowIdx].cmt = fallback;
            updatedRows[rowIdx].auto = fallback;
            fallbackCount++;
          }
        });
      }

      setRows([...updatedRows]);
      persistSession(updatedRows, meta, map, fileName);
    }

    setIsAiGenerating(false);
    setAiProgressText('');

    if (aiSuccessCount > 0) {
      showToast(
        `✨ AI đã hoàn thành tạo nhận xét cho ${aiSuccessCount} học sinh dựa trên điểm số và kỹ năng!` +
          (fallbackCount > 0 ? ` (${fallbackCount} nhận xét dùng kho mẫu dự phòng)` : '') +
          (skippedCount > 0 ? `, giữ nguyên ${skippedCount} nhận xét sẵn có.` : '')
      );
    } else if (fallbackCount > 0) {
      showToast(`Đã tạo ${fallbackCount} nhận xét từ kho mẫu theo chuẩn Thông tư 27.`);
    }
  };

  // Generate single student comment via AI (🔄 button)
  const handleGenerateSingleAI = async (index: number) => {
    const student = rows[index];
    if (!['T', 'H', 'C'].includes(student.xl)) {
      showToast('Vui lòng chọn xếp loại T/H/C cho học sinh này trước.');
      return;
    }

    setGeneratingRowIdx(index);
    try {
      const response = await fetch('/api/generate-single-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: meta.subject || 'Chung',
          term: TN[meta.term] || meta.term || 'Định kỳ',
          level: student.xl,
          score: student.sc,
          specificSkills: student.skills,
          tone: aiTone,
        }),
      });

      const data = await response.json();
      if (data.success && data.cmt) {
        const updated = [...rows];
        updated[index].cmt = data.cmt;
        updated[index].auto = data.cmt;
        setRows(updated);
        persistSession(updated, meta, map, fileName);
        showToast(`Đã tạo lại nhận xét AI cho em ${student.name}!`);
      } else {
        throw new Error(data.error || 'Lỗi server');
      }
    } catch (err) {
      // Fallback
      const fallback = generateFromBank(student, {});
      if (fallback) {
        const updated = [...rows];
        updated[index].cmt = fallback;
        updated[index].auto = fallback;
        setRows(updated);
        persistSession(updated, meta, map, fileName);
        showToast('Đã tạo nhận xét mẫu phù hợp cho học sinh này.');
      }
    } finally {
      setGeneratingRowIdx(null);
    }
  };

  // Copy comment to clipboard
  const handleCopyComment = (text: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('Đã sao chép nhận xét vào bộ nhớ tạm!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Đã sao chép nhận xét!');
      });
  };

  // Save modified comment to bank
  const handleSaveToBank = (student: StudentRow) => {
    if (!student.cmt || !['T', 'H', 'C'].includes(student.xl)) {
      showToast('Cần có xếp loại và nội dung nhận xét để lưu vào kho.');
      return;
    }
    const cleanText = student.cmt.trim();
    const isDup = bank.some(
      (b) => b.lvl === student.xl && b.text === cleanText && b.subj === (meta.subject || '*')
    );
    if (isDup) {
      showToast('Câu nhận xét này đã tồn tại trong kho.');
      return;
    }

    const newItem: BankItem = {
      id: Date.now(),
      lvl: student.xl as 'T' | 'H' | 'C',
      band: getScoreBand(student.sc),
      subj: meta.subject || '*',
      term: meta.term || '*',
      text: cleanText,
      skill: student.skills || '',
    };
    const updatedBank = [...bank, newItem];
    setBank(updatedBank);
    persistBank(updatedBank);
    showToast('Đã lưu câu nhận xét vào kho mẫu!');
  };

  // Save all modified comments to bank
  const handleSaveAllModifiedToBank = () => {
    let count = 0;
    const newItems: BankItem[] = [];

    rows.forEach((r) => {
      if (r.cmt && r.auto && r.cmt !== r.auto && ['T', 'H', 'C'].includes(r.xl)) {
        const isDup =
          bank.some((b) => b.lvl === r.xl && b.text === r.cmt.trim()) ||
          newItems.some((b) => b.lvl === r.xl && b.text === r.cmt.trim());
        if (!isDup) {
          newItems.push({
            id: Date.now() + Math.random(),
            lvl: r.xl as 'T',
            band: getScoreBand(r.sc),
            subj: meta.subject || '*',
            term: meta.term || '*',
            text: r.cmt.trim(),
            skill: r.skills || '',
          });
          count++;
        }
      }
    });

    if (count > 0) {
      const updated = [...bank, ...newItems];
      setBank(updated);
      persistBank(updated);
      showToast(`Đã lưu ${count} câu nhận xét đã sửa vào kho!`);
    } else {
      showToast('Chưa có nhận xét nào được sửa đổi để lưu vào kho.');
    }
  };

  // Quick fill Level, Score, or Skills from textarea
  const handleApplyPasteXl = () => {
    const lines = pasteXl
      .split('\n')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l !== '');
    if (lines.length === 0) return;

    const updated = rows.map((r, i) => {
      if (i < lines.length && ['T', 'H', 'C'].includes(lines[i])) {
        return { ...r, xl: lines[i] };
      }
      return r;
    });
    setRows(updated);
    persistSession(updated, meta, map, fileName);
    showToast(`Đã điền xếp loại cho ${Math.min(lines.length, rows.length)} học sinh.`);
  };

  const handleApplyPasteSc = () => {
    const lines = pasteSc
      .split('\n')
      .map((l) => l.trim().replace(',', '.'))
      .filter((l) => l !== '');
    if (lines.length === 0) return;

    const updated = rows.map((r, i) => {
      if (i < lines.length) {
        const val = parseFloat(lines[i]);
        return { ...r, sc: isNaN(val) ? null : val };
      }
      return r;
    });
    setRows(updated);
    persistSession(updated, meta, map, fileName);
    showToast(`Đã điền điểm số cho ${Math.min(lines.length, rows.length)} học sinh.`);
  };

  const handleApplyPasteSkills = () => {
    const lines = pasteSkills.split('\n').map((l) => l.trim());
    if (lines.length === 0) return;

    const updated = rows.map((r, i) => {
      if (i < lines.length && lines[i]) {
        return { ...r, skills: lines[i] };
      }
      return r;
    });
    setRows(updated);
    persistSession(updated, meta, map, fileName);
    showToast(`Đã điền kỹ năng cho ${Math.min(lines.length, rows.length)} học sinh.`);
  };

  const handleFillEmptyLevel = () => {
    let count = 0;
    const updated = rows.map((r) => {
      if (!r.xl) {
        count++;
        return { ...r, xl: fillLevel };
      }
      return r;
    });
    setRows(updated);
    persistSession(updated, meta, map, fileName);
    showToast(`Đã đặt mức ${fillLevel} cho ${count} học sinh chưa có xếp loại.`);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (rows.length === 0) {
      showToast('Chưa có danh sách học sinh để xuất file.');
      return;
    }

    try {
      const buffer = exportWorkbook(
        rows,
        meta,
        wb,
        sheetName,
        map,
        hdrRow,
        offset,
        rangeRef
      );

      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cleanClass = norm(meta.cls).replace(/[^a-z0-9]/gi, '_').toUpperCase() || 'LOP';
      const cleanTerm = meta.term || 'KY';
      const downloadName = `Nhan_xet_${meta.subject || 'Mon'}_${cleanTerm}_Lop_${cleanClass}.xlsx`;

      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Đã xuất file thành công: ${downloadName}!`);
    } catch (e: any) {
      console.error('Export error:', e);
      showToast('Lỗi khi xuất file Excel.');
    }
  };

  // Bank Actions (Add, Edit, Delete, Export, Import)
  const handleAddOrUpdateBank = () => {
    if (!bankText.trim()) {
      showToast('Vui lòng nhập nội dung nhận xét.');
      return;
    }

    if (editingBankId !== null) {
      const updated = bank.map((b) =>
        b.id === editingBankId
          ? {
              ...b,
              lvl: bankLvl,
              band: bankBand,
              term: bankTerm,
              subj: bankSubj.trim() || '*',
              text: bankText.trim(),
            }
          : b
      );
      setBank(updated);
      persistBank(updated);
      setEditingBankId(null);
      setBankText('');
      showToast('Đã cập nhật câu nhận xét!');
    } else {
      const newItem: BankItem = {
        id: Date.now(),
        lvl: bankLvl,
        band: bankBand,
        term: bankTerm,
        subj: bankSubj.trim() || '*',
        text: bankText.trim(),
      };
      const updated = [...bank, newItem];
      setBank(updated);
      persistBank(updated);
      setBankText('');
      showToast('Đã thêm câu mới vào kho nhận xét!');
    }
  };

  const handleDeleteBank = (id: number) => {
    if (deleteArmId === id) {
      const updated = bank.filter((b) => b.id !== id);
      setBank(updated);
      persistBank(updated);
      setDeleteArmId(null);
      showToast('Đã xóa câu nhận xét.');
    } else {
      setDeleteArmId(id);
    }
  };

  const handleExportBankJson = () => {
    const jsonStr = JSON.stringify(bank, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kho_nhan_xet_Tieu_hoc_TT27.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất kho nhận xét ra file JSON!');
  };

  const handleImportBankJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          let count = 0;
          const merged = [...bank];
          parsed.forEach((item: any) => {
            if (['T', 'H', 'C'].includes(item.lvl) && item.text) {
              const exists = merged.some(
                (m) => m.lvl === item.lvl && m.text.trim() === item.text.trim()
              );
              if (!exists) {
                merged.push({
                  id: Date.now() + Math.random(),
                  lvl: item.lvl,
                  band: item.band || '',
                  subj: item.subj || '*',
                  term: item.term || '*',
                  text: item.text.trim(),
                  skill: item.skill || '',
                });
                count++;
              }
            }
          });
          setBank(merged);
          persistBank(merged);
          showToast(`Đã nhập thành công ${count} câu nhận xét mới vào kho!`);
        }
      } catch (err) {
        showToast('File JSON không đúng định dạng kho nhận xét.');
      }
    };
    reader.readAsText(file);
  };

  // Warning flags for each student
  const duplicateNameCounts = useMemo(() => {
    const countMap: Record<string, number> = {};
    rows.forEach((r) => {
      const n = norm(r.name);
      countMap[n] = (countMap[n] || 0) + 1;
    });
    return countMap;
  }, [rows]);

  const getStudentFlags = (r: StudentRow): string[] => {
    const f: string[] = [];
    if (!r.xl) {
      f.push('Chưa có xếp loại');
    } else if (!['T', 'H', 'C'].includes(r.xl)) {
      f.push(`Mức "${r.xl}" không thuộc T/H/C`);
    }

    if (map.sc >= 0 && r.sc === null) {
      f.push('Thiếu điểm kiểm tra');
    }

    if (map.sc >= 0 && r.sc !== null && useSc) {
      if (r.xl === 'T' && r.sc < loScore) {
        f.push(`Điểm ${r.sc} thấp nhưng mức T, thầy cô nên kiểm tra`);
      }
      if (r.xl === 'C' && r.sc >= hiScore) {
        f.push(`Điểm ${r.sc} cao nhưng mức C, thầy cô nên kiểm tra`);
      }
    }

    if (duplicateNameCounts[norm(r.name)] > 1) {
      f.push('Trùng họ tên trong danh sách');
    }

    return f;
  };

  // Summary counts
  const stats = useMemo(() => {
    let t = 0,
      h = 0,
      c = 0,
      unclassified = 0,
      hasCmt = 0;
    rows.forEach((r) => {
      if (r.xl === 'T') t++;
      else if (r.xl === 'H') h++;
      else if (r.xl === 'C') c++;
      else unclassified++;

      if (r.cmt && r.cmt.trim() !== '') hasCmt++;
    });
    return { total: rows.length, t, h, c, unclassified, hasCmt };
  }, [rows]);

  // Filtered student list
  const filteredRows = useMemo(() => {
    const q = norm(searchName);
    return rows
      .map((r, originalIdx) => ({ r, originalIdx }))
      .filter(({ r }) => {
        if (filterLevel === 'none') {
          if (['T', 'H', 'C'].includes(r.xl)) return false;
        } else if (filterLevel) {
          if (r.xl !== filterLevel) return false;
        }
        if (q && !norm(r.name).includes(q)) return false;
        return true;
      });
  }, [rows, filterLevel, searchName]);

  // Filtered bank list
  const filteredBank = useMemo(() => {
    const q = norm(filterBankSearch);
    return bank.filter((b) => {
      if (filterBankLvl && b.lvl !== filterBankLvl) return false;
      if (filterBankTerm && b.term !== filterBankTerm) return false;
      if (filterBankSubj && b.subj !== filterBankSubj && b.subj !== '*') return false;
      if (q && !norm(b.text + ' ' + b.subj).includes(q)) return false;
      return true;
    });
  }, [bank, filterBankLvl, filterBankTerm, filterBankSubj, filterBankSearch]);

  const hasScoreCol = map.sc >= 0 || rows.some((r) => r.sc !== null);
  const allSelected = rows.length > 0 && rows.every((r) => r.sel);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fb] dark:bg-[#0f172a] text-[#1f2937] dark:text-[#f1f5f9]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 border border-slate-700/50 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-5 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>📝</span> Trợ lý nhận xét năng lực học sinh tiểu học
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Tải bảng điểm Excel → chọn mức T/H/C → tạo nhận xét tự động bằng AI dựa trên điểm số và kỹ năng → tải file về.
              Họ tên học sinh luôn ở trên máy của thầy/cô; khi nhờ AI viết nhận xét chỉ gửi môn, kỳ, mức T/H/C, điểm và kỹ năng.
            </p>
          </div>
          {rows.length === 0 && (
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Dùng thử dữ liệu mẫu Lớp 4A</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-5 pb-16 flex-1">
        {/* Navigation Tabs */}
        <div className="flex gap-2 my-3 border-b border-gray-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('a')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'a'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
            }`}
          >
            <span>1. Danh sách &amp; nhận xét</span>
            {rows.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'a' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                {rows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('b')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'b'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Kho nhận xét ({bank.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('c')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'c'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3. Hướng dẫn TT 27</span>
          </button>
        </div>

        {/* TAB 1: Danh sách & Nhận xét */}
        {activeTab === 'a' && (
          <div className="space-y-3.5">
            {/* File Upload Dropzone */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) loadExcelFile(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl py-6 px-4 text-center cursor-pointer transition bg-gray-50/60 dark:bg-slate-850/60"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold">
                    📂 Bấm để chọn file Excel (.xls hoặc .xlsx) hoặc kéo thả vào đây
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {fileName ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Đang chọn: {fileName} ({rows.length} học sinh)
                      </span>
                    ) : (
                      'Chưa có file (hoặc bấm nút "Dùng thử dữ liệu mẫu Lớp 4A" ở góc trên)'
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* When rows exist, render the full workspace */}
            {rows.length > 0 && (
              <>
                {/* 6 Stats Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-gray-900 dark:text-white">
                      {stats.total}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Tổng học sinh</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-emerald-600 dark:text-emerald-400">
                      {stats.t}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Mức T (Tốt)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-amber-600 dark:text-amber-400">
                      {stats.h}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Mức H (Hoàn thành)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-rose-600 dark:text-rose-400">
                      {stats.c}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Mức C (Chưa HT)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-purple-600 dark:text-purple-400">
                      {stats.unclassified}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Chưa xếp loại</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
                    <b className="text-xl sm:text-2xl font-bold block text-blue-600 dark:text-blue-400">
                      {stats.hasCmt} / {stats.total}
                    </b>
                    <span className="text-xs text-gray-500 dark:text-slate-400">Đã có nhận xét</span>
                  </div>
                </div>

                {/* Card Thông tin & Ghép cột */}
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                    <div className="font-semibold text-sm">
                      📋 Thông tin &amp; Ghép cột{' '}
                      <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
                        (đã tự nhận diện từ Excel, thầy/cô có thể chỉnh)
                      </span>
                    </div>
                  </div>

                  {/* Header Row & Column Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {sheetNames.length > 0 && (
                      <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                        <span>Trang tính</span>
                        <select
                          value={sheetName}
                          onChange={(e) => {
                            setSheetName(e.target.value);
                            if (wb) parseWorkbookSheet(wb, e.target.value, fileName);
                          }}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                        >
                          {sheetNames.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Dòng tiêu đề</span>
                      <input
                        type="number"
                        min="1"
                        value={hdrRow + 1}
                        onChange={(e) => handleHdrChange(+e.target.value || 1)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      />
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Cột họ tên</span>
                      <select
                        value={map.name}
                        onChange={(e) => handleMapChange('name', +e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      >
                        <option value="-1">(chưa có)</option>
                        {(grid[hdrRow] || []).map((col: any, j: number) => (
                          <option key={j} value={j}>
                            {String(col || `Cột ${colL(j)}`)} (cột {colL(j)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Cột xếp loại</span>
                      <select
                        value={map.xl}
                        onChange={(e) => handleMapChange('xl', +e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      >
                        <option value="-1">(chưa có)</option>
                        {(grid[hdrRow] || []).map((col: any, j: number) => (
                          <option key={j} value={j}>
                            {String(col || `Cột ${colL(j)}`)} (cột {colL(j)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Cột điểm</span>
                      <select
                        value={map.sc}
                        onChange={(e) => handleMapChange('sc', +e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      >
                        <option value="-1">(không có)</option>
                        {(grid[hdrRow] || []).map((col: any, j: number) => (
                          <option key={j} value={j}>
                            {String(col || `Cột ${colL(j)}`)} (cột {colL(j)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Cột nhận xét</span>
                      <select
                        value={map.cmt}
                        onChange={(e) => handleMapChange('cmt', +e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      >
                        <option value="-1">(tạo cột mới khi xuất)</option>
                        {(grid[hdrRow] || []).map((col: any, j: number) => (
                          <option key={j} value={j}>
                            {String(col || `Cột ${colL(j)}`)} (cột {colL(j)})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Subject, Term, Class */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Môn học / Nội dung đánh giá</span>
                      <input
                        type="text"
                        value={meta.subject}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMeta({ ...meta, subject: val });
                          if (QUICK_SKILL_SUGGESTIONS[val]) {
                            setGeneralSkillsFocus(QUICK_SKILL_SUGGESTIONS[val].slice(0, 3).join(', '));
                          }
                          persistSession(rows, { ...meta, subject: val }, map, fileName);
                        }}
                        placeholder="VD: Toán, Tiếng Việt, Tin học..."
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      />
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Kỳ đánh giá</span>
                      <select
                        value={meta.term}
                        onChange={(e) => {
                          setMeta({ ...meta, term: e.target.value });
                          persistSession(rows, { ...meta, term: e.target.value }, map, fileName);
                        }}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      >
                        <option value="">(chưa rõ kỳ)</option>
                        <option value="GK1">Giữa kỳ I</option>
                        <option value="CK1">Cuối kỳ I</option>
                        <option value="GK2">Giữa kỳ II</option>
                        <option value="CK2">Cuối kỳ II</option>
                      </select>
                    </label>

                    <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                      <span>Lớp</span>
                      <input
                        type="text"
                        value={meta.cls}
                        onChange={(e) => {
                          setMeta({ ...meta, cls: e.target.value });
                          persistSession(rows, { ...meta, cls: e.target.value }, map, fileName);
                        }}
                        placeholder="VD: 4A, 3B..."
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      />
                    </label>
                  </div>

                  {/* Kỹ năng môn học & Điểm số Options */}
                  <div className="bg-gray-50/70 dark:bg-slate-850/70 border border-gray-200 dark:border-slate-700/60 rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSc}
                          onChange={(e) => setUseSc(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Dùng điểm khi AI nhận xét</span>
                      </label>

                      {useSc && (
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                            <span>Điểm “cao” từ:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={hiScore}
                              onChange={(e) => setHiScore(+e.target.value || 8)}
                              className="w-14 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs"
                            />
                          </label>
                          <label className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                            <span>Điểm “thấp” dưới:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={loScore}
                              onChange={(e) => setLoScore(+e.target.value || 6)}
                              className="w-14 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Trọng tâm kỹ năng của môn học */}
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>Trọng tâm kỹ năng môn học (để AI phân tích và đưa vào nhận xét):</span>
                      </label>
                      <input
                        type="text"
                        value={generalSkillsFocus}
                        onChange={(e) => setGeneralSkillsFocus(e.target.value)}
                        placeholder="VD: Kỹ năng tính nhẩm, giải toán có lời văn, trình bày cẩn thận..."
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-gray-800 dark:text-slate-200"
                      />
                      {/* Suggestion tags */}
                      {meta.subject && QUICK_SKILL_SUGGESTIONS[meta.subject] && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-gray-400">Gợi ý kỹ năng:</span>
                          {QUICK_SKILL_SUGGESTIONS[meta.subject].map((sugg, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!generalSkillsFocus.includes(sugg)) {
                                  setGeneralSkillsFocus(
                                    generalSkillsFocus ? `${generalSkillsFocus}, ${sugg}` : sugg
                                  );
                                }
                              }}
                              className="text-[11px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-400 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full transition cursor-pointer"
                            >
                              + {sugg}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible: Nhập nhanh xếp loại / điểm / kỹ năng */}
                  <details className="text-xs text-gray-600 dark:text-slate-400">
                    <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      ⚡ Nhập nhanh xếp loại / điểm / kỹ năng (dán từ Excel)
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2.5">
                      <div className="space-y-1">
                        <label className="font-medium">Dán cột Xếp loại (T/H/C mỗi dòng 1 em):</label>
                        <textarea
                          rows={3}
                          value={pasteXl}
                          onChange={(e) => setPasteXl(e.target.value)}
                          placeholder="T&#10;H&#10;T&#10;C"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPasteXl}
                          className="w-full py-1 px-2 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-650 text-gray-700 dark:text-slate-200 font-medium cursor-pointer"
                        >
                          Điền xếp loại theo thứ tự
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium">Dán cột Điểm số (mỗi dòng 1 em):</label>
                        <textarea
                          rows={3}
                          value={pasteSc}
                          onChange={(e) => setPasteSc(e.target.value)}
                          placeholder="9.0&#10;7.5&#10;8.0"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPasteSc}
                          className="w-full py-1 px-2 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-650 text-gray-700 dark:text-slate-200 font-medium cursor-pointer"
                        >
                          Điền điểm theo thứ tự
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium">Dán cột Kỹ năng riêng (mỗi dòng 1 em):</label>
                        <textarea
                          rows={3}
                          value={pasteSkills}
                          onChange={(e) => setPasteSkills(e.target.value)}
                          placeholder="Tính nhẩm nhanh&#10;Cần rèn thêm viết câu&#10;Chữ đẹp"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPasteSkills}
                          className="w-full py-1 px-2 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-650 text-gray-700 dark:text-slate-200 font-medium cursor-pointer"
                        >
                          Điền kỹ năng theo thứ tự
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-750 mt-2">
                      <span>Đặt mức cho các dòng chưa có xếp loại:</span>
                      <select
                        value={fillLevel}
                        onChange={(e) => setFillLevel(e.target.value as 'T')}
                        className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-2 py-0.5"
                      >
                        <option value="T">Mức T</option>
                        <option value="H">Mức H</option>
                        <option value="C">Mức C</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleFillEmptyLevel}
                        className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-650 font-medium cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </details>
                </div>

                {/* Main Action Bar */}
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* PRIMARY BUTTON: ✨ Tạo nhận xét cho cả lớp (AI) */}
                    <button
                      type="button"
                      disabled={isAiGenerating}
                      onClick={() => handleGenerateAI(false)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition cursor-pointer ${
                        isAiGenerating
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-98 ring-2 ring-blue-500/30'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : 'text-amber-300'}`} />
                      <span>✨ Tạo nhận xét cho cả lớp (AI)</span>
                    </button>

                    {/* Secondary button: Tạo lại mục đã chọn */}
                    <button
                      type="button"
                      disabled={isAiGenerating || !rows.some((r) => r.sel)}
                      onClick={() => handleGenerateAI(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-650 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer border border-gray-200 dark:border-slate-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tạo lại mục đã chọn</span>
                    </button>

                    {/* Checkbox Ghi đè */}
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-slate-300 cursor-pointer ml-1">
                      <input
                        type="checkbox"
                        checked={overrideExisting}
                        onChange={(e) => setOverrideExisting(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Ghi đè cả nhận xét đã sửa/có sẵn</span>
                    </label>

                    {/* Bộ lọc mức */}
                    <div className="flex items-center gap-1.5 text-xs ml-auto">
                      <Filter className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                      >
                        <option value="">Tất cả ({rows.length})</option>
                        <option value="T">Mức T ({stats.t})</option>
                        <option value="H">Mức H ({stats.h})</option>
                        <option value="C">Mức C ({stats.c})</option>
                        <option value="none">Chưa/sai xếp loại ({stats.unclassified})</option>
                      </select>
                    </div>

                    {/* Tìm tên */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="Tìm tên học sinh…"
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs w-36 sm:w-44"
                      />
                    </div>

                    {/* Lưu nhận xét vào kho */}
                    <button
                      type="button"
                      onClick={handleSaveAllModifiedToBank}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-650 transition cursor-pointer"
                      title="Lưu các nhận xét thầy cô đã sửa vào kho mẫu để tái sử dụng"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Lưu sửa đổi vào kho</span>
                    </button>

                    {/* Tải file Excel */}
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>⬇️ Tải file Excel</span>
                    </button>
                  </div>

                  {/* AI Generation Status / Progress */}
                  {isAiGenerating && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                          {aiProgressText || 'AI đang phân tích điểm số và kỹ năng học sinh...'}
                        </span>
                        <span>Đang xử lý</span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-2/3 animate-indeterminate" />
                      </div>
                    </div>
                  )}

                  {/* Cài đặt AI & Tùy biến */}
                  <details className="text-xs text-gray-600 dark:text-slate-400">
                    <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>⚙️ Cài đặt phong cách AI &amp; Hướng dẫn sư phạm</span>
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <label className="flex flex-col gap-1">
                        <span className="font-medium text-gray-700 dark:text-slate-300">
                          Phong cách diễn đạt của AI:
                        </span>
                        <select
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                        >
                          <option value="khích lệ, động viên (chuẩn Thông tư 27)">
                            Khích lệ, động viên, gần gũi (khuyên dùng theo TT 27)
                          </option>
                          <option value="súc tích, cô đọng, ngắn gọn">
                            Súc tích, cô đọng (dưới 20 từ)
                          </option>
                          <option value="chi tiết sâu sắc về kỹ năng môn học">
                            Phân tích sâu kỹ năng và định hướng phát triển
                          </option>
                        </select>
                      </label>
                      <div className="bg-gray-50 dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 text-[11px] text-gray-500 dark:text-slate-400">
                        Hệ thống đã tích hợp sẵn mô hình <b>Gemini 3.8 Flash</b> thế hệ mới trên máy chủ AI Studio.
                        Thầy cô không cần cấu hình API key phức tạp; khi bấm <b>✨ Tạo nhận xét cho cả lớp (AI)</b>, hệ thống sẽ tự động phân tích điểm số và kỹ năng của từng em để tạo lời nhận xét chính xác và đa dạng nhất.
                      </div>
                    </div>
                  </details>

                  {/* Sư phạm note */}
                  <div className="text-[12px] text-gray-500 dark:text-slate-400 bg-blue-50/40 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100/60 dark:border-blue-900/30">
                    💡 <b>Quy tắc sư phạm Thông tư 27:</b> AI viết nhận xét tự động dựa trên mức xếp loại, điểm số và kỹ năng của học sinh. Điểm số chỉ là căn cứ phụ điều chỉnh sắc thái; không nêu con số điểm trong nhận xét. Kỹ năng riêng của từng em giúp lời nhận xét sinh động, không trùng lặp máy móc. Thầy/cô có thể sửa trực tiếp bất kỳ ô nào trước khi tải file.
                  </div>
                </div>

                {/* Table of Students */}
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-semibold">
                          <th className="p-2.5 text-center w-10">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const updated = rows.map((r) => ({ ...r, sel: checked }));
                                setRows(updated);
                              }}
                              className="rounded text-blue-600"
                            />
                          </th>
                          <th className="p-2.5 w-12 text-center">STT</th>
                          <th className="p-2.5 w-44 font-semibold">Họ và tên</th>
                          {hasScoreCol && <th className="p-2.5 w-20 text-center">Điểm</th>}
                          <th className="p-2.5 w-24 text-center">Xếp loại</th>
                          <th className="p-2.5 w-64">
                            Kỹ năng / Năng lực nổi bật
                            <span className="block font-normal text-[10px] text-gray-400">
                              (để AI bám sát nhận xét)
                            </span>
                          </th>
                          <th className="p-2.5 min-w-[340px]">
                            Lời nhận xét (sửa trực tiếp)
                          </th>
                          <th className="p-2.5 w-28 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredRows.length > 0 ? (
                          filteredRows.map(({ r: student, originalIdx }) => {
                            const flags = getStudentFlags(student);
                            const hasWarnings = flags.length > 0;
                            const isSevere = flags.some((x) =>
                              /Chưa có xếp|không thuộc|kiểm tra/.test(x)
                            );
                            const isRowGenerating = generatingRowIdx === originalIdx;

                            return (
                              <tr
                                key={originalIdx}
                                className={`transition hover:bg-gray-50/70 dark:hover:bg-slate-750/50 ${
                                  isSevere
                                    ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                    : hasWarnings
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                    : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={student.sel}
                                    onChange={(e) => {
                                      const updated = [...rows];
                                      updated[originalIdx].sel = e.target.checked;
                                      setRows(updated);
                                    }}
                                    className="rounded text-blue-600"
                                  />
                                </td>

                                {/* STT */}
                                <td className="p-2 text-center text-gray-500 font-mono">
                                  {student.stt}
                                </td>

                                {/* Name */}
                                <td className="p-2 font-medium text-gray-900 dark:text-slate-100">
                                  {student.name}
                                </td>

                                {/* Score */}
                                {hasScoreCol && (
                                  <td className="p-2 text-center">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={student.sc ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value.trim().replace(',', '.');
                                        const num = val === '' ? null : parseFloat(val);
                                        const updated = [...rows];
                                        updated[originalIdx].sc = isNaN(num as number) ? null : num;
                                        setRows(updated);
                                        persistSession(updated, meta, map, fileName);
                                      }}
                                      className="w-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 text-center font-mono font-medium text-xs focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                )}

                                {/* Level (T/H/C) */}
                                <td className="p-2 text-center">
                                  <select
                                    value={student.xl}
                                    onChange={(e) => {
                                      const updated = [...rows];
                                      updated[originalIdx].xl = e.target.value.toUpperCase();
                                      setRows(updated);
                                      persistSession(updated, meta, map, fileName);
                                    }}
                                    className={`font-bold px-2 py-1 rounded text-xs border ${
                                      student.xl === 'T'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                        : student.xl === 'H'
                                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                        : student.xl === 'C'
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                        : 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                    }`}
                                  >
                                    <option value="">--</option>
                                    <option value="T">T</option>
                                    <option value="H">H</option>
                                    <option value="C">C</option>
                                  </select>
                                </td>

                                {/* Specific Skills */}
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={student.skills || ''}
                                    onChange={(e) => {
                                      const updated = [...rows];
                                      updated[originalIdx].skills = e.target.value;
                                      setRows(updated);
                                      persistSession(updated, meta, map, fileName);
                                    }}
                                    placeholder="VD: Tính nhẩm nhanh, chữ đẹp..."
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 placeholder:text-gray-300 dark:placeholder:text-slate-600"
                                  />
                                </td>

                                {/* Comment Area */}
                                <td className="p-2 space-y-1">
                                  <textarea
                                    rows={2}
                                    value={student.cmt}
                                    onChange={(e) => {
                                      const updated = [...rows];
                                      updated[originalIdx].cmt = e.target.value;
                                      setRows(updated);
                                      persistSession(updated, meta, map, fileName);
                                    }}
                                    placeholder="Lời nhận xét theo Thông tư 27..."
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs leading-relaxed focus:ring-1 focus:ring-blue-500 resize-y"
                                  />
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                      {student.cmt && (
                                        <span>
                                          {student.cmt.trim().split(/\s+/).filter(Boolean).length} từ
                                        </span>
                                      )}
                                      {student.cmt && student.auto && student.cmt !== student.auto && (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                                          đã chỉnh sửa
                                        </span>
                                      )}
                                      {student.cmt && student.auto && student.cmt === student.auto && (
                                        <span className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded">
                                          ✨ AI đã tạo
                                        </span>
                                      )}
                                    </div>
                                    {hasWarnings && (
                                      <div className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>{flags.join(' · ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Action Buttons */}
                                <td className="p-2 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={isRowGenerating}
                                      onClick={() => handleGenerateSingleAI(originalIdx)}
                                      title="Tạo lại nhận xét AI cho học sinh này"
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 dark:bg-slate-700 dark:hover:bg-blue-900/40 dark:text-slate-300 dark:hover:text-blue-300 transition cursor-pointer"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${isRowGenerating ? 'animate-spin text-blue-600' : ''}`} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyComment(student.cmt)}
                                      title="Sao chép nhận xét"
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 dark:bg-slate-700 dark:hover:bg-slate-650 dark:text-slate-300 transition cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveToBank(student)}
                                      title="Lưu câu nhận xét này vào kho"
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 dark:bg-slate-700 dark:hover:bg-amber-950/40 dark:text-slate-300 dark:hover:text-amber-300 transition cursor-pointer"
                                    >
                                      <BookmarkPlus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={hasScoreCol ? 8 : 7} className="p-8 text-center text-gray-400">
                              Không tìm thấy học sinh nào phù hợp bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Kho nhận xét */}
        {activeTab === 'b' && (
          <div className="space-y-4">
            {/* Form Thêm/Sửa câu */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <b className="text-sm font-semibold flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-blue-600" />
                  <span>{editingBankId !== null ? 'Chỉnh sửa câu nhận xét' : 'Thêm câu nhận xét mới vào kho'}</span>
                </b>
                {editingBankId !== null && (
                  <button
                    onClick={() => {
                      setEditingBankId(null);
                      setBankText('');
                    }}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                  <span>Mức xếp loại</span>
                  <select
                    value={bankLvl}
                    onChange={(e) => setBankLvl(e.target.value as 'T')}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-semibold"
                  >
                    <option value="T">Mức T (Hoàn thành tốt)</option>
                    <option value="H">Mức H (Hoàn thành)</option>
                    <option value="C">Mức C (Chưa hoàn thành)</option>
                  </select>
                </label>

                <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                  <span>Theo điểm số</span>
                  <select
                    value={bankBand}
                    onChange={(e) => setBankBand(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                  >
                    <option value="">Mọi điểm</option>
                    <option value="cao">Điểm cao (≥ 8)</option>
                    <option value="tb">Điểm trung bình (6 - 7.5)</option>
                    <option value="thap">Điểm thấp (&lt; 6)</option>
                  </select>
                </label>

                <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                  <span>Kỳ đánh giá</span>
                  <select
                    value={bankTerm}
                    onChange={(e) => setBankTerm(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                  >
                    <option value="*">Mọi kỳ</option>
                    <option value="GK1">Giữa kỳ I</option>
                    <option value="CK1">Cuối kỳ I</option>
                    <option value="GK2">Giữa kỳ II</option>
                    <option value="CK2">Cuối kỳ II</option>
                  </select>
                </label>

                <label className="flex flex-col text-xs text-gray-500 dark:text-slate-400 gap-1">
                  <span>Môn học (để * nếu dùng chung)</span>
                  <input
                    type="text"
                    value={bankSubj}
                    onChange={(e) => setBankSubj(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs"
                  />
                </label>
              </div>

              <textarea
                rows={2}
                value={bankText}
                onChange={(e) => setBankText(e.target.value)}
                placeholder="Nhập nội dung câu nhận xét sư phạm theo Thông tư 27 (bắt đầu bằng Em...)"
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-xs leading-relaxed focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddOrUpdateBank}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                >
                  {editingBankId !== null ? 'Lưu thay đổi' : 'Thêm câu vào kho'}
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBankJson}
                    className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-650 transition cursor-pointer"
                  >
                    Xuất kho (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-slate-750 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-650 transition cursor-pointer"
                  >
                    Nhập kho (JSON)
                  </button>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBankJson}
                  />
                </div>
              </div>
            </div>

            {/* Bộ lọc Kho */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <label className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                  <span>Mức:</span>
                  <select
                    value={filterBankLvl}
                    onChange={(e) => setFilterBankLvl(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1 text-xs"
                  >
                    <option value="">Tất cả</option>
                    <option value="T">Mức T</option>
                    <option value="H">Mức H</option>
                    <option value="C">Mức C</option>
                  </select>
                </label>

                <label className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                  <span>Kỳ:</span>
                  <select
                    value={filterBankTerm}
                    onChange={(e) => setFilterBankTerm(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-1 text-xs"
                  >
                    <option value="">Tất cả kỳ</option>
                    <option value="*">Mọi kỳ (*)</option>
                    <option value="GK1">Giữa kỳ I</option>
                    <option value="CK1">Cuối kỳ I</option>
                    <option value="GK2">Giữa kỳ II</option>
                    <option value="CK2">Cuối kỳ II</option>
                  </select>
                </label>

                <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                  <input
                    type="text"
                    value={filterBankSearch}
                    onChange={(e) => setFilterBankSearch(e.target.value)}
                    placeholder="Tìm kiếm nội dung / môn học…"
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs w-48 sm:w-64"
                  />
                </div>

                <span className="text-gray-400 ml-auto">
                  Hiển thị <b>{filteredBank.length}</b> / {bank.length} câu
                </span>
              </div>
            </div>

            {/* Bảng Kho nhận xét */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-semibold">
                      <th className="p-2.5 w-16 text-center">Mức</th>
                      <th className="p-2.5 w-28">Môn học</th>
                      <th className="p-2.5 w-24">Kỳ</th>
                      <th className="p-2.5 w-28">Điểm</th>
                      <th className="p-2.5">Nội dung câu nhận xét</th>
                      <th className="p-2.5 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredBank.length > 0 ? (
                      filteredBank.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-750/50">
                          <td className="p-2.5 text-center">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-xs ${
                                b.lvl === 'T'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : b.lvl === 'H'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {b.lvl}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{b.subj === '*' ? 'Dùng chung' : b.subj}</td>
                          <td className="p-2.5 text-gray-500">{TN[b.term] || b.term}</td>
                          <td className="p-2.5 text-gray-500">{BN[b.band] || 'Mọi điểm'}</td>
                          <td className="p-2.5 leading-relaxed">{b.text}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBankId(b.id);
                                  setBankLvl(b.lvl);
                                  setBankBand(b.band || '');
                                  setBankTerm(b.term || '*');
                                  setBankSubj(b.subj || '*');
                                  setBankText(b.text);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-700 dark:hover:bg-slate-650 dark:text-slate-200 cursor-pointer"
                                title="Sửa câu này"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBank(b.id)}
                                className={`px-1.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                                  deleteArmId === b.id
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-600 dark:bg-slate-700 dark:hover:bg-rose-950/40 dark:text-slate-200 dark:hover:text-rose-400'
                                }`}
                                title="Xóa câu"
                              >
                                {deleteArmId === b.id ? 'Xác nhận xóa?' : <Trash2 className="w-3.5 h-3.5 inline" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-400">
                          Chưa có câu nhận xét nào trong kho phù hợp bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Hướng dẫn */}
        {activeTab === 'c' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-2xs space-y-5 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📖</span> Hướng dẫn sử dụng &amp; Quy định Thông tư 27/2020/TT-BGDĐT
            </h2>

            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <b>Tải file Excel bảng điểm:</b> Bấm <b>Chọn file Excel</b> (.xls hoặc .xlsx). Ứng dụng tự động tìm dòng tiêu đề, các cột Họ tên, Xếp loại, Điểm số, Kỹ năng và Nhận xét.
              </li>
              <li>
                <b>Xếp loại và Điểm số:</b> Nếu file chưa có xếp loại, thầy/cô có thể chọn trực tiếp ở cột <b>Xếp loại (T / H / C)</b>, hoặc dùng chức năng <b>Nhập nhanh</b> để dán một lượt từ bảng điểm Excel ngoài. Ứng dụng không tự ý đổi mức xếp loại của học sinh.
              </li>
              <li>
                <b>✨ Tạo nhận xét cả lớp (AI):</b> Bấm nút <b>✨ Tạo nhận xét cho cả lớp (AI)</b>. Hệ thống AI thế hệ mới sẽ tự động phân tích:
                <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-gray-600 dark:text-slate-400">
                  <li><b>Mức xếp loại T/H/C:</b> Căn cứ cốt lõi để xác định mức độ hoàn thành nhiệm vụ môn học.</li>
                  <li><b>Điểm số kiểm tra:</b> Căn cứ phụ để điều chỉnh sắc thái và mức độ thành thạo kỹ năng (tuyệt đối không nêu con số điểm trong lời nhận xét).</li>
                  <li><b>Kỹ năng học sinh:</b> Lồng ghép các kỹ năng thực tế của từng em hoặc đặc thù của môn học để lời nhận xét mang tính cá nhân hóa, sinh động và không lặp lại máy móc.</li>
                </ul>
              </li>
              <li>
                <b>Chỉnh sửa và Tùy biến:</b> Thầy/cô có thể sửa trực tiếp nội dung ở ô Nhận xét. Bấm 🔄 để tạo lại cho 1 em riêng biệt, bấm 📋 để sao chép hoặc 📥 để lưu câu đã sửa vào kho.
              </li>
              <li>
                <b>Xuất và Tải file Excel:</b> Bấm <b>⬇️ Tải file Excel</b>: File gốc của thầy/cô được bảo lưu nguyên vẹn bố cục và công thức, lời nhận xét được điền đúng vào cột Nhận xét, đồng thời có thêm trang tính “Tổng hợp” rất tiện lợi để in ấn hoặc báo cáo.
              </li>
              <li>
                <b>Bảo mật thông tin học sinh:</b> Toàn bộ họ tên của học sinh luôn được giữ trên trình duyệt máy tính của thầy/cô. Khi gọi AI phân tích tạo nhận xét, hệ thống chỉ gửi dữ liệu ẩn danh (môn học, kỳ, mức T/H/C, điểm và kỹ năng), hoàn toàn tuân thủ an toàn dữ liệu giáo dục.
              </li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>📌</span> Tóm tắt ý nghĩa các mức đánh giá theo Thông tư 27/2020/TT-BGDĐT:
              </div>
              <p>
                - <b>Mức T (Hoàn thành tốt):</b> Học sinh thực hiện tốt các yêu cầu học tập và hồ sơ học tập; thường xuyên có biểu hiện cụ thể về các thành phần năng lực môn học; có tinh thần tự giác, chủ động và sáng tạo.
              </p>
              <p>
                - <b>Mức H (Hoàn thành):</b> Học sinh đáp ứng được các yêu cầu cơ bản trong học tập; có biểu hiện cụ thể về các thành phần năng lực của môn học; cần tiếp tục rèn luyện để vững chắc hơn.
              </p>
              <p>
                - <b>Mức C (Chưa hoàn thành):</b> Học sinh chưa đáp ứng được một số yêu cầu học tập; lời nhận xét mang tính khích lệ, gần gũi, nêu rõ nội dung cần rèn luyện và định hướng biện pháp giúp đỡ cụ thể của thầy cô.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
