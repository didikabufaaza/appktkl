'use client';

import React, { useEffect, useState } from 'react';
import { MasterDataTable } from '@/components/master/MasterDataTable';
import { MasterItem } from '@/types/nakes';

export default function MasterKomitePage() {
  const [items, setItems] = useState<MasterItem[]>([]);

  useEffect(() => {
    fetch('/api/master?type=komite')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, []);

  return (
    <MasterDataTable
      title="Master Sub Komite KTKL"
      description="Struktur sub-komite kredensial, mutu profesi, dan disiplin etika"
      items={items}
    />
  );
}
