'use client';

import React, { useEffect, useState } from 'react';
import { MasterDataTable } from '@/components/master/MasterDataTable';
import { MasterItem } from '@/types/nakes';

export default function MasterPendidikanPage() {
  const [items, setItems] = useState<MasterItem[]>([]);

  useEffect(() => {
    fetch('/api/master?type=pendidikan')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, []);

  return (
    <MasterDataTable
      title="Master Jenjang Pendidikan"
      description="Klasifikasi tingkat pendidikan tenaga kesehatan (DIII, DIV, S1, Profesi, S2)"
      items={items}
    />
  );
}
