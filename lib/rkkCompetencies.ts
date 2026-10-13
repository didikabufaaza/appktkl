export interface RkkCompetencyItem {
  no: number;
  kompetensi: string;
}

export const RKK_COMPETENCY_MAP: Record<string, { label: string; competencies: string[] }> = {
  APOTEKER: {
    label: 'Apoteker',
    competencies: [
      'Melakukan pengkajian resep (persyaratan administratif, farmasetik, dan klinis)',
      'Melakukan penelusuran riwayat penggunaan obat pasien',
      'Melakukan rekonsiliasi obat saat admisi, transfer, dan discharge',
      'Melakukan Pelayanan Informasi Obat (PIO) kepada tenaga kesehatan lain',
      'Melakukan konseling farmasi kepada pasien/keluarga',
      'Melakukan Pemantauan Terapi Obat (PTO) pada pasien risiko tinggi',
      'Melakukan Evaluasi Penggunaan Obat (EPO)',
      'Melakukan dispensing sediaan steril (IV admixture, sitostatika) - (Sertifikasi Khusus)',
      'Melakukan pengelolaan sediaan farmasi, alkes, dan BMHP (Perencanaan s/d Pemusnahan)',
      'Melakukan monitoring Efek Samping Obat (MESO)',
    ],
  },
  'ASISTEN APOTEKER': {
    label: 'Asisten Apoteker (Tenaga Teknis Kefarmasian)',
    competencies: [
      'Melakukan skrining administratif resep dokter',
      'Menyiapkan obat dan alat kesehatan sesuai resep',
      'Melakukan peracikan obat non-steril (puyer, salep, kapsul) di bawah pengawasan',
      'Membuat etiket dan memberikan pelabelan pada sediaan farmasi',
      'Melakukan penyerahan obat disertai informasi dasar (cara pakai, penyimpanan)',
      'Melakukan pendistribusian perbekalan farmasi ke depo/ward (sistem UDD/ODD)',
      'Mendokumentasikan kartu stok dan mutasi barang',
      'Melakukan penyimpanan perbekalan farmasi sesuai standar (FEFO/FIFO, LASA/High Alert)',
    ],
  },
  ATLM: {
    label: 'Ahli Teknologi Laboratorium Medik (ATLM)',
    competencies: [
      'Melakukan pengambilan spesimen biologis (flebotomi vena, kapiler, swab, urin, feses)',
      'Melakukan preparasi dan penanganan spesimen (sentrifugasi, alikuot)',
      'Melakukan pemeriksaan hematologi (rutin, hemostasis) dan validasi hasil',
      'Melakukan pemeriksaan kimia klinik, imunologi, dan serologi',
      'Melakukan pemeriksaan mikrobiologi medik (pewarnaan, kultur, uji sensitivitas)',
      'Melakukan pemeriksaan urinalisis dan cairan tubuh lainnya',
      'Melakukan pemantapan mutu internal (PMI), termasuk penerapan Westgard Multi-rules, plotting kurva Levey-Jennings, dan evaluasi kinerja metode menggunakan metrik Sigma',
      'Melakukan verifikasi analitik dan pemeliharaan (maintenance) instrumen laboratorium',
      'Melakukan penanganan limbah infeksius dan B3 laboratorium',
    ],
  },
  FISIOTERAPIS: {
    label: 'Fisioterapi',
    competencies: [
      'Melakukan skrining dan asesmen fisioterapi komprehensif',
      'Menetapkan diagnosis dan prognosis fisioterapi',
      'Melakukan intervensi elektroterapeutik (TENS, MWD, SWD, Ultrasound)',
      'Melakukan intervensi terapi latihan (ROM, strengthening, stretching)',
      'Melakukan intervensi manual terapi dan mobilisasi sendi',
      'Melakukan chest physiotherapy (postural drainage, perkusi, vibrasi)',
      'Melakukan rehabilitasi neuromuskuler dan proprioseptif',
      'Melakukan evaluasi hasil terapi dan edukasi program latihan di rumah (HEP)',
    ],
  },
  NUTRISIONIS: {
    label: 'Nutrisionis (Dietisien/Ahli Gizi)',
    competencies: [
      'Melakukan skrining gizi pada pasien rawat inap dan rawat jalan',
      'Melakukan asesmen gizi komprehensif (Antropometri, Biokimia, Fisik/Klinis, Dietary, Riwayat Personal)',
      'Menegakkan diagnosis gizi (Problem, Etiologi, Sign/Symptom - PES)',
      'Merancang intervensi gizi dan preskripsi diet spesifik penyakit',
      'Melakukan edukasi dan konseling gizi terapeutik',
      'Melakukan Monitoring dan Evaluasi (Monev) asupan serta status gizi pasien',
      'Mengawasi proses penyelenggaraan makanan rumah sakit (food production & safety)',
      'Berkolaborasi dalam Tim Asuhan Gizi (TAG) atau Panitia Dukungan Gizi',
    ],
  },
  'PENATA ANASTESI': {
    label: 'Penata Anastesi',
    competencies: [
      'Melakukan pengkajian pra-anestesi dan persiapan pasien',
      'Mempersiapkan mesin anestesi, sirkuit napas, dan obat-obatan emergensi',
      'Melakukan kolaborasi/asistensi tindakan induksi anestesi (general/regional)',
      'Melakukan pemantauan intra-operatif (hemodinamik, saturasi, EKG, suhu)',
      'Melakukan asistensi pengakhiran anestesi dan ekstubasi',
      'Melakukan tatalaksana jalan napas (Airway Management) sesuai kewenangan',
      'Melakukan pemantauan dan stabilisasi pasien pasca-anestesi di Recovery Room (RR)',
      'Melakukan tindakan Resusitasi Jantung Paru (RJP) pada kegawatdaruratan',
    ],
  },
  'PETUGAS TRANSFUSI DARAH': {
    label: 'Petugas Transfusi Darah',
    competencies: [
      'Melakukan seleksi donor darah (anamnesis, pemeriksaan fisik dasar, Hb)',
      'Melakukan aftap (pengambilan darah donor) sesuai standar PPI',
      'Melakukan pemeriksaan golongan darah ABO dan Rhesus',
      'Melakukan uji silang serasi (Crossmatch) metode tabung atau gel test',
      'Melakukan skrining Infeksi Menular Lewat Transfusi Darah (IMLTD)',
      'Melakukan pemisahan dan pembuatan komponen darah (PRC, TC, FFP, Cryoprecipitate)',
      'Melakukan manajemen penyimpanan dan cold chain rantai darah',
      'Menyiapkan darah siap pakai untuk distribusi ke unit perawatan',
    ],
  },
  RADIOGRAFER: {
    label: 'Radiografer',
    competencies: [
      'Melakukan persiapan pasien untuk pemeriksaan radiologi',
      'Melakukan pemeriksaan radiografi konvensional tanpa kontras',
      'Melakukan pemeriksaan radiografi konvensional dengan bahan kontras',
      'Melakukan operasional dan pemeriksaan menggunakan CT-Scan',
      'Melakukan operasional dan pemeriksaan menggunakan MRI',
      'Melakukan pemeriksaan menggunakan pesawat Mobile X-Ray di ruang rawat/IGD/OK',
      'Melakukan tindakan proteksi radiasi sesuai standar BAPETEN',
      'Melakukan pengolahan citra medis (CR/DR, PACS) dan kendali mutu radiologi',
    ],
  },
  'REKAM MEDIS': {
    label: 'Perekam Medis dan Informasi Kesehatan (PMIK)',
    competencies: [
      'Melakukan manajemen pendaftaran pasien dan identifikasi',
      'Melakukan assembling dan analisis kuantitatif kelengkapan rekam medis',
      'Melakukan koding klinis morbiditas dan mortalitas menggunakan ICD-10',
      'Melakukan koding tindakan medis/operasi menggunakan ICD-9 CM',
      'Melakukan input data untuk klaim pembiayaan kesehatan (Casemix/INA-CBGs)',
      'Melakukan pengelolaan statistik rumah sakit (Sensus Harian, BOR, LOS, TOI, BTO)',
      'Melakukan manajemen retensi dan pemusnahan berkas rekam medis',
      'Melaksanakan pelepasan informasi medis (Visum et Repertum, asuransi) sesuai regulasi',
    ],
  },
  SANITARIAN: {
    label: 'Sanitarian (Sanitasi Lingkungan)',
    competencies: [
      'Melakukan pengawasan dan pemeriksaan kualitas air bersih dan air minum',
      'Melakukan pengelolaan dan pengawasan limbah cair domestik dan medis',
      'Melakukan pengelolaan limbah padat medis (B3) dan non-medis',
      'Melakukan pengendalian vektor dan binatang pembawa penyakit (pest control)',
      'Melakukan pengawasan higiene sanitasi makanan dan minuman (Gizi)',
      'Melakukan dekontaminasi dan desinfeksi ruangan perawatan/khusus',
      'Melakukan pemantauan kualitas udara ruang dan kebisingan',
      'Melakukan inspeksi sanitasi lingkungan rumah sakit secara berkala',
    ],
  },
  'FISIKAWAN MEDIK': {
    label: 'Fisikawan Medik',
    competencies: [
      'Melakukan kendali mutu (Quality Control) pesawat sinar-X radiologi',
      'Melakukan kalibrasi dan verifikasi dosimetri radiasi',
      'Melakukan perhitungan dosis radiasi pasien (patient dose monitoring)',
      'Melakukan proteksi dan keselamatan radiasi bagi pekerja dan lingkungan',
      'Melakukan evaluasi keselamatan radiasi pada instalasi radiologi',
      'Melakukan optimisasi protokol pemeriksaan radiologi diagnostik',
      'Mengelola survei meter dan alat ukur radiasi',
      'Menyusun laporan kendali mutu dan keselamatan radiasi ke BAPETEN',
    ],
  },
  SKM: {
    label: 'Kesehatan Masyarakat (SKM / Epidemiolog)',
    competencies: [
      'Melakukan surveilans epidemiologi penyakit menular dan tidak menular',
      'Melakukan penyelidikan epidemiologi dan investigasi Kejadian Luar Biasa (KLB)',
      'Melakukan identifikasi faktor risiko lingkungan dan perilaku kesehatan',
      'Melakukan perencanaan dan evaluasi program promosi kesehatan rumah sakit (PKRS)',
      'Melakukan analisis data kesehatan dan penyusunan profil kesehatan',
      'Melakukan edukasi dan advokasi pencegahan penyakit kepada masyarakat/pasien',
      'Mengkoordinasikan pencegahan dan pengendalian infeksi (PPI) di lingkungan RS',
      'Melakukan monitoring kepatuhan standar keselamatan kerja dan kesehatan kerja (K3RS)',
    ],
  },
};

export function getCompetenciesByProfesi(rawProfesi?: string): { label: string; items: RkkCompetencyItem[] } {
  const norm = String(rawProfesi || '').toUpperCase().trim();

  let matchKey = 'ATLM';

  if (norm.includes('APOTEKER') && !norm.includes('ASISTEN')) {
    matchKey = 'APOTEKER';
  } else if (norm.includes('ASISTEN') || norm.includes('TEKNIS KEFARMASIAN')) {
    matchKey = 'ASISTEN APOTEKER';
  } else if (norm.includes('LAB') || norm.includes('ATLM')) {
    matchKey = 'ATLM';
  } else if (norm.includes('FISIOTERAP')) {
    matchKey = 'FISIOTERAPIS';
  } else if (norm.includes('GIZI') || norm.includes('NUTRISI') || norm.includes('DIET')) {
    matchKey = 'NUTRISIONIS';
  } else if (norm.includes('ANASTESI') || norm.includes('ANESTESI')) {
    matchKey = 'PENATA ANASTESI';
  } else if (norm.includes('TRANSFUSI') || norm.includes('DARAH')) {
    matchKey = 'PETUGAS TRANSFUSI DARAH';
  } else if (norm.includes('RADIO') || norm.includes('RONTGEN')) {
    matchKey = 'RADIOGRAFER';
  } else if (norm.includes('REKAM') || norm.includes('PMIK')) {
    matchKey = 'REKAM MEDIS';
  } else if (norm.includes('SANIT')) {
    matchKey = 'SANITARIAN';
  } else if (norm.includes('FISIKA')) {
    matchKey = 'FISIKAWAN MEDIK';
  } else if (norm.includes('SKM') || norm.includes('MASYARAKAT')) {
    matchKey = 'SKM';
  }

  const def = RKK_COMPETENCY_MAP[matchKey] || RKK_COMPETENCY_MAP['ATLM'];
  return {
    label: def.label,
    items: def.competencies.map((text, idx) => ({
      no: idx + 1,
      kompetensi: text,
    })),
  };
}
