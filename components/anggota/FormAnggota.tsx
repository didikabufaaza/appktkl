'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Building,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NakesMember } from '@/types/nakes';

const PERIHAL_OPTIONS = [
  'Kredensial (Pegawai Baru)',
  'Rekredensial rutin (Pegawai lama 4 tahun sekali)',
  'Rekredensial pegawai lama (setelah cuti besar 3bulan)',
  'Lainnya (tulis manual)',
];

const formSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  tanggalLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  statusKepegawaian: z.string().min(1, 'Status kepegawaian wajib dipilih'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  pendidikan: z.string().min(1, 'Pendidikan terakhir wajib dipilih'),
  profesi: z.string().min(1, 'Profesi wajib dipilih'),
  asalPendidikan: z.string().optional(),
  nomorAnggota: z.string().optional(),
  tglPermohonan: z.string().optional(),
  perihalOption: z.string().optional(),
  perihalLainnya: z.string().optional(),
  sipExpDate: z.string().optional(),
  tahunMasukRSUD: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormAnggotaProps {
  initialData?: NakesMember;
  isEdit?: boolean;
  onSuccess?: () => void;
}

function toInputDate(val?: string): string {
  if (!val) return '';
  const str = val.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return str;
}

function fromInputDate(val?: string): string {
  if (!val) return '';
  const str = val.trim();
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return str;
}

export function FormAnggota({ initialData, isEdit = false, onSuccess }: FormAnggotaProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>(initialData?.berkasUrl || initialData?.mergedDocUrl || '');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Check initial perihal option match
  const initialPerihal = initialData?.perihal || 'Kredensial (Pegawai Baru)';
  const isPresetPerihal = PERIHAL_OPTIONS.includes(initialPerihal);
  const initialOption = isPresetPerihal ? initialPerihal : 'Lainnya (tulis manual)';
  const initialLainnya = isPresetPerihal ? '' : initialPerihal;

  const todayIso = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: initialData?.namaLengkap || '',
      email: initialData?.email || initialData?.emailAddress || '',
      tanggalLahir: initialData?.tanggalLahir || '',
      statusKepegawaian: initialData?.statusKepegawaian || 'PNS',
      alamat: initialData?.alamat || '',
      pendidikan: initialData?.pendidikan || 'DIV',
      profesi: initialData?.profesi || 'ATLM',
      asalPendidikan: initialData?.asalPendidikan || '',
      nomorAnggota: initialData?.nomorAnggota || '',
      tglPermohonan: toInputDate(initialData?.tglPermohonan) || todayIso,
      perihalOption: initialOption,
      perihalLainnya: initialLainnya,
      sipExpDate: toInputDate(initialData?.sipExpDate) || '',
      tahunMasukRSUD: toInputDate(initialData?.tahunMasukRSUD) || '',
    },
  });

  const selectedPerihalOption = watch('perihalOption');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus PDF, JPG, PNG, atau JPEG.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setUploadedDocUrl(result.data.url);
        setUploadedFileName(file.name);
        toast.success(`File ${file.name} berhasil diunggah ke Google Drive!`);
      } else {
        toast.error(result.message || 'Gagal mengunggah file.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    const perihalFinal =
      values.perihalOption === 'Lainnya (tulis manual)'
        ? values.perihalLainnya || 'Lainnya'
        : values.perihalOption || 'Kredensial (Pegawai Baru)';

    const tglPermohonanFormatted = fromInputDate(values.tglPermohonan);
    const sipExpDateFormatted = fromInputDate(values.sipExpDate);
    const tahunMasukRSUDFormatted = fromInputDate(values.tahunMasukRSUD);

    try {
      const payload = {
        ...values,
        tglPermohonan: tglPermohonanFormatted,
        sipExpDate: sipExpDateFormatted,
        tahunMasukRSUD: tahunMasukRSUDFormatted,
        perihal: perihalFinal,
        berkasUrl: uploadedDocUrl,
        strUrl: uploadedDocUrl,
        sipUrl: uploadedDocUrl,
        ijazahUrl: uploadedDocUrl,
        mergedDocUrl: uploadedDocUrl,
      };

      const url = isEdit ? `/api/anggota/${initialData?.id}` : '/api/anggota';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(
          isEdit
            ? 'Data anggota berhasil diperbarui di Spreadsheet!'
            : 'Pendaftaran anggota baru berhasil disimpan ke Spreadsheet!'
        );
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/anggota');
        }
      } else {
        toast.error(result.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Seksi Biodata & Permohonan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <span>Informasi Permohonan & Biodata Lengkap Anggota</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tgl Permohonan (Input Kalender) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tgl Permohonan Kredensial / Rekredensial</span>
            </label>
            <input
              type="date"
              {...register('tglPermohonan')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono [color-scheme:dark]"
            />
          </div>

          {/* Perihal Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Perihal Permohonan <span className="text-rose-400">*</span>
            </label>
            <select
              {...register('perihalOption')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {PERIHAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Input Perihal Manual jika "Lainnya" */}
          {selectedPerihalOption === 'Lainnya (tulis manual)' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                Tulis Perihal Khusus / Manual <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                {...register('perihalLainnya')}
                placeholder="Tuliskan perihal permohonan spesifik di sini..."
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap dan Gelar <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              {...register('namaLengkap')}
              placeholder="Contoh: Muhammad Didik Wahyudi, S.ST"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.namaLengkap && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.namaLengkap.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Utama <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="nama@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Masa Habis SIP (Input Kalender) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Masa Habis SIP (Surat Izin Praktek)</span>
            </label>
            <input
              type="date"
              {...register('sipExpDate')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono [color-scheme:dark]"
            />
          </div>

          {/* Thn Masuk RSUD (Input Kalender) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Thn Masuk RSUD OKU TIMUR</span>
            </label>
            <input
              type="date"
              {...register('tahunMasukRSUD')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono [color-scheme:dark]"
            />
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tempat, Tanggal Lahir <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              {...register('tanggalLahir')}
              placeholder="Contoh: Jepara, 15 Agustus 1984"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.tanggalLahir && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.tanggalLahir.message}</p>
            )}
          </div>

          {/* Status Kepegawaian */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status Kepegawaian <span className="text-rose-400">*</span>
            </label>
            <select
              {...register('statusKepegawaian')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="PPPK PW">PPPK PW</option>
              <option value="BLUD">BLUD</option>
              <option value="Honorer">Honorer / Kontrak</option>
            </select>
          </div>

          {/* Pendidikan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pendidikan Terakhir <span className="text-rose-400">*</span>
            </label>
            <select
              {...register('pendidikan')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="DIII">DIII (Diploma Tiga)</option>
              <option value="DIV">DIV (Diploma Empat)</option>
              <option value="S1">S1 (Sarjana)</option>
              <option value="Profesi">Profesi</option>
              <option value="S2">S2 (Magister)</option>
            </select>
          </div>

          {/* Profesi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Profesi / Rumpun Nakes <span className="text-rose-400">*</span>
            </label>
            <select
              {...register('profesi')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ATLM">ATLM (Laboratorium)</option>
              <option value="APOTEKER">APOTEKER</option>
              <option value="ASISTEN APOTEKER">ASISTEN APOTEKER</option>
              <option value="RADIOGRAFER">RADIOGRAFER</option>
              <option value="FISIOTERAPIS">FISIOTERAPIS</option>
              <option value="NUTRISIONIS">NUTRISIONIS</option>
              <option value="REKAM MEDIS">REKAM MEDIS</option>
              <option value="SKM">SKM (Kesehatan Masyarakat)</option>
              <option value="PENATA ANASTESI">PENATA ANASTESI</option>
              <option value="FISIKAWAN MEDIK">FISIKAWAN MEDIK</option>
              <option value="SANITARIAN">SANITARIAN</option>
              <option value="PETUGAS TRANSFUSI DARAH">PETUGAS TRANSFUSI DARAH</option>
            </select>
          </div>

          {/* Asal Pendidikan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Asal Universitas / Poltekkes
            </label>
            <input
              type="text"
              {...register('asalPendidikan')}
              placeholder="Contoh: Poltekkes Kemenkes Palembang"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Alamat */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alamat Lengkap <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              {...register('alamat')}
              placeholder="Alamat sesuai KTP & Tempat Tinggal"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.alamat && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.alamat.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Document Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-400" />
          <span>Upload Dokumen Keanggotaan / Berkas (Google Drive)</span>
        </h2>

        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/50">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4 text-emerald-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-semibold">Mengunggah file ke Google Drive...</p>
            </div>
          ) : uploadedDocUrl ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-xs font-bold text-slate-100">Dokumen Berhasil Terupload!</p>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                {uploadedFileName || uploadedDocUrl}
              </p>
              <a
                href={uploadedDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-semibold text-emerald-400 underline underline-offset-4"
              >
                Pratinjau File di Google Drive
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">
                Pilih atau seret berkas (PDF, JPG, PNG, JPEG)
              </p>
              <p className="text-[11px] text-slate-500">
                Dokumen berkas PDF/Gambar terlampir
              </p>
              <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-all">
                <span>Browse File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Batal</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan ke Spreadsheet...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'SIMPAN PERUBAHAN' : 'SIMPAN PENDAFTARAN'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
