'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardStats } from '@/types/nakes';

interface DashboardChartsProps {
  stats: DashboardStats;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

export function DashboardCharts({ stats }: DashboardChartsProps) {
  // Chart 1: Bar Chart (Distribusi Profesi) - Render ALL professions
  const profesiData = stats.profesiDistribution;

  // Chart 2: Pie Chart (Distribusi Pendidikan)
  const pendidikanData = stats.pendidikanDistribution;

  // Chart 3: Line Chart (Tren Pendaftaran)
  const lineData = stats.monthlyRegistration;

  // Chart 4: Area Chart (Status Kepegawaian)
  const areaData = stats.statusDistribution;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Distribusi Anggota per Profesi</h3>
            <p className="text-xs text-slate-400">Jumlah anggota berdasarkan rumpun profesi (Bar Chart)</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profesiData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} interval={0} angle={-35} textAnchor="end" />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} name="Jumlah Anggota" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Komposisi Pendidikan Terakhir</h3>
            <p className="text-xs text-slate-400">Persentase tingkat pendidikan (Pie Chart)</p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pendidikanData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                }
              >
                {pendidikanData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Tren Pendaftaran Anggota Baru</h3>
            <p className="text-xs text-slate-400">Pertumbuhan registrasi bulanan (Line Chart)</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
              />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} name="Pendaftaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Sebaran Status Kepegawaian</h3>
            <p className="text-xs text-slate-400">Distribusi PNS, PPPK, BLUD (Area Chart)</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStatus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
              />
              <Area type="monotone" dataKey="count" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStatus)" name="Jumlah" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
