'use server';

import { NakesRepository } from '@/repositories/nakesRepository';
import { NakesMember } from '@/types/nakes';
import { revalidatePath } from 'next/cache';

export async function fetchAllNakesAction() {
  return await NakesRepository.getAllNakes();
}

export async function fetchNakesByIdAction(id: string) {
  return await NakesRepository.getNakesById(id);
}

export async function createNakesAction(data: Omit<NakesMember, 'id'>) {
  const newMember = await NakesRepository.createNakes(data);
  revalidatePath('/anggota');
  revalidatePath('/dashboard');
  return newMember;
}

export async function updateNakesAction(id: string, data: Partial<NakesMember>) {
  const updated = await NakesRepository.updateNakes(id, data);
  revalidatePath('/anggota');
  revalidatePath(`/anggota/${id}`);
  revalidatePath('/dashboard');
  return updated;
}

export async function deleteNakesAction(id: string) {
  const success = await NakesRepository.deleteNakes(id);
  revalidatePath('/anggota');
  revalidatePath('/dashboard');
  return success;
}

export async function fetchDashboardStatsAction() {
  return await NakesRepository.getDashboardStats();
}
