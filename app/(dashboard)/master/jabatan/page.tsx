'use client';

import React, { useEffect, useState } from 'react';
import { MasterDataTable } from '@/components/master/MasterDataTable';
import { MasterItem } from '@/types/nakes';

export default function MasterJabatanPage() {
  const [items, setItems] = useState<MasterItem[]>([]);

  useEffect(() => {
    fetch('/api/master?type=jabatan')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, []);

  return (
    <MasterDataTable
      title="Master Jabatan Fungsional"
      description="Jabatan fungsional kesehatan untuk seluruh anggota komite"
      items={items}
    />
  );
}
