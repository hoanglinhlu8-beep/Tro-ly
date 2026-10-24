import * as XLSX from 'xlsx';
import { StudentRow } from '../data/sampleData';

export const norm = (s: any) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

export const colL = (j: number) => XLSX.utils.encode_col(j);

export interface DetectedMeta {
  subject: string;
  term: string;
  cls: string;
}

export interface DetectedMap {
  name: number;
  cmt: number;
  xl: number;
  sc: number;
  stt: number;
  skills: number;
}

export function detectHeaders(grid: any[][], headerRowIndex: number): { map: DetectedMap; meta: DetectedMeta } {
  const hd = grid[headerRowIndex] || [];
  const map: DetectedMap = {
    name: -1,
    cmt: -1,
    xl: -1,
    sc: -1,
    stt: -1,
    skills: -1,
  };

  hd.forEach((c: any, j: number) => {
    const n = norm(c);
    if ((n === 'ho va ten' || n === 'ho ten') && map.name < 0) map.name = j;
    else if ((n === 'nhan xet' || n.includes('nhan xet')) && map.cmt < 0) map.cmt = j;
    else if ((/^xl\b/.test(n) || n === 'xep loai' || n.includes('xep loai')) && map.xl < 0) map.xl = j;
    else if ((/^kt\b/.test(n) || /^diem/.test(n) || n === 'diem kt' || n === 'diem so') && map.sc < 0) map.sc = j;
    else if (n === 'stt' && map.stt < 0) map.stt = j;
    else if ((n.includes('ky nang') || n.includes('nang luc') || n.includes('ghi chu')) && map.skills < 0) map.skills = j;
  });

  if (map.name < 0) {
    const j = hd.findIndex((c: any) => /ten/.test(norm(c)));
    if (j >= 0) map.name = j;
  }
  if (map.xl < 0) {
    const j = hd.findIndex((c: any) => /xep loai/.test(norm(c)));
    if (j >= 0) map.xl = j;
  }

  // Detect subject, term, class from header rows (0 to headerRowIndex or first 8 rows)
  const tx = grid.slice(0, Math.max(headerRowIndex, 8)).flat().join(' ').normalize('NFC');
  const n = norm(tx);

  let term = '';
  const k = n.match(/(giua|cuoi)\s*ky\s*(1|2|i|ii)/);
  if (k) {
    const prefix = k[1].includes('giua') ? 'GK' : 'CK';
    const num = k[2] === '2' || k[2].toLowerCase() === 'ii' ? '2' : '1';
    term = prefix + num;
  }

  const sj = tx.match(/MÔN\s+(.+?)\s+-\s+HỌC\s+KỲ/i) || tx.match(/Môn[:\s]+([^,\n\r]+)/i);
  const cl = tx.match(/Lớp\s+(.+?)(?:\s{2,}|$)/i) || tx.match(/Lớp[:\s]+([^\s,\n\r]+)/i);

  const meta: DetectedMeta = {
    subject: sj ? sj[1].trim() : '',
    term,
    cls: cl ? cl[1].trim() : '',
  };

  return { map, meta };
}

export function buildStudentRows(grid: any[][], headerRowIndex: number, map: DetectedMap): StudentRow[] {
  const hd = grid[headerRowIndex] || [];
  const out: StudentRow[] = [];
  const twoColName =
    map.name >= 0 &&
    String(hd[map.name + 1] ?? '').trim() === '' &&
    map.name + 1 !== map.cmt;

  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const x = grid[r];
    if (!x || x.length === 0) continue;

    if (map.stt >= 0 && String(x[map.stt]).trim() !== '' && isNaN(+x[map.stt])) {
      continue;
    }

    const nm =
      map.name < 0
        ? ''
        : [x[map.name], twoColName ? x[map.name + 1] : '']
            .map((v) => String(v ?? '').trim())
            .filter(Boolean)
            .join(' ');

    if (!nm || norm(nm) === 'ho va ten' || norm(nm).startsWith('tong cong') || norm(nm).startsWith('nguoi lap')) {
      continue;
    }

    let sc: number | null = null;
    if (map.sc >= 0) {
      const t = String(x[map.sc] ?? '').trim().replace(',', '.');
      if (t !== '' && !isNaN(+t)) sc = +t;
    }

    const xl = map.xl >= 0 ? String(x[map.xl] ?? '').trim().toUpperCase() : '';
    const cmt = map.cmt >= 0 ? String(x[map.cmt] ?? '').trim() : '';
    const skills = map.skills >= 0 ? String(x[map.skills] ?? '').trim() : '';

    out.push({
      r,
      stt: map.stt >= 0 && x[map.stt] ? x[map.stt] : out.length + 1,
      name: nm,
      xl,
      sc,
      skills,
      cmt,
      auto: '',
      sel: false,
    });
  }

  return out;
}

export function exportWorkbook(
  rows: StudentRow[],
  meta: DetectedMeta,
  originalWb: any | null,
  sheetName: string,
  map: DetectedMap,
  headerRowIndex: number,
  offset: { r: number; c: number },
  range: any
): Uint8Array {
  const sum: (string | number)[][] = [
    ['STT', 'Họ và tên', 'Điểm', 'Xếp loại', 'Kỹ năng / Năng lực', 'Nhận xét'],
  ];
  rows.forEach((r) => {
    sum.push([r.stt, r.name, r.sc ?? '', r.xl, r.skills || '', r.cmt]);
  });

  let wb: XLSX.WorkBook;
  if (originalWb && originalWb.Sheets[sheetName]) {
    wb = originalWb;
    const ws = wb.Sheets[sheetName];
    const o = offset;
    let cc = map.cmt;
    if (cc < 0) {
      cc = range.e.c + 1;
      range.e.c = cc;
      ws['!ref'] = XLSX.utils.encode_range(range);
      ws[XLSX.utils.encode_cell({ r: o.r + headerRowIndex, c: o.c + cc })] = {
        t: 's',
        v: 'Nhận xét',
      };
    }

    // Write back updated comments, XL, and score
    rows.forEach((r) => {
      const getCellAddr = (col: number) =>
        XLSX.utils.encode_cell({ r: o.r + r.r, c: o.c + col });

      if (r.cmt) {
        ws[getCellAddr(cc)] = { t: 's', v: r.cmt };
      }
      if (map.xl >= 0 && r.xl) {
        ws[getCellAddr(map.xl)] = { t: 's', v: r.xl };
      }
      if (map.sc >= 0 && r.sc !== null && r.sc !== undefined) {
        ws[getCellAddr(map.sc)] = { t: 'n', v: r.sc };
      }
      if (map.skills >= 0 && r.skills) {
        ws[getCellAddr(map.skills)] = { t: 's', v: r.skills };
      }
    });

    ws['!cols'] = ws['!cols'] || [];
    ws['!cols'][o.c + cc] = { wch: 80 };
  } else {
    wb = XLSX.utils.book_new();
    const w1 = XLSX.utils.aoa_to_sheet(sum);
    w1['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 35 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, w1, 'Danh sách nhận xét');
  }

  // Always append/update "Tổng hợp" sheet
  const sn = 'Tổng hợp';
  if (wb.SheetNames.includes(sn)) {
    delete wb.Sheets[sn];
    wb.SheetNames = wb.SheetNames.filter((x) => x !== sn);
  }
  const w2 = XLSX.utils.aoa_to_sheet(sum);
  w2['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 35 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, w2, sn);

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(out);
}
