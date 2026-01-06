
import React, { useState, useEffect } from 'react';
import { storage, LeadRecord } from '../services/storage';

interface AdminDashboardProps {
    onExit: () => void;
}

interface DashboardStats {
    total: number;
    leads: number;
    conversion: string;
    byGender: { mulher?: number; mujer?: number; hombre: number };
    byTreatment: Record<string, number>;
    genderTreatment: {
        mujer: Record<string, number>;
        hombre: Record<string, number>;
    };
    symptoms: {
        mujer: Record<string, number>;
        hombre: Record<string, number>;
    };
    avgAgeWomen: number | string;
    avgAgeMen: number | string;
}

const KpiCard = ({ label, value, icon, highlight, sub }: { label: string; value: string | number; icon: string; highlight?: boolean; sub?: string }) => (
    <div className={`p-6 rounded-2xl border ${highlight ? 'bg-orange-50 border-[#EE8866]' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="text-2xl mb-2">{icon}</div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-3xl font-black ${highlight ? 'text-[#EE8866]' : 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
);

const BarMetric = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-bold text-gray-900">{value} ({pct}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [filter, setFilter] = useState<'all' | '30d' | '7d'>('all');

    useEffect(() => {
        if (isAuthenticated) {
            refetchData();
        }
    }, [isAuthenticated, filter]);

    const refetchData = () => {
        let data = storage.getAll();

        // Date Filter Logic
        if (filter !== 'all') {
            const now = new Date();
            const days = filter === '30d' ? 30 : 7;
            const cutoff = new Date(now.setDate(now.getDate() - days));
            data = data.filter(d => new Date(d.timestamp) >= cutoff);
        }

        setStats(analyzeData(data));
    };

    const handleClearData = () => {
        if (window.confirm('⚠️ PELIGRO: ¿Estás seguro de BORRAR TODOS los datos?\n\nEsta acción no se puede deshacer.')) {
            storage.clear();
            refetchData();
            alert('Datos borrados correctamente.');
        }
    };

    const getQuestionLabel = (id: string, gender: 'mujer' | 'hombre'): string => {
        const map: Record<string, string> = {
            '1': 'Frecuencia Urinaria',
            '2': 'Cantidad Pérdida',
            '3': 'Sensación Bulto', // Woman
            '4': 'Esfuerzo (Tos/Risa)', // Woman
            '5': 'Satisfacción Sexual', // Woman
            '103': 'Goteo Post-Miccional', // Man
            '104': 'Pérdida Post-Cirugía', // Man
            '105': 'Firmeza Erección', // Man
        };
        return map[id] || `Pregunta ${id}`;
    };

    const analyzeData = (data: LeadRecord[]): DashboardStats => {
        const total = data.length;
        const leads = data.filter(d => d.contact?.name).length;
        const conversion = total > 0 ? ((leads / total) * 100).toFixed(1) : '0';

        const byGender: { mujer: number; hombre: number } = { mujer: 0, hombre: 0 };
        const byTreatment: Record<string, number> = {};
        const genderTreatment: { mujer: Record<string, number>; hombre: Record<string, number> } = {
            mujer: {},
            hombre: {}
        };

        const symptoms: { mujer: Record<string, number>; hombre: Record<string, number> } = { mujer: {}, hombre: {} };

        let ageSumWomen = 0, ageCountWomen = 0;
        let ageSumMen = 0, ageCountMen = 0;

        data.forEach(r => {
            // Gender Split
            const g = r.gender;
            if (g === 'mujer' || g === 'hombre') {
                byGender[g] = (byGender[g] || 0) + 1;
            }

            // Treatment Split
            byTreatment[r.treatment] = (byTreatment[r.treatment] || 0) + 1;

            // Gender x Treatment
            if (g === 'mujer' || g === 'hombre') {
                if (!genderTreatment[g][r.treatment]) genderTreatment[g][r.treatment] = 0;
                genderTreatment[g][r.treatment]++;
            }

            // Symptom Analysis
            Object.entries(r.answers).forEach(([qId, score]) => {
                if (score >= 20) {
                    if (g === 'mujer' || g === 'hombre') {
                        const qName = getQuestionLabel(qId, g);
                        if (!symptoms[g][qName]) symptoms[g][qName] = 0;
                        symptoms[g][qName]++;
                    }
                }
            });

            // Age Analysis
            const age = parseInt(r.contact?.age);
            if (!isNaN(age) && age > 0) {
                if (g === 'mujer') {
                    ageSumWomen += age;
                    ageCountWomen++;
                } else if (g === 'hombre') {
                    ageSumMen += age;
                    ageCountMen++;
                }
            }
        });

        const avgAgeWomen = ageCountWomen > 0 ? Math.round(ageSumWomen / ageCountWomen) : '-';
        const avgAgeMen = ageCountMen > 0 ? Math.round(ageSumMen / ageCountMen) : '-';

        return { total, leads, conversion, byGender, byTreatment, genderTreatment, symptoms, avgAgeWomen, avgAgeMen };
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '1234') setIsAuthenticated(true);
        else alert('PIN Incorrecto');
    };

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-sm text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Acceso Profesional</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="PIN de Acceso"
                        className="w-full text-center text-2xl tracking-widest py-3 border-b-2 border-gray-200 outline-none focus:border-[#EE8866]"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entrar</button>
                </form>
                <button onClick={onExit} className="text-sm text-gray-400 hover:text-gray-600 underline">Volver a la App</button>
            </div>
        </div>
    );

    if (!stats) return <div>Cargando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-gray-900 text-white p-6 sticky top-0 z-50 shadow-lg">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold">pelviU <span className="text-[#EE8866] font-normal">| Panel de Control</span></h1>
                        <button onClick={handleClearData} className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">Resetear Todo</button>
                    </div>

                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1 text-sm rounded ${filter === 'all' ? 'bg-[#EE8866] text-white' : 'text-gray-400 hover:text-white'}`}>Todo</button>
                        <button onClick={() => setFilter('30d')} className={`px-4 py-1 text-sm rounded ${filter === '30d' ? 'bg-[#EE8866] text-white' : 'text-gray-400 hover:text-white'}`}>30 días</button>
                        <button onClick={() => setFilter('7d')} className={`px-4 py-1 text-sm rounded ${filter === '7d' ? 'bg-[#EE8866] text-white' : 'text-gray-400 hover:text-white'}`}>7 días</button>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={storage.exportCSV} className="text-sm bg-[#EE8866] hover:bg-[#d67657] px-4 py-2 rounded-lg font-bold transition-colors">Descargar CSV</button>
                        <button onClick={onExit} className="text-sm text-gray-400 hover:text-white">Salir</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Tests Totales" value={stats.total} icon="📝" />
                    <KpiCard label="Leads Captados" value={stats.leads} icon="👤" highlight />
                    <KpiCard label="Edad Media (M)" value={`${stats.avgAgeWomen}`} icon="👩" sub="Mujeres" />
                    <KpiCard label="Edad Media (H)" value={`${stats.avgAgeMen}`} icon="👨" sub="Hombres" />
                </div>


                {/* AI ANALYSIS SECTION */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🧠</div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                                <span className="text-xl">✨</span>
                            </div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">Análisis de Mercado & Consumidor (IA)</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Avatar */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-3">Avatar Detectado</p>
                                <p className="text-lg font-medium leading-relaxed">
                                    {(() => {
                                        const w = stats.byGender.mujer || 0;
                                        const m = stats.byGender.hombre || 0;
                                        const total = w + m;
                                        if (total === 0) return "Esperando datos...";
                                        const wPct = (w / total) * 100;
                                        if (wPct > 65) return "Mujer activa, consciente de su salud pélvica, buscando prevención o recuperación post-parto.";
                                        if (wPct < 35) return "Hombre preocupado por salud funcional, post-quirúrgica o rendimiento sexual.";
                                        return "Perfil Mixto: Hombres y Mujeres con interés compartido en salud pélvica preventiva y correctiva.";
                                    })()}
                                </p>
                            </div>

                            {/* Pain Points */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-rose-300 mb-3">Dolores Principales (Pain Points)</p>
                                <ul className="space-y-2">
                                    {(() => {
                                        const allSymptoms = { ...stats.symptoms.mujer, ...stats.symptoms.hombre };
                                        const sorted = Object.entries(allSymptoms).sort(([, a], [, b]) => b - a).slice(0, 3);
                                        if (sorted.length === 0) return <li className="text-white/50 italic">Sin suficientes datos de síntomas severos.</li>;
                                        return sorted.map(([name, count]) => (
                                            <li key={name} className="flex items-center gap-2">
                                                <span className="text-rose-400">⚠️</span>
                                                <span>{name}</span>
                                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60">{count} casos</span>
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            </div>

                            {/* Marketing Strategy */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">Estrategia de Mensaje</p>
                                <p className="text-sm leading-relaxed text-white/80">
                                    {(() => {
                                        const level3 = (stats.byTreatment['Nivel 3 (Complejo)'] || 0) + (stats.byTreatment['Nivel 2 (Moderado)'] || 0);
                                        const prev = (stats.byTreatment['Plan Prevención'] || 0) + (stats.byTreatment['Nivel 1 (Leve)'] || 0);
                                        if (level3 > prev) return "💡 Enfoque CLÍNICO: Tu audiencia sufre patologías avanzadas. Usa palabras como 'Recuperación', 'Solución Médica', 'Sin Cirugía'. Muestra testimonios de casos de éxito severos.";
                                        return "💡 Enfoque LIFESTYLE: Tu audiencia busca mejora y prevención. Usa palabras como 'Potencia', 'Control', 'Bienestar', 'Intimidad'. Vende la transformación positiva y el biohacking pélvico.";
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* Gender Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Distribución por Género</h3>
                        <div className="space-y-4">
                            <BarMetric label="Mujeres" value={stats.byGender.mujer || 0} total={stats.total} color="bg-rose-400" />
                            <BarMetric label="Hombres" value={stats.byGender.hombre || 0} total={stats.total} color="bg-blue-500" />
                        </div>
                    </div>

                    {/* Global Treatment Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Tratamientos Recomendados (Global)</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.byTreatment).map(([name, count]) => (
                                <BarMetric key={name} label={name} value={count} total={stats.total} color="bg-[#EE8866]" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advanced Split: Program by Gender */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Programas por Sexo</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4">Mujeres</h4>
                            <div className="space-y-3">
                                {Object.entries(stats.genderTreatment.mujer).length === 0 && <p className="text-sm text-gray-400 italic">Sin datos</p>}
                                {Object.entries(stats.genderTreatment.mujer).map(([t, c]) => (
                                    <BarMetric key={t} label={t} value={c} total={stats.byGender.mujer || 0} color="bg-rose-400" />
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4">Hombres</h4>
                            <div className="space-y-3">
                                {Object.entries(stats.genderTreatment.hombre).length === 0 && <p className="text-sm text-gray-400 italic">Sin datos</p>}
                                {Object.entries(stats.genderTreatment.hombre).map(([t, c]) => (
                                    <BarMetric key={t} label={t} value={c} total={stats.byGender.hombre || 0} color="bg-blue-500" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Symptom Heatmap */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Síntomas Críticos (+Frecuentes)</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4">Mujeres (&gt;20 pts)</h4>
                            <div className="space-y-3">
                                {Object.entries(stats.symptoms.mujer).length === 0 && <p className="text-sm text-gray-400 italic">Sin síntomas severos registrados</p>}
                                {Object.entries(stats.symptoms.mujer)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([s, c]) => (
                                        <BarMetric key={s} label={s} value={c} total={stats.byGender.mujer || 0} color="bg-rose-300" />
                                    ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-4">Hombres (&gt;20 pts)</h4>
                            <div className="space-y-3">
                                {Object.entries(stats.symptoms.hombre).length === 0 && <p className="text-sm text-gray-400 italic">Sin síntomas severos registrados</p>}
                                {Object.entries(stats.symptoms.hombre)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([s, c]) => (
                                        <BarMetric key={s} label={s} value={c} total={stats.byGender.hombre || 0} color="bg-blue-400" />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
