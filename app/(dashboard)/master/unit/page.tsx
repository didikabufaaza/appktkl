'use client';

import React, { useEffect, useState } from 'react';
import { MasterDataTable } from '@/components/master/MasterDataTable';
import { MasterItem } from '@/types/nakes';

export default function MasterUnitPage() {
  const [items, setItems] = useState<MasterItem[]>([]);

  useEffect(() => {
    fetch('/api/master?type=unit')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, []);

  return (
    <MasterDataTable
      title="Master Unit Pelayanan RSUD"
      description="Daftar instalasi dan unit kerja tempat penugasan tenaga kesehatan lain"
      items={items}
    />
  );
}
